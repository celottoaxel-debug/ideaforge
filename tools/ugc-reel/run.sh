#!/usr/bin/env bash
# Fabrique un réel « face caméra » IdeaForge de bout en bout (dans le bac à sable Higgsfield).
# Usage : bash run.sh <url_video_face_camera> </idea/chemin> "<accroche ligne1|ligne2>" <debut_plan_s> <seed> [mirror]
set -euo pipefail
FACE_URL="$1"; IDEA="$2"; HOOK="$3"; START="$4"; SEED="$5"; MIRROR="${6:-}"
D=$(cd "$(dirname "$0")" && pwd)
W="$HOME/ugc-run-$SEED"; rm -rf "$W"; mkdir -p "$W"; cd "$W"
cp "$D"/*.mjs "$D"/*.py .
curl -sL -o Geist-SemiBold.ttf https://cdn.jsdelivr.net/npm/geist@1.3.1/dist/fonts/geist-sans/Geist-SemiBold.ttf
curl -sL -o yunet.onnx https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx
curl -sL -o face.mp4 "$FACE_URL"
IDEA_PATH="$IDEA" USED="${USED:-}" node rec.mjs > /dev/null
python3 - "$HOOK" <<'PY'
import json, sys
m = dict(json.load(open('marks.json'))); secs = round(m['end'] - m['s1'])
open('hook.txt', 'w').write(sys.argv[1].replace('{s}', str(secs)).replace('|', '\n'))
json.dump(["Va sur « ideaforges.io »", "Descends au catalogue", "Clique « Meilleur score » 🏆", "Choisis ton idée", "Regarde le score et le potentiel", "Calcule tes revenus", "Débloque ta fiche offerte 🎁"], open('steps.json', 'w'), ensure_ascii=False)
json.dump(["Commente « IDÉE »", "et je t'envoie le lien 🤝"], open('cta.json', 'w'), ensure_ascii=False)
PY
node ov.mjs
python3 synth.py beat.wav $((118 + SEED % 10)) 28 $(python3 -c "print([49,51.9,55,58.3,61.7][$SEED % 5])") "$SEED"
python3 build.py face.mp4 "$START" $MIRROR
python3 build.py face.mp4 "$START" $MIRROR music
ls -la out.mp4 out-musique.mp4
cat chosen.json; echo
echo "DONE $W"
