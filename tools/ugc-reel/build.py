"""Monte le réel « face caméra » : accroche (3 s) → toi en haut + chrono + étape + écran IdeaForge en bas → fin « Commente ».
Usage : [HOOK_LEN=5] python3 build.py face.mp4 <debut_plan_principal_en_s> [mirror] [music]
Entrées attendues dans le dossier : screen.webm, marks.json, hook.png, cta1.png, cta2.png, pill1..7.png, Geist-SemiBold.ttf, yunet.onnx, beat.wav (si music)."""
import json, subprocess, sys, glob, os
import cv2

face = sys.argv[1]; FACE_MAIN = float(sys.argv[2]); flags = sys.argv[3:]
END_CLIP = os.environ.get('END_CLIP', '')  # vidéo d'écran de téléphone pour la fin (facultatif)
END_START = float(os.environ.get('END_START', '4.5'))
mirror = 'mirror' in flags; music = 'music' in flags
m = dict(json.load(open('marks.json')))
# HOOK_LEN : durée de l'accroche (laisse finir le geste d'intro : casque, compte 1-2-3...). Le plan principal devrait commencer à HOOK_LEN pour un montage continu.
S0 = m['s1']; HOOK = float(os.environ.get('HOOK_LEN', '3.0')); main_len = m['end'] - S0; END_LEN = 6.5; TOTAL = HOOK + main_len + END_LEN
keys = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 'end']
win = [(m[keys[i]] - S0, m[keys[i + 1]] - S0) for i in range(7)]

# 1. Suivi du visage (5 images/s) pour garder la personne bien cadrée
os.makedirs('fr', exist_ok=True)
for f in glob.glob('fr/*.jpg'): os.remove(f)
vf = 'fps=5,scale=540:960' + (',hflip' if mirror else '')
subprocess.run(['ffmpeg', '-v', 'error', '-i', face, '-vf', vf, 'fr/%04d.jpg'], check=True)
det = cv2.FaceDetectorYN.create('yunet.onnx', '', (540, 960), 0.7)
pts = []
for i, f in enumerate(sorted(glob.glob('fr/*.jpg'))):
    im = cv2.imread(f); det.setInputSize((im.shape[1], im.shape[0])); _, fs = det.detect(im)
    if fs is not None and len(fs):
        x, y, w, h = max(fs, key=lambda r: r[2] * r[3])[:4]; pts.append((i / 5, float(x + w / 2) * 2, float(y + h / 2) * 2))
    else: pts.append((i / 5, None, None))
