// Enregistre l'écran d'IdeaForge pour un réel « face caméra » : accueil → catalogue → Meilleur score → idée → score → calculateur → fiche offerte.
// Usage : IDEA_PATH=/idea/xxx node rec.mjs   (écrit screen.webm + marks.json)
import { chromium } from '/usr/local/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const SITE = 'https://ideaforges.io';
const IDEA = process.env.IDEA_PATH || '';
const USED = (process.env.USED || '').split(',').map((x) => x.trim()).filter(Boolean);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 1019 }, recordVideo: { dir: 'vid', size: { width: 1280, height: 1019 } } });
const t0 = Date.now();
const p = await ctx.newPage();
const marks = [];
const mark = (k) => marks.push([k, (Date.now() - t0) / 1000]);
const cursor = `if(!document.getElementById('fc')){const c=document.createElement('div');c.id='fc';c.style.cssText='position:fixed;z-index:2147483647;left:640px;top:600px;width:26px;height:26px;pointer-events:none;transition:left .7s cubic-bezier(.3,.7,.2,1),top .7s cubic-bezier(.3,.7,.2,1);';c.innerHTML='<svg width="26" height="26" viewBox="0 0 24 24"><path d="M3 2l7 19 2.5-8L21 10z" fill="#fff" stroke="#000" stroke-width="1.5"/></svg>';document.body.appendChild(c);}`;
async function point(x, y) {
  await p.evaluate(([x, y, c]) => { eval(c); const e = document.getElementById('fc'); e.style.left = x + 'px'; e.style.top = y + 'px'; }, [x, y, cursor]);
  await p.waitForTimeout(800);
  await p.evaluate(() => document.getElementById('fc').animate([{ transform: 'scale(1)' }, { transform: 'scale(.75)' }, { transform: 'scale(1)' }], { duration: 250 }));
}
async function pointEl(el) { const bb = await el.boundingBox(); await point(bb.x + bb.width / 2, bb.y + bb.height / 2); }
const smooth = (y, ms) => p.evaluate(([y, ms]) => new Promise(r => { const s = scrollY, d = y - s, t = performance.now(); (function f(n) { const k = Math.min((n - t) / ms, 1), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; scrollTo(0, s + d * e); k < 1 ? requestAnimationFrame(f) : r(); })(t); }), [y, ms]);
const h2 = (re, off) => p.evaluate(([re, off]) => { const h = [...document.querySelectorAll('h2')].find(h => new RegExp(re, 'i').test(h.innerText)); return h ? h.getBoundingClientRect().top + scrollY - off : scrollY + 700; }, [re, off]);

await p.goto(SITE + '/', { waitUntil: 'load' });
await p.evaluate(cursor);
await p.waitForTimeout(1200);
mark('s1');
await p.waitForTimeout(2500);
await smooth(600, 1200);
await p.waitForTimeout(400);
mark('s2');
await smooth(await p.evaluate(() => document.querySelector('#catalogue').getBoundingClientRect().top + scrollY - 20), 2200);
await p.waitForTimeout(1800);
mark('s3');
const btn = await p.$('button:has-text("Meilleur score")');
await btn.scrollIntoViewIfNeeded();
await p.evaluate(cursor);
await pointEl(btn);
await btn.click();
await p.waitForTimeout(2600);
await smooth(await p.evaluate(() => scrollY + 220), 900);
await p.waitForTimeout(800);
mark('s4');
let card = IDEA ? await p.$(`a[href="${IDEA}"]`) : null;
if (!card) {
  // Première idée du filtre « Meilleur score » jamais utilisée dans un réel
  for (const a of await p.$$('a[href^="/idea/"]')) { if (!USED.includes(await a.getAttribute('href'))) { card = a; break; } }
  card = card || (await p.$('a[href^="/idea/"]'));
}
await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
await pointEl(card);
await p.waitForTimeout(300);
const href = IDEA || (await card.getAttribute('href'));
await p.goto(SITE + href, { waitUntil: 'load' });
await p.evaluate(cursor);
fs.writeFileSync('chosen.json', JSON.stringify({ path: href, title: (await p.$eval('h1', (h) => h.innerText.trim()).catch(() => '')) }));
await p.waitForTimeout(2600);
mark('s5');
await smooth(await h2('SCORE', 120), 1800);
await p.waitForTimeout(1500);
await smooth(await h2('rapporter', 100), 1800);
await p.waitForTimeout(1500);
mark('s6');
await smooth(await h2('CALCULATEUR', 100), 1800);
await p.waitForTimeout(800);
const range = await p.$('input[type=range]');
if (range) {
  const bb = await range.boundingBox();
  await point(bb.x + bb.width * 0.3, bb.y + bb.height / 2);
  await p.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height / 2); await p.mouse.down();
  for (let i = 0; i < 20; i++) { const x = bb.x + bb.width * (0.3 + 0.025 * i); await p.mouse.move(x, bb.y + bb.height / 2); await p.evaluate(x => { const e = document.getElementById('fc'); e.style.transition = 'none'; e.style.left = x + 'px'; }, x); await p.waitForTimeout(60); }
  await p.mouse.up();
}
await p.waitForTimeout(2000);
mark('s7');
await smooth(await h2('Fiche complète', 160), 2000);
await p.waitForTimeout(3500);
mark('end');
await ctx.close(); await b.close();
const v = fs.readdirSync('vid').find((f) => f.endsWith('.webm'));
fs.renameSync('vid/' + v, 'screen.webm');
fs.writeFileSync('marks.json', JSON.stringify(marks));
console.log(JSON.stringify(marks));
