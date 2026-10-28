// One-time setup on a new machine: Python packages + the Kokoro voice model.
//   npm install && npm run setup
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, createWriteStream, renameSync } from 'node:fs';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const models = path.join(root, 'tools', 'models');
const BASE = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0';

const py = process.platform === 'win32' ? 'python' : 'python3';
console.log('Installing Python packages (kokoro-onnx, soundfile, numpy, scipy)...');
execSync(`${py} -m pip install kokoro-onnx soundfile numpy scipy`, { stdio: 'inherit' });

mkdirSync(models, { recursive: true });
for (const f of ['kokoro-v1.0.onnx', 'voices-v1.0.bin']) {
  const dest = path.join(models, f);
  if (existsSync(dest)) { console.log(`have ${f}`); continue; }
  console.log(`downloading ${f}...`);
  const res = await fetch(`${BASE}/${f}`);
  if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
  await finished(Readable.fromWeb(res.body).pipe(createWriteStream(dest + '.part')));
  renameSync(dest + '.part', dest);
}
console.log('\nReady. Try: npm run voice -- episodes/01-flannan-isles');
