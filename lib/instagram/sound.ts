// Bande son des réels, fabriquée par le code (libre de droits, différente pour chaque réel) :
// un beat électro calé sur le tempo du montage, plus des « whoosh », impacts et montée.
import { writeFile } from "node:fs/promises";

const SR = 44100;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
function gauss(r: () => number) { const u = r() || 1e-9, v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

async function saveWav(file: string, x: Float32Array) {
  const n = x.length, buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, x[i])) * 32767 | 0;
    buf.writeInt16LE(v, 44 + i * 4); buf.writeInt16LE(v, 46 + i * 4);
  }
  await writeFile(file, buf);
}

function add(out: Float32Array, x: Float32Array, pos: number, gain = 1) {
  const i0 = Math.round(pos * SR);
  for (let i = 0; i < x.length && i0 + i < out.length; i++) if (i0 + i >= 0) out[i0 + i] += x[i] * gain;
}

function kick(punch: number) {
  const n = Math.round(SR * 0.45), x = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * (45 + punch * Math.exp(-t / 0.035)) / SR; x[i] = Math.tanh(2.2 * Math.sin(ph) * Math.exp(-t / 0.16)) * 0.95; }
  return x;
}
function clap(r: () => number) {
  const n = Math.round(SR * 0.3), x = new Float32Array(n); let prev = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, g = gauss(r), d = g - prev; prev = g; const e = Math.exp(-t / 0.06) + (t > 0.012 ? 0.6 * Math.exp(-(t - 0.012) / 0.01) : 0); x[i] = d * e * 0.33; }
  return x;
}
function hat(r: () => number, open = false) {
  const n = Math.round(SR * (open ? 0.22 : 0.08)), x = new Float32Array(n); let a = 0, b = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, g = gauss(r), d1 = g - a; a = g; const d2 = d1 - b; b = d1; x[i] = d2 * Math.exp(-t / (open ? 0.08 : 0.02)) * (1 - Math.exp(-t / 0.001)) * 0.11; }
  return x;
}
function bass(f: number, dur: number) {
  const n = Math.round(SR * dur), x = new Float32Array(n), k = Math.round(SR / 900); const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR, s = Math.sin(2 * Math.PI * f * t); raw[i] = Math.sign(s) * 0.5 + s * 0.5; }
  let acc = 0; for (let i = 0; i < n; i++) { acc += raw[i] - (i >= k ? raw[i - k] : 0); const t = i / SR; x[i] = (acc / k) * Math.exp(-t / 0.18) * (1 - Math.exp(-t / 0.005)) * 0.45; }
  return x;
}
function pad(freqs: number[], dur: number, bright: number) {
  const n = Math.round(SR * dur), x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR; let v = 0;
    for (const f of freqs) v += Math.sin(2 * Math.PI * f * t + Math.sin(2 * Math.PI * 0.3 * t)) + bright * Math.sin(2 * Math.PI * f * 2.003 * t);
    x[i] = (v / freqs.length) * Math.min(t / 0.4, 1) * Math.min((dur - t) / 0.3, 1) * 0.1;
  }
  return x;
}
function whoosh(r: () => number) {
  const L = 0.45, n = Math.round(SR * L), x = new Float32Array(n); let a = 0, m = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, c = 0.02 + 0.25 * Math.sin(Math.PI * t / L) ** 2; a += c * (gauss(r) - a); x[i] = a * Math.sin(Math.PI * t / L) ** 1.5; m = Math.max(m, Math.abs(x[i])); }
  for (let i = 0; i < n; i++) x[i] = (x[i] / m) * 0.7;
  return x;
}
function impact(r: () => number) {
  const n = Math.round(SR * 1.2), x = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; ph += 2 * Math.PI * (30 + 90 * Math.exp(-t / 0.08)) / SR; x[i] = Math.tanh((Math.sin(ph) * Math.exp(-t / 0.45) + gauss(r) * Math.exp(-t / 0.03) * 0.4) * 1.5) * 0.9; }
  return x;
}
function riser(r: () => number, L = 1.5) {
  const n = Math.round(SR * L), x = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) { const t = i / SR, p = t / L; ph += 2 * Math.PI * (200 + 1800 * p * p) / SR; x[i] = Math.sin(ph) * 0.25 * p * p + gauss(r) * 0.15 * p ** 3; }
  return x;
}