ok = [p for p in pts if p[1] is not None]
mx = sorted(p[1] for p in ok)[len(ok) // 2] if ok else 540; my = sorted(p[2] for p in ok)[len(ok) // 2] if ok else 900
xs = [p[1] if p[1] is not None else mx for p in pts]; ys = [p[2] if p[2] is not None else my for p in pts]
sm = lambda a, k=3: [sum(a[max(0, i - k):i + k + 1]) / len(a[max(0, i - k):i + k + 1]) for i in range(len(a))]
xs, ys = sm(xs), sm(ys)
W, H = 900, 750
def win_at(i):
    return int(min(max(xs[i] - W / 2, 0), 1080 - W)), int(min(max(ys[i] - 0.58 * H, 0), 1920 - H))
lines = []
for i, p in enumerate(pts):
    t = p[0] - FACE_MAIN
    if t < 0 or t > main_len + 1: continue
    x, y = win_at(i); lines.append(f"{t:.2f} crop@fm x {x}, crop@fm y {y};")
open('crop_main.cmd', 'w').write('\n'.join(lines))
i0 = min(range(len(pts)), key=lambda i: abs(pts[i][0] - FACE_MAIN)); x0, y0 = win_at(i0)
hy = [ys[i] for i, p in enumerate(pts) if p[0] < HOOK] or [my]; hook_y = int(min(max(sum(hy) / len(hy) - 0.45 * 1180, 0), 1920 - 1180))
ey = [ys[i] for i, p in enumerate(pts) if FACE_MAIN + main_len <= p[0] < FACE_MAIN + main_len + END_LEN] or [my]
ex = [xs[i] for i, p in enumerate(pts) if FACE_MAIN + main_len <= p[0] < FACE_MAIN + main_len + END_LEN] or [mx]
end_x = int(min(max(sum(ex) / len(ex) - 450, 0), 180)); end_y = int(min(max(sum(ey) / len(ey) - 0.45 * 1600, 0), 320))

# 2. Montage
FL = ',hflip' if mirror else ''
inp = ['-i', face, '-i', 'screen.webm', '-loop', '1', '-i', 'hook.png', '-loop', '1', '-i', 'cta1.png', '-loop', '1', '-i', 'cta2.png']
for i in range(7): inp += ['-loop', '1', '-i', f'pill{i + 1}.png']
if music: inp += ['-i', 'beat.wav']
if END_CLIP:
    from PIL import Image, ImageDraw
    mk = Image.new('L', (700, 1516), 0); ImageDraw.Draw(mk).rounded_rectangle([0, 0, 699, 1515], radius=70, fill=255); mk.save('phone_mask.png')
    inp += ['-i', END_CLIP, '-loop', '1', '-i', 'phone_mask.png']
    ei = 13 if music else 12
fc = [
    f"[0:v]trim=0:{HOOK},setpts=PTS-STARTPTS,fps=30{FL},crop=1080:1180:0:{hook_y},setsar=1[hv]",
    f"color=c=black:s=1080x1920:r=30:d={HOOK}[hbg]",
    "[hbg][hv]overlay=0:560[h1]",
    f"[h1][2:v]overlay=(W-w)/2:300:shortest=1,trim=0:{HOOK},setpts=PTS-STARTPTS,format=yuv420p[H]",
    f"[0:v]trim={FACE_MAIN}:{FACE_MAIN + main_len},setpts=PTS-STARTPTS,fps=30{FL},sendcmd=f=crop_main.cmd,crop@fm={W}:{H}:{x0}:{y0},scale=1080:900,setsar=1[fv]",
    f"[1:v]trim={S0}:{m['end']},setpts=PTS-STARTPTS,fps=30,scale=1080:860,setsar=1[sv]",
    f"color=c=black:s=1080x1920:r=30:d={main_len}[mbg]",
    "[mbg][fv]overlay=0:0[m1]",
    "[m1][sv]overlay=0:1060:shortest=1[m2]",
    "[m2]drawtext=fontfile=Geist-SemiBold.ttf:fontsize=66:fontcolor=white:x=(w-text_w)/2:y=912:text='00\\:%{eif\\:trunc(t)\\:d\\:2}.%{eif\\:mod(trunc(t*100)\\,100)\\:d\\:2}'[m3]",
]
last = 'm3'
for i, (a, b) in enumerate(win):
    fc.append(f"[{last}][{5 + i}:v]overlay=(W-w)/2:990:enable='between(t,{a:.3f},{b:.3f})'[p{i}]"); last = f'p{i}'
fc += [
    f"[{last}]trim=0:{main_len:.3f},setpts=PTS-STARTPTS,format=yuv420p[M]",
]
if END_CLIP:
    # Fin : l'écran du téléphone dans un cadre arrondi, sur un fond flouté de la même vidéo
    fc += [
        f"[{ei}:v]trim={END_START}:{END_START + END_LEN},setpts=PTS-STARTPTS,fps=30,split[ea][eb]",
        "[ea]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,gblur=sigma=40,eq=brightness=-0.25[eg]",
        f"[eb]scale=700:1516,format=rgba[ep]",
        f"[ep][{ei + 1}:v]alphamerge[epm]",
        "[eg][epm]overlay=(W-w)/2:330[e0]",
        "[e0][3:v]overlay=(W-w)/2:110[e1]",
        f"[e1][4:v]overlay=(W-w)/2:220,trim=0:{END_LEN},setpts=PTS-STARTPTS,format=yuv420p[E]",
    ]
else:
    fc += [
        f"[0:v]trim={FACE_MAIN + main_len}:{FACE_MAIN + main_len + END_LEN},setpts=PTS-STARTPTS,fps=30{FL},crop=900:1600:{end_x}:{end_y},scale=1080:1920,setsar=1,eq=brightness=-0.04[ev]",
        "[ev][3:v]overlay=(W-w)/2:760:shortest=1[e1]",
        f"[e1][4:v]overlay=(W-w)/2:880,trim=0:{END_LEN},setpts=PTS-STARTPTS,format=yuv420p[E]",
    ]
fc.append("[H][M][E]concat=n=3:v=1:a=0[vout]")
if music: fc.append(f"[12:a]atrim=0:{TOTAL:.3f},afade=t=out:st={TOTAL - 1:.3f}:d=1,volume=0.8[aout]")
out = 'out-musique.mp4' if music else 'out.mp4'
args = ['ffmpeg', '-y', '-v', 'error'] + inp + ['-filter_complex', ';'.join(fc), '-map', '[vout]']
if music: args += ['-map', '[aout]', '-c:a', 'aac', '-b:a', '160k']
args += ['-t', f'{TOTAL:.3f}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', out]
r = subprocess.run(args, capture_output=True, text=True)
print(json.dumps({'ok': r.returncode == 0, 'out': out, 'total': round(TOTAL, 2), 'main': round(main_len, 2), 'err': r.stderr[-800:]}))
