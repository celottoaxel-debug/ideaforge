// Textes du réel (PNG transparents) : accroche, pastilles d'étapes, appel à commenter. Lit hook.txt et steps.json.
import { chromium } from '/usr/local/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const font = 'data:font/ttf;base64,' + fs.readFileSync('Geist-SemiBold.ttf').toString('base64');
const css = `@font-face{font-family:G;src:url(${font})} body{margin:0;background:transparent;font-family:G,'Noto Color Emoji';}`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 400 } });
async function shot(name, html) {
  await p.setContent(`<style>${css}</style><div id=w style="display:inline-block">${html}</div>`);
  await p.evaluate(() => document.fonts.ready);
  await (await p.$('#w')).screenshot({ path: name, omitBackground: true });
}
const pill = (t, fs_ = 44) => `<div style="padding:4px"><div style="background:#fff;color:#0b0b0b;border-radius:18px;padding:12px 26px;font-size:${fs_}px;letter-spacing:-0.5px;box-shadow:0 4px 18px rgba(0,0,0,.35)">${t}</div></div>`;
const steps = JSON.parse(fs.readFileSync('steps.json'));
for (let i = 0; i < steps.length; i++) await shot(`pill${i + 1}.png`, pill(`${i + 1}) ${steps[i]}`));
const hook = fs.readFileSync('hook.txt', 'utf8').trim().replace(/\n/g, '<br>');
await shot('hook.png', `<div style="width:1000px;text-align:center;color:#fff;font-size:66px;line-height:1.18;letter-spacing:-1px;text-shadow:0 3px 14px rgba(0,0,0,.6);padding:10px 40px">${hook}</div>`);
const cta = JSON.parse(fs.readFileSync('cta.json'));
await shot('cta1.png', pill(cta[0], 50));
await shot('cta2.png', pill(cta[1], 50));
await b.close();