// Accords (rapports de fréquence) : plusieurs progressions pour varier les morceaux.
const PROGS = [
  [[1, 1.189, 1.498], [0.794, 1, 1.189], [0.891, 1.122, 1.335], [0.749, 0.944, 1.122]],
  [[1, 1.189, 1.498], [0.667, 0.794, 1], [0.749, 0.891, 1.122], [0.891, 1.059, 1.335]],
  [[1, 1.26, 1.498], [0.841, 1, 1.26], [0.667, 0.841, 1], [0.749, 0.944, 1.122]],
  [[1, 1.189, 1.414], [1.122, 1.335, 1.682], [0.891, 1.059, 1.335], [0.794, 1, 1.189]],
];
const ROOTS = [49, 51.9, 55, 58.3, 61.7, 65.4];

export type Soundtrack = { bpm: number; label: string };

/** Choisit le style musical d'un réel à partir de son numéro (toujours le même pour un réel donné, différent d'un réel à l'autre). */
export function pickSoundtrack(seed: number): Soundtrack & { root: number; prog: number; swing: boolean; open: boolean; bright: number } {
  const r = rng(seed * 7919 + 13);
  const bpm = [112, 118, 122, 126, 128][Math.floor(r() * 5)];
  const root = ROOTS[Math.floor(r() * ROOTS.length)], prog = Math.floor(r() * PROGS.length);
  return { bpm, root, prog, swing: r() < 0.4, open: r() < 0.5, bright: 0.3 + r() * 0.5, label: `beat ${bpm} BPM #${seed}` };
}

/** Fabrique la bande son complète (wav) : musique + effets aux instants donnés. */
export async function renderSoundtrack(file: string, seed: number, total: number, cuts: number[], drops: number[]) {
  const st = pickSoundtrack(seed), r = rng(seed * 104729 + 7), B = 60 / st.bpm;
  const out = new Float32Array(Math.round((total + 1.5) * SR));
  const prog = PROGS[st.prog], K = kick(90 + r() * 50);
  const bars = Math.ceil(total / (4 * B)) + 1;
  for (let bar = 0; bar < bars; bar++) {
    const t0 = bar * 4 * B, ch = prog[bar % 4];
    add(out, pad(ch.map((c) => st.root * 4 * c), 4 * B, st.bright), t0);
    for (let b = 0; b < 4; b++) {
      const tb = t0 + b * B;
      add(out, K, tb);
      if (b % 2 === 1) add(out, clap(r), tb);
      add(out, hat(r, st.open && b % 2 === 1), tb + (st.swing ? 0.58 : 0.5) * B);
      if (bar > 0) add(out, hat(r), tb + 0.25 * B, 0.6);
      add(out, bass(st.root * ch[0], B * 0.45), tb + 0.5 * B);
      if (bar % 2 === 1 && b === 3) add(out, bass(st.root * ch[0] * 1.5, B * 0.4), tb + 0.75 * B);
    }
  }
  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * 1.3) * 0.8;
  const W = whoosh(r), I = impact(r);
  for (const c of cuts) add(out, W, c - 0.22, 0.75);
  for (const d of drops) add(out, I, d, 0.85);
  if (drops.length > 1) add(out, riser(r), drops[drops.length - 1] - 1.5, 0.6);
  // fondu de sortie
  const fo = Math.round(0.6 * SR), end = Math.round(total * SR);
  for (let i = 0; i < out.length; i++) { const k = end - i; out[i] *= i > end ? 0 : k < fo ? k / fo : 1; }
  for (let i = 0; i < out.length; i++) out[i] = Math.max(-0.97, Math.min(0.97, out[i]));
  await saveWav(file, out.subarray(0, end));
  return st;
}
