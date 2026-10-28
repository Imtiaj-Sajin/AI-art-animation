// Renders a canvas animation page frame-by-frame in headless Chrome and encodes it to MP4.
// The page must expose window.ANIM = { duration, fps, frame(t) -> base64 PNG, audio? } and set
// window.animationReady = true once fonts/assets are loaded.
//
//   node tools/render.mjs episodes/01-flannan-isles                 -> out/01-flannan-isles.mp4
//   node tools/render.mjs episodes/01-flannan-isles --from 60 --to 75 --out out/test.mp4
//   node tools/render.mjs episodes/01-flannan-isles --stills 3,40,95 --outdir out/stills
//   options: --workers 4 (parallel Chrome instances), --no-audio
import puppeteer from 'puppeteer-core';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const flag = (name, def = null) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const has = name => args.includes(name);
const target = path.resolve(args.find(a => !a.startsWith('--') && !args[args.indexOf(a) - 1]?.startsWith('--')) ?? 'episodes/01-flannan-isles');
const htmlPath = statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
const pageDir = path.dirname(htmlPath);
const name = path.basename(statSync(target).isDirectory() ? target : pageDir);

const CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean).find(p => existsSync(p));
if (!CHROME) throw new Error('Chrome/Edge not found; set CHROME_PATH');

async function openPage() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage();
  page.on('pageerror', e => console.error('page error:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(pathToFileURL(htmlPath).href + '?export', { waitUntil: 'load' });
  await page.waitForFunction('window.animationReady === true', { timeout: 60000 });
  return { browser, page };
}
const grab = async (page, t) => Buffer.from(await page.evaluate(tt => window.ANIM.frame(tt), t), 'base64');

const first = await openPage();
const meta = await first.page.evaluate(() => ({ duration: window.ANIM.duration, fps: window.ANIM.fps, audio: window.ANIM.audio || null }));

if (has('--thumb')) {
  const file = path.resolve(flag('--out', `out/${name}-thumbnail.png`));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(await first.page.evaluate(() => window.ANIM.thumbnail()), 'base64'));
  console.log(file);
  await first.browser.close();
  process.exit(0);
}
if (flag('--stills')) {
  const outDir = path.resolve(flag('--outdir', 'out/stills'));
  mkdirSync(outDir, { recursive: true });
  for (const t of flag('--stills').split(',').map(Number)) {
    const file = path.join(outDir, `${name}-t${t.toFixed(2)}.png`);
    writeFileSync(file, await grab(first.page, t));
    console.log(file);
  }
  await first.browser.close();
  process.exit(0);
}

const from = +flag('--from', 0), to = Math.min(+flag('--to', meta.duration), meta.duration);
const out = path.resolve(flag('--out', `out/${name}${from > 0 || to < meta.duration ? `-${from}-${to}` : ''}.mp4`));
mkdirSync(path.dirname(out), { recursive: true });
const f0 = Math.round(from * meta.fps), f1 = Math.round(to * meta.fps), total = f1 - f0;
const audioFile = !has('--no-audio') && meta.audio ? path.join(pageDir, meta.audio) : null;
const withAudio = audioFile && existsSync(audioFile);

const ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(meta.fps), '-i', '-'];
if (withAudio) ffArgs.push('-ss', String(from), '-t', String(to - from), '-i', audioFile);
ffArgs.push('-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', '-tune', 'animation');
if (withAudio) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
ffArgs.push('-movflags', '+faststart', out);
const ff = spawn(ffmpegPath, ffArgs, { stdio: ['pipe', 'ignore', 'inherit'] });

const nWorkers = Math.max(1, +flag('--workers', Math.min(6, Math.max(2, Math.floor(os.cpus().length / 3)))));
const workers = [first];
for (let i = 1; i < nWorkers; i++) workers.push(await openPage());
console.log(`${name}: ${total} frames (${(total / meta.fps).toFixed(1)}s) with ${nWorkers} workers${withAudio ? ' + audio' : ''}`);

const ready = new Map();
let next = f0, written = f0;
const started = Date.now();
async function flush() {
  while (ready.has(written)) {
    const buf = ready.get(written); ready.delete(written); written++;
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
}
await Promise.all(workers.map(async w => {
  while (next < f1) {
    const i = next++;
    while (i - written > 48) await new Promise(r => setTimeout(r, 20));   // bound memory
    ready.set(i, await grab(w.page, i / meta.fps));
    await flush();
    if (i % meta.fps === 0) {
      const done = written - f0, el = (Date.now() - started) / 1000;
      process.stdout.write(`\r${done}/${total} frames  ${el.toFixed(0)}s elapsed  ~${(el / Math.max(1, done) * (total - done)).toFixed(0)}s left   `);
    }
  }
}));
await flush();
ff.stdin.end();
const code = await new Promise(r => ff.on('close', r));
await Promise.all(workers.map(w => w.browser.close()));
console.log(code === 0 ? `\nwrote ${out}` : `\nffmpeg exited with ${code}`);
