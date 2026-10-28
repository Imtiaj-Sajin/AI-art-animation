// Renders a canvas animation page frame-by-frame in headless Chrome and encodes it to MP4.
//   node render.mjs seed-to-tree/index.html seed-to-tree.mp4
//   node render.mjs seed-to-tree/index.html --stills 2,6,12 --out stills/
import puppeteer from 'puppeteer-core';
import ffmpegPath from 'ffmpeg-static';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const htmlPath = path.resolve(positional[0] ?? 'seed-to-tree/index.html');
const stills = flag('--stills');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) throw new Error('Chrome/Edge not found; set CHROME_PATH');

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.setViewport({ width: 1280, height: 800 });
await page.goto(pathToFileURL(htmlPath).href + '?export', { waitUntil: 'networkidle0' });
await page.waitForFunction('window.animationReady === true', { timeout: 30000 });
const { duration, fps } = await page.evaluate(() => ({ duration: window.ANIM.duration, fps: window.ANIM.fps }));
const grab = async (t) => Buffer.from(await page.evaluate((tt) => window.ANIM.frame(tt), t), 'base64');

if (stills) {
  const outDir = path.resolve(flag('--out') ?? 'stills');
  mkdirSync(outDir, { recursive: true });
  for (const t of stills.split(',').map(Number)) {
    const file = path.join(outDir, `t${t.toFixed(2)}.png`);
    writeFileSync(file, await grab(t));
    console.log(file);
  }
} else {
  const out = path.resolve(positional[1] ?? htmlPath.replace(/[\\/]index\.html$/, '') + '.mp4');
  const total = Math.round(duration * fps);
  const ff = spawn(ffmpegPath, [
    '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', out,
  ], { stdio: ['pipe', 'ignore', 'inherit'] });
  const started = Date.now();
  for (let i = 0; i < total; i++) {
    if (!ff.stdin.write(await grab(i / fps))) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % fps === 0) process.stdout.write(`\rframe ${i}/${total}  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  const code = await new Promise((r) => ff.on('close', r));
  console.log(code === 0 ? `\nwrote ${out}` : `\nffmpeg exited with ${code}`);
}
await browser.close();
