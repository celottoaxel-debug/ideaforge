"""Beat électro libre de droits. Usage : python3 synth.py sortie.wav BPM mesures note_racine seed"""
import numpy as np, wave, sys
SR = 44100
seed = int(sys.argv[5]) if len(sys.argv) > 5 else 7
rng = np.random.default_rng(seed)
def save(name, x):
    x = np.clip(x, -1, 1); y = (x * 32767).astype(np.int16); y = np.stack([y, y], 1)
    w = wave.open(name, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(y.tobytes()); w.close()
def env(n, a, d): t = np.arange(n) / SR; return np.exp(-t / d) * (1 - np.exp(-t / max(a, 1e-4)))
def kick(n=int(SR * .45)):
    t = np.arange(n) / SR; f = 45 + 110 * np.exp(-t / 0.035); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.tanh(2.2 * np.sin(ph) * np.exp(-t / 0.16)) * 0.95
def clap(n=int(SR * .3)):
    no = rng.standard_normal(n); t = np.arange(n) / SR
    e = np.exp(-t / 0.06) + 0.6 * np.exp(-np.maximum(t - 0.012, 0) / 0.01) * (t > 0.012)
    return np.diff(np.concatenate([[0], no])) * e * 0.35
def hat(n=int(SR * .08)):
    no = rng.standard_normal(n); no = np.diff(np.concatenate([[0], np.diff(np.concatenate([[0], no]))]))
    return no * env(n, 0.001, 0.02) * 0.12
def bass(freq, n):
    t = np.arange(n) / SR; x = np.sign(np.sin(2 * np.pi * freq * t)) * 0.5 + np.sin(2 * np.pi * freq * t) * 0.5
    k = int(SR / 900); x = np.convolve(x, np.ones(k) / k, 'same'); return x * env(n, 0.005, 0.18) * 0.45
def pad(freqs, n):
    t = np.arange(n) / SR; x = sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.3 * t)) + 0.5 * np.sin(2 * np.pi * f * 2.003 * t) for f in freqs) / len(freqs)
    a = np.minimum(t / 0.4, 1) * np.minimum((n / SR - t) / 0.3, 1); return x * a * 0.10
def mix(buf, x, pos):
    i = int(pos * SR); j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i]
BPM = float(sys.argv[2]); B = 60 / BPM; bars = int(sys.argv[3]); root = float(sys.argv[4])
out = np.zeros(int((bars * 4 * B + 1) * SR))
progs = [[[1, 1.189, 1.498], [0.794, 1, 1.189], [0.891, 1.122, 1.335], [0.749, 0.944, 1.122]],
         [[1, 1.189, 1.498], [0.667, 0.794, 1], [0.749, 0.891, 1.122], [0.891, 1.059, 1.335]],
         [[1, 1.26, 1.498], [0.841, 1, 1.26], [0.667, 0.841, 1], [0.749, 0.944, 1.122]]]
prog = progs[seed % len(progs)]
for bar in range(bars):
    t0 = bar * 4 * B; ch = prog[bar % 4]
    mix(out, pad([root * 4 * c for c in ch], int(4 * B * SR)), t0)
    for b in range(4):
        tb = t0 + b * B
        if bar > 0 or b >= 2: mix(out, kick(), tb)
        if b in (1, 3) and bar > 0: mix(out, clap(), tb)
        if bar > 0: mix(out, hat(), tb + 0.5 * B)
        mix(out, bass(root * ch[0], int(B * 0.45 * SR)), tb + 0.5 * B)
        if bar % 2 == 1 and b == 3: mix(out, bass(root * ch[0] * 1.5, int(B * 0.4 * SR)), tb + 0.75 * B)
save(sys.argv[1], np.tanh(out * 1.3) * 0.85)
