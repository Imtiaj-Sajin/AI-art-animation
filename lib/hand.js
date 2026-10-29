// Hand-drawn rendering engine for House of Owls episodes.
// Everything is drawn procedurally onto layered canvases, then composited like real media:
//   paper  ->  color layer (crayon + watercolor, multiplied onto paper, paper grain erased out)
//          ->  ink layer (line-boiled pen strokes, lightly grained)
//          ->  darkness layer (night, with soft holes cut out by lights)
//          ->  glow layer (screen-blended lamp light, beams, eyes)
// Deterministic: the same time t always produces the same frame, so renders are repeatable.
(function (global) {
'use strict';
let W = 1920, H = 1080;
const HD = global.HD = { W, H };
// Change the frame size (e.g. 1080x1920 for Shorts). Call before creating a Stage.
HD.setSize = (w, h) => { W = HD.W = w; H = HD.H = h; };

// ---------- math ----------
const clamp = HD.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = HD.lerp = (a, b, t) => a + (b - a) * t;
const smooth = HD.smooth = t => t * t * (3 - 2 * t);
HD.easeOut = t => 1 - Math.pow(1 - t, 3);
HD.easeIn = t => t * t * t;
const easeInOut = HD.easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
HD.easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const prog = HD.prog = (t, start, dur) => clamp((t - start) / dur);
// 0 -> 1 -> 0 envelope: fades in over `fi` after `a`, out over `fo` before `b`
HD.window = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(prog(t, a, fi), 1 - prog(t, b - fo, fo));

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
HD.rng = mulberry32;
function hashInt(n) {
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d);
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}
const h2 = HD.h2 = (a, b) => hashInt((Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0);
const noise1 = HD.noise1 = (x, seed) => {
  const i = Math.floor(x), f = x - i;
  return lerp(h2(i, seed), h2(i + 1, seed), smooth(f)) * 2 - 1;
};
const gauss = r => (r() + r() + r() - 1.5) * 1.15;

// "Line boil": hand-drawn lines are redrawn 8x per second with fresh wobble.
let BOIL = 0;
HD.setTime = t => { BOIL = Math.floor(t * 8); };
HD.boil = () => BOIL;
const jit = HD.jit = (id, k) => h2(id * 31 + k, BOIL * 977 + 13) * 2 - 1;

// ---------- geometry ----------
HD.quadPts = (p0, c, p1, n = 10) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, iu = 1 - u;
    out.push([iu * iu * p0[0] + 2 * iu * u * c[0] + u * u * p1[0], iu * iu * p0[1] + 2 * iu * u * c[1] + u * u * p1[1]]);
  }
  return out;
};
HD.ellipse = (cx, cy, rx, ry, n = 36, rot = 0, a0 = 0, a1 = Math.PI * 2) => {
  const out = [], cr = Math.cos(rot), sr = Math.sin(rot), full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const m = full ? n : n + 1;
  for (let i = 0; i < m; i++) {
    const a = a0 + (a1 - a0) * i / n, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * cr - y * sr, cy + x * sr + y * cr]);
  }
  return out;
};
HD.rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
HD.closed = pts => pts.concat([pts[0], pts[1]]);
HD.xform = (pts, x, y, rot = 0, s = 1, sy = s) => {
  const cr = Math.cos(rot), sr = Math.sin(rot);
  return pts.map(([px, py]) => { px *= s; py *= sy; return [x + px * cr - py * sr, y + px * sr + py * cr]; });
};
const resample = HD.resample = (pts, step = 6) => {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 1; k <= n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
  }
  return out;
};
// partial polyline: first fraction p of its length (for "drawing on" lines)
HD.partial = (pts, p) => {
  if (p >= 1) return pts;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let want = total * clamp(p), acc = 0;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + d >= want) {
      const f = d ? (want - acc) / d : 0;
      out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]);
      return out;
    }
    acc += d; out.push(pts[i]);
  }
  return out;
};
const wobble = HD.wobble = (pts, amp, id, freq = 0.025) => {
  const out = new Array(pts.length), seed = id * 7919 + BOIL * 104729;
  const sx = jit(id, 1) * amp * 0.6, sy = jit(id, 2) * amp * 0.6;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i > 0) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny) || 1;
    const o = noise1(s * freq, seed) * amp;
    out[i] = [p[0] + nx / nl * o + sx, p[1] + ny / nl * o + sy];
  }
  return out;
};
const trace = HD.trace = (c, pts, close = false) => {
  c.beginPath();
  c.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  if (close) c.closePath();
};

// ---------- palette ----------
HD.INK = '#1b2140';
HD.C = {
  ink: '#1b2140', night: '#27355e', deep: '#141a33', sea: '#2f4a78', foam: '#e9e4d6',
  lamp: '#ffcf6b', lampHot: '#fff1c2', orange: '#f47a3a', paper: '#f3ecdd', rust: '#b5452b',
  grass: '#7d9a5a', stone: '#8a8778', oil: '#d9a43b', wood: '#8b5a34', slate: '#4b5568',
};
HD.FONT = {
  hand: '"Caveat", "Segoe Print", cursive',
  serif: '"IM Fell English", Georgia, serif',
  brand: '"Fredoka", "Segoe UI", sans-serif',
};

// ---------- drawing primitives ----------
// Ink: a confident stroke plus a lighter, looser second pass, like a re-traced pen line.
HD.ink = (c, pts, id, w = 2.4, amp = 1.6, alpha = 1, color = HD.INK) => {
  if (!pts || pts.length < 2 || alpha <= 0) return;
  pts = resample(pts, 6);
  c.strokeStyle = color; c.lineCap = 'round'; c.lineJoin = 'round';
  c.globalAlpha = 0.92 * alpha; c.lineWidth = w;
  trace(c, wobble(pts, amp, id)); c.stroke();
  c.globalAlpha = 0.38 * alpha; c.lineWidth = w * 0.55;
  trace(c, wobble(pts, amp * 1.7, id + 5003)); c.stroke();
  c.globalAlpha = 1;
};
HD.inkShape = (c, pts, id, w, amp, alpha, color) => HD.ink(c, HD.closed(pts), id, w, amp, alpha, color);
// Crayon: a loose fill plus pencil hatching clipped to the shape (paper grain is erased later).
HD.crayon = (c, pts, color, id, { alpha = 0.8, hatch = 0.45, angle = -0.9, spacing = 5, dark = null, amp = 1.3 } = {}) => {
  if (alpha <= 0) return;
  const wp = wobble(resample(HD.closed(pts), 6), amp, id + 77);
  trace(c, wp, true);
  c.globalAlpha = alpha; c.fillStyle = color; c.fill();
  c.save(); c.clip();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of wp) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
  const a = angle + jit(id, 8) * 0.06, dx = Math.cos(a), dy = Math.sin(a), px = -dy, py = dx;
  c.beginPath();
  let k = 0;
  for (let d = -R + (jit(id, 9) + 1) * spacing * 0.5; d < R; d += spacing, k++) {
    const ox = cx + px * d, oy = cy + py * d, wv = h2(id + k, 3) * 2 - 1;
    c.moveTo(ox - dx * R, oy - dy * R);
    c.lineTo(ox + px * wv * 1.5, oy + py * wv * 1.5);
    c.lineTo(ox + dx * R, oy + dy * R);
  }
  c.strokeStyle = dark || color; c.globalAlpha = hatch * alpha; c.lineWidth = spacing * 0.45; c.stroke();
  c.restore();
  c.globalAlpha = 1;
};
// Hatching only (pencil shading) inside a shape
HD.hatch = (c, pts, color, id, { alpha = 0.5, angle = 0.8, spacing = 7, width = 1.4 } = {}) => {
  c.save(); trace(c, pts, true); c.clip();
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
  const dx = Math.cos(angle), dy = Math.sin(angle), px = -dy, py = dx;
  c.beginPath();
  for (let d = -R; d < R; d += spacing) {
    const j = jit(id, d | 0) * 1.2;
    c.moveTo(cx + px * (d + j) - dx * R, cy + py * (d + j) - dy * R);
    c.lineTo(cx + px * (d - j) + dx * R, cy + py * (d - j) + dy * R);
  }
  c.strokeStyle = color; c.globalAlpha = alpha; c.lineWidth = width; c.lineCap = 'round'; c.stroke();
  c.restore(); c.globalAlpha = 1;
};
// Erase ink already drawn under a foreground shape (e.g. sea lines behind a ship), so objects
// in front properly hide what's behind them.
HD.occlude = (c, pts) => {
  c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 1;
  trace(c, pts, true); c.fillStyle = '#000'; c.fill(); c.restore();
};
HD.dot = (c, x, y, r, color, alpha = 1) => {
  c.globalAlpha = alpha; c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
};

// ---------- watercolor ----------
function deform(poly, rounds, v, r, closedPoly = true) {
  for (let k = 0; k < rounds; k++) {
    const out = [];
    const n = closedPoly ? poly.length : poly.length - 1;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6;
      const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len, off = gauss(r) * v * len;
      out.push(a, [(a[0] + b[0]) / 2 + nx * off, (a[1] + b[1]) / 2 + ny * off]);
    }
    if (!closedPoly) out.push(poly[poly.length - 1]);
    poly = out; v *= 0.65;
  }
  return poly;
}
function polyPath(p) {
  const path = new Path2D();
  path.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length; i++) path.lineTo(p[i][0], p[i][1]);
  path.closePath();
  return path;
}
// A wash is a stack of translucent, slightly different deformed polygons (two boil variants).
function makeLayers(r, base, layers, v, jitterAmt) {
  const A = [], B = [];
  for (let l = 0; l < layers; l++) {
    const p = deform(base, 1, v, r);
    A.push(polyPath(p));
    B.push(polyPath(p.map(([x, y]) => [x + gauss(r) * jitterAmt, y + gauss(r) * jitterAmt])));
  }
  return [A, B];
}
const makeWashCache = new Map();
HD.makeWash = (seed, nBase = 10, layers = 4) => {
  if (typeof seed === 'number') {
    const key = `${seed}|${nBase}|${layers}`;
    if (!makeWashCache.has(key)) makeWashCache.set(key, buildWash(mulberry32(seed), nBase, layers));
    return makeWashCache.get(key);
  }
  return buildWash(seed, nBase, layers);
};
function buildWash(r, nBase, layers) {
  const base = [];
  for (let i = 0; i < nBase; i++) {
    const a = i / nBase * Math.PI * 2, rad = 1 + (r() - 0.5) * 0.3;
    base.push([Math.cos(a) * rad, Math.sin(a) * rad]);
  }
  return makeLayers(r, deform(base, 2, 0.32, r), layers, 0.28, 0.012);
};
const drawPaths = HD.drawPaths = (c, wash, color, alpha, edgeW = 1.6) => {
  if (alpha <= 0) return;
  const layers = wash[BOIL % 2];
  c.fillStyle = color; c.strokeStyle = color; c.lineWidth = edgeW;
  for (const p of layers) {
    c.globalAlpha = alpha; c.fill(p);
    c.globalAlpha = alpha * 0.9; c.stroke(p);   // pigment pools at the edge
  }
  c.globalAlpha = 1;
};
HD.drawWash = (c, wash, x, y, rad, rot, color, alpha, sy = 1) => {
  if (rad <= 0.5 || alpha <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(rad, rad * sy);
  drawPaths(c, wash, color, alpha, 1.6 / rad);
  c.restore();
};
// Washes over arbitrary static polygons are built once and cached by key.
const washCache = new Map();
HD.washPoly = (c, key, pts, color, alpha, { layers = 3, v = 0.12, step = 40 } = {}) => {
  let wash = washCache.get(key);
  if (!wash) {
    const r = mulberry32(hashInt(key.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0) | 0, 7)) * 1e9 | 0);
    const dense = resample(HD.closed(pts).slice(0, -1), step);
    wash = makeLayers(r, dense, layers, v, 1.5);
    washCache.set(key, wash);
  }
  drawPaths(c, wash, color, alpha, 2);
};
HD.washRect = (c, key, x, y, w, h, color, alpha, opts) => HD.washPoly(c, key, HD.rect(x, y, w, h), color, alpha, opts);
// soft splatter dots around a point
HD.spatter = (c, x, y, r, n, color, id, alpha = 0.5) => {
  c.fillStyle = color; c.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const a = h2(id, i) * 6.283, d = r * (0.6 + h2(id, i + 50) * 0.8), s = 1 + h2(id, i + 99) * 3;
    c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, s, 0, 6.283); c.fill();
  }
  c.globalAlpha = 1;
};
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
HD.mix = (a, b, t) => {
  const A = hexRgb(a), B = hexRgb(b);
  return `rgb(${lerp(A[0], B[0], t) | 0},${lerp(A[1], B[1], t) | 0},${lerp(A[2], B[2], t) | 0})`;
};
HD.rgba = (hex, a) => { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${a})`; };

// ---------- light ----------
HD.glow = (c, x, y, r, color = HD.C.lamp, alpha = 1) => {
  if (alpha <= 0 || r <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, HD.rgba(color, alpha));
  g.addColorStop(0.25, HD.rgba(color, alpha * 0.45));
  g.addColorStop(1, HD.rgba(color, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
};
// A lighthouse-style beam: wedge from (x,y) in direction `ang`, fading with distance.
HD.beam = (c, x, y, ang, len, spread, alpha, color = HD.C.lamp) => {
  if (alpha <= 0) return;
  const g = c.createLinearGradient(x, y, x + Math.cos(ang) * len, y + Math.sin(ang) * len);
  g.addColorStop(0, HD.rgba(color, alpha)); g.addColorStop(0.5, HD.rgba(color, alpha * 0.25)); g.addColorStop(1, HD.rgba(color, 0));
  c.fillStyle = g;
  c.beginPath(); c.moveTo(x, y);
  c.lineTo(x + Math.cos(ang - spread) * len, y + Math.sin(ang - spread) * len);
  c.lineTo(x + Math.cos(ang + spread) * len, y + Math.sin(ang + spread) * len);
  c.closePath(); c.fill();
};
// Night: fill the darkness layer, then cut soft holes where lights are. Lights are in the
// current camera space if `cam` is given.
HD.darkness = (L, alpha, lights = [], color = '#0a0e22', cam = null) => {
  const c = L.dark;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = alpha; c.fillStyle = color; c.fillRect(0, 0, W, H);
  c.globalAlpha = 1; c.globalCompositeOperation = 'destination-out';
  if (cam) applyCam(c, cam);
  for (const l of lights) {
    const a = l.a ?? 1;
    if (a <= 0 || l.r <= 0) continue;
    const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(l.core ?? 0.4, `rgba(0,0,0,${a * 0.8})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
  }
  c.restore();
};

// ---------- text ----------
// Handwriting/print that reveals left-to-right as p goes 0 -> 1, with a little boil.
HD.text = (c, str, x, y, { size = 60, font = 'hand', weight = 600, color = HD.INK, p = 1, align = 'left', rot = 0, alpha = 1, id = 1, italic = false, boil = 1, shadow = true } = {}) => {
  if (p <= 0 || alpha <= 0 || !str) return 0;
  c.save();
  c.font = `${italic ? 'italic ' : ''}${weight} ${size}px ${HD.FONT[font] || font}`;
  c.textAlign = align; c.textBaseline = 'alphabetic';
  const w = c.measureText(str).width;
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  c.translate(x + jit(id, 1) * 1.1 * boil, y + jit(id, 2) * 1.1 * boil);
  c.rotate(rot + jit(id, 3) * 0.004 * boil);
  if (p < 1) { c.beginPath(); c.rect(left - x - 10, -size * 1.4, (w + 20) * easeInOut(p), size * 2); c.clip(); }
  c.fillStyle = color; c.globalAlpha = alpha * 0.93; c.fillText(str, 0, 0);
  if (shadow) { c.globalAlpha = alpha * 0.22; c.fillText(str, 1.3, 0.9); }
  c.restore();
  return w;
};
HD.measure = (c, str, size, font = 'hand', weight = 600) => {
  c.save(); c.font = `${weight} ${size}px ${HD.FONT[font] || font}`; const w = c.measureText(str).width; c.restore(); return w;
};
// hand-drawn underline / circle annotations
HD.underline = (c, x0, x1, y, p, id, w = 3, color = HD.C.orange) => {
  const pts = [];
  for (let i = 0; i <= 30; i++) { const u = i / 30; pts.push([lerp(x0, x1, u), y + Math.sin(u * 9 + id) * 3]); }
  HD.ink(c, HD.partial(pts, p), id, w, 1, 1, color);
};
HD.circleMark = (c, x, y, rx, ry, p, id, w = 3, color = HD.C.orange) => {
  const pts = [];
  for (let i = 0; i <= 50; i++) { const a = -2.2 + i / 50 * Math.PI * 2.25; const k = 1 + 0.06 * Math.sin(i * 0.7 + id); pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]); }
  HD.ink(c, HD.partial(pts, p), id, w, 1.2, 1, color);
};
HD.arrow = (c, pts, p, id, w = 3, color = HD.C.orange) => {
  const q = HD.partial(resample(pts, 8), p);
  HD.ink(c, q, id, w, 1, 1, color);
  if (p > 0.9 && q.length > 2) {
    const a = q[q.length - 1], b = q[q.length - 3], ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
    for (const s of [-1, 1]) HD.ink(c, [a, [a[0] - Math.cos(ang + s * 0.5) * 18, a[1] - Math.sin(ang + s * 0.5) * 18]], id + s + 3, w, 0.5, 1, color);
  }
};

// ---------- camera ----------
function applyCam(c, cam) {
  const s = cam.s ?? 1, r = cam.r ?? 0, cr = Math.cos(r) * s, sr = Math.sin(r) * s;
  c.setTransform(cr, sr, -sr, cr, W / 2 - (cam.x * cr - cam.y * sr), H / 2 - (cam.x * sr + cam.y * cr));
}
HD.applyCam = applyCam;
HD.cam = (L, cam) => { for (const c of [L.col, L.ink, L.glow]) applyCam(c, cam); L.camera = cam; };
HD.screen = L => { for (const c of [L.col, L.ink, L.glow]) c.setTransform(1, 0, 0, 1, 0, 0); L.camera = null; };

// ---------- stage (layers + compositing) ----------
const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
HD.canvas = mk;
function makePaper() {
  const p = mk(), c = p.getContext('2d'), r = mulberry32(7);
  c.fillStyle = HD.C.paper; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() * H, rad = 80 + r() * 320;
    const tone = r() < 0.55 ? 'rgba(185,150,100,' : 'rgba(255,255,248,';
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, tone + (0.07 * r()).toFixed(3) + ')'); g.addColorStop(1, tone + '0)');
    c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  c.lineWidth = 1;
  for (let i = 0; i < 800; i++) {
    const x = r() * W, y = r() * H, a = r() * Math.PI * 2, l = 10 + r() * 30;
    c.strokeStyle = `rgba(120,95,60,${(0.03 + r() * 0.05).toFixed(3)})`;
    c.beginPath(); c.moveTo(x, y);
    c.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  const img = c.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  c.putImageData(img, 0, 0);
  return p;
}
function makeGrain(seed) {
  const gw = W / 2, gh = H / 2, g = mk(gw, gh), c = g.getContext('2d');
  const img = c.createImageData(gw, gh), d = img.data, r = mulberry32(seed);
  for (let i = 0; i < d.length; i += 4) {
    const v = r();
    d[i + 3] = v < 0.05 ? 110 + v * 1400 : v < 0.18 ? (v - 0.05) * 260 : 0;
  }
  c.putImageData(img, 0, 0);
  return g;
}
HD.Stage = class Stage {
  constructor() {
    this.paper = makePaper();
    this.grains = [makeGrain(1), makeGrain(2), makeGrain(3)];
    this.layers = { col: mk(), ink: mk(), glow: mk(), dark: mk() };
    this.ctx = {};
    for (const k in this.layers) this.ctx[k] = this.layers[k].getContext('2d');
    const vg = this.vignette = mk(), v = vg.getContext('2d');
    const g = v.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.0);
    g.addColorStop(0, 'rgba(40,28,15,0)'); g.addColorStop(1, 'rgba(40,28,15,0.38)');
    v.fillStyle = g; v.fillRect(0, 0, W, H);
  }
  begin(t, lt) {
    HD.setTime(t);
    for (const k in this.ctx) {
      const c = this.ctx[k];
      c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      c.clearRect(0, 0, W, H);
    }
    return { col: this.ctx.col, ink: this.ctx.ink, glow: this.ctx.glow, dark: this.ctx.dark, t, lt, flash: 0, fade: 0, camera: null };
  }
  eraseGrain(c, amount) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'destination-out'; c.globalAlpha = amount;
    c.drawImage(this.grains[BOIL % 3], 0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }
  compose(o, L) {
    this.eraseGrain(this.ctx.col, L.grain ?? 0.85);
    this.eraseGrain(this.ctx.ink, 0.35);
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1;
    o.globalCompositeOperation = 'source-over'; o.drawImage(this.paper, 0, 0);
    o.globalCompositeOperation = 'multiply'; o.drawImage(this.layers.col, 0, 0);
    o.globalCompositeOperation = 'source-over'; o.drawImage(this.layers.ink, 0, 0);
    o.drawImage(this.layers.dark, 0, 0);
    o.globalCompositeOperation = 'multiply'; o.drawImage(this.vignette, 0, 0);
    o.globalCompositeOperation = 'screen'; o.drawImage(this.layers.glow, 0, 0);
    if (L.flash > 0) { o.globalAlpha = clamp(L.flash); o.fillStyle = '#c9d6ff'; o.fillRect(0, 0, W, H); o.globalAlpha = 1; }
    o.globalCompositeOperation = 'source-over';
    if (L.fade > 0) { o.globalAlpha = clamp(L.fade); o.fillStyle = '#07091a'; o.fillRect(0, 0, W, H); o.globalAlpha = 1; }
  }
};

// ---------- scenery ----------
// Sea: watercolor body + rows of broken ink wave strokes, denser and bigger toward the viewer.
HD.sea = (L, { horizon = 600, bottom = H + 60, t = 0, storm = 0.5, color = HD.C.sea, alpha = 0.55, rows = 14, id = 100, x0 = -200, x1 = W + 200, inkColor = HD.INK, inkAlpha = 0.85, speed = 1, foam = true } = {}) => {
  HD.washRect(L.col, `sea${id}${horizon}`, x0, horizon - 6, x1 - x0, bottom - horizon + 6, color, alpha / 3);
  for (let i = 0; i < rows; i++) {
    const u = (i + 0.5) / rows, persp = Math.pow(u, 1.6);
    const y0 = horizon + (bottom - horizon) * persp;
    const amp = (1.5 + 16 * persp) * (0.4 + storm);
    const lambda = 50 + 300 * persp, ph = t * speed * (0.8 + persp * 1.6) + i * 1.3;
    let seg = [];
    const segs = [];
    for (let x = x0; x <= x1; x += 10) {
      const on = noise1(x * 0.004 + i * 7, id + i) > -0.15;
      const y = y0 + amp * Math.sin(x / lambda * 6.283 + ph) + amp * 0.4 * Math.sin(x / lambda * 14 - ph * 1.3);
      if (on) seg.push([x, y]); else if (seg.length) { segs.push(seg); seg = []; }
    }
    if (seg.length) segs.push(seg);
    segs.forEach((s, k) => { if (s.length > 2) HD.ink(L.ink, s, id * 100 + i * 10 + k, 0.8 + 2.2 * persp, 0.8, inkAlpha * (0.45 + 0.55 * persp), inkColor); });
    if (foam && storm > 0.4) {
      for (let x = x0; x <= x1; x += lambda) {
        const cx = x + (ph * lambda / 6.283) % lambda;
        const y = y0 - amp * 0.9;
        if (noise1(cx * 0.01, id + i * 3) > 0.2) HD.ink(L.ink, [[cx - 8 - 10 * persp, y + 4], [cx, y], [cx + 10 + 12 * persp, y + 5]], id + i * 77 + (x | 0), 1 + 1.5 * persp, 0.6, 0.8 * storm, HD.C.foam);
      }
    }
  }
};
// Rain streaks in screen space
HD.rain = (L, t, { density = 220, angle = 0.28, len = 46, alpha = 0.35, color = '#cfd8f0', seed = 5 } = {}) => {
  if (alpha <= 0) return;
  const c = L.ink;
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
  c.strokeStyle = color; c.lineWidth = 1.6; c.globalAlpha = alpha; c.lineCap = 'round';
  c.beginPath();
  const dx = Math.sin(angle), dy = Math.cos(angle);
  for (let i = 0; i < density; i++) {
    const sp = 1300 + h2(i, seed) * 700, l = len * (0.6 + h2(i, seed + 1) * 0.8);
    const y = ((h2(i, seed + 2) * (H + 300) + t * sp) % (H + 300)) - 150;
    const x = h2(i, seed + 3) * (W + 400) - 200 - y * dx / dy * 0.6;
    c.moveTo(x, y); c.lineTo(x - dx * l, y - dy * l);
  }
  c.stroke(); c.restore(); c.globalAlpha = 1;
};
// Stars for clear night skies
HD.stars = (L, n, x0, y0, w, h, t, id = 1, alpha = 0.8) => {
  for (let i = 0; i < n; i++) {
    const x = x0 + h2(i, id) * w, y = y0 + h2(i, id + 1) * h, tw = 0.5 + 0.5 * Math.sin(t * (1 + h2(i, id + 2) * 2) + i);
    HD.glow(L.glow, x, y, 6 + h2(i, id + 3) * 8, '#fff6dc', alpha * (0.3 + 0.7 * tw));
  }
};
// The Flannan lighthouse: short white tower with lantern room, keepers' house at its foot.
HD.lighthouse = (L, x, y, s, { lit = 0, beamAng = null, beamAlpha = 0.5, id = 900, house = true, night = 0, windows = 0 } = {}) => {
  const T = (pts) => HD.xform(pts, x, y, 0, s);
  const tower = [[-36, 0], [36, 0], [27, -210], [-27, -210]];
  const gallery = [[-38, -210], [38, -210], [38, -219], [-38, -219]];
  const lantern = [[-21, -219], [21, -219], [21, -252], [-21, -252]];
  const dome = HD.ellipse(0, -252, 24, 20, 16, 0, Math.PI, Math.PI * 2);
  if (house) {
    const walls = [[-175, 0], [-30, 0], [-30, -62], [-175, -62]];
    const roof = [[-183, -60], [-22, -60], [-40, -92], [-165, -92]];
    HD.crayon(L.col, T(walls), '#ece4d2', id + 1, { alpha: 0.9, hatch: 0.2 });
    HD.crayon(L.col, T(roof), HD.C.slate, id + 2, { alpha: 0.85, spacing: 4 });
    HD.inkShape(L.ink, T(walls), id + 3, 2 * Math.sqrt(s), 1);
    HD.inkShape(L.ink, T(roof), id + 4, 2 * Math.sqrt(s), 1);
    for (const wx of [-150, -110, -70]) {
      const win = T([[wx, -42], [wx + 18, -42], [wx + 18, -18], [wx, -18]]);
      if (windows > 0) HD.crayon(L.col, win, HD.C.lamp, id + wx, { alpha: windows });
      HD.inkShape(L.ink, win, id + 10 + wx, 1.5, 0.6);
      if (windows > 0) { const p = T([[wx + 9, -30]])[0]; HD.glow(L.glow, p[0], p[1], 40 * s, HD.C.lamp, windows * 0.5); }
    }
  }
  HD.crayon(L.col, T(tower), '#f2ede2', id + 5, { alpha: 0.95, hatch: 0.15 });
  HD.hatch(L.col, T([[10, 0], [36, 0], [27, -210], [8, -210]]), '#6f7290', id + 6, { alpha: 0.35, spacing: 6 });
  HD.crayon(L.col, T(gallery), '#3a3f55', id + 7, { alpha: 0.9 });
  HD.crayon(L.col, T(lantern), lit > 0 ? HD.mix('#2c3350', HD.C.lamp, lit) : '#2c3350', id + 8, { alpha: 0.9 });
  HD.crayon(L.col, T(dome), '#3a3f55', id + 9, { alpha: 0.9 });
  HD.inkShape(L.ink, T(tower), id + 11, 2.2 * Math.sqrt(s), 1.2);
  HD.inkShape(L.ink, T(gallery), id + 12, 2 * Math.sqrt(s), 0.8);
  HD.inkShape(L.ink, T(lantern), id + 13, 2 * Math.sqrt(s), 0.8);
  HD.ink(L.ink, T(dome), id + 14, 2 * Math.sqrt(s), 0.8);
  HD.ink(L.ink, T([[0, -272], [0, -285]]), id + 15, 2, 0.5);
  for (const lx of [-7, 7]) HD.ink(L.ink, T([[lx, -219], [lx, -252]]), id + 16 + lx, 1.2, 0.4, 0.7);
  HD.ink(L.ink, T([[-8, -150], [8, -150], [8, -128], [-8, -128], [-8, -150]]), id + 30, 1.4, 0.5, 0.8);
  if (lit > 0) {
    const lp = T([[0, -236]])[0];
    HD.glow(L.glow, lp[0], lp[1], 110 * s, HD.C.lamp, lit * 0.9);
    HD.glow(L.glow, lp[0], lp[1], 30 * s, HD.C.lampHot, lit);
    if (beamAng !== null) {
      for (const sgn of [0, Math.PI]) {
        const a = beamAng + sgn, facing = Math.abs(Math.cos(a));
        HD.beam(L.glow, lp[0], lp[1], a, 1500 * s, 0.07 + 0.05 * (1 - facing), beamAlpha * lit);
      }
    }
  }
  return T([[0, -236]])[0];
};
// Steamship silhouette with drifting watercolor smoke.
HD.steamer = (L, x, y, s, { t = 0, id = 700, roll = 0.03, lights = 0, smoke = 1, color = '#262c45' } = {}) => {
  const rot = Math.sin(t * 1.3) * roll;
  const T = pts => HD.xform(pts, x, y + Math.sin(t * 1.7) * 4 * s, rot, s);
  const hull = [[-170, -8], [185, -14], [160, 26], [-150, 26]];
  const deck = [[-70, -8], [50, -8], [50, -38], [-70, -38]];
  const funnel = [[-12, -38], [14, -38], [12, -92], [-10, -92]];
  if (smoke > 0) {
    const fp = T([[2, -95]])[0];
    for (let k = 0; k < 9; k++) {
      const age = ((t * 0.35 + k / 9) % 1);
      const px = fp[0] - age * 360 * s - 20, py = fp[1] - age * 120 * s + Math.sin(age * 6 + k) * 10;
      HD.drawWash(L.col, smokeWash[k % smokeWash.length], px, py, (18 + age * 70) * s, k, '#5a5f73', 0.12 * smoke * (1 - age));
    }
  }
  for (const [shape, k] of [[hull, 1], [deck, 2], [funnel, 3]]) {
    HD.occlude(L.ink, T(shape));
    HD.crayon(L.col, T(shape), color, id + k, { alpha: 0.92, spacing: 4 });
    HD.inkShape(L.ink, T(shape), id + 10 + k, 2.2, 0.9);
  }
  HD.ink(L.ink, T([[-12, -78], [13, -78]]), id + 20, 4, 0.5, 0.9, HD.C.rust);
  for (const mx of [-125, 120]) HD.ink(L.ink, T([[mx, -10], [mx, -120]]), id + 21 + mx, 2.2, 0.6);
  HD.ink(L.ink, T([[-125, -118], [-170, -10]]), id + 30, 1, 0.5, 0.7);
  HD.ink(L.ink, T([[120, -118], [185, -14]]), id + 31, 1, 0.5, 0.7);
  HD.ink(L.ink, T([[-125, -110], [-10, -88]]), id + 32, 1, 0.5, 0.6);
  HD.ink(L.ink, T([[120, -110], [12, -88]]), id + 33, 1, 0.5, 0.6);
  if (lights > 0) {
    for (const px of [-110, -60, 30, 90, 140]) {
      const p = T([[px, 6]])[0];
      HD.dot(L.ink, p[0], p[1], 3.5 * s, HD.C.lamp, lights);
      HD.glow(L.glow, p[0], p[1], 26 * s, HD.C.lamp, lights * 0.5);
    }
  }
};
const smokeWash = [HD.makeWash(31), HD.makeWash(32), HD.makeWash(33)];
// Small human figure in ink. pose: stand | walk | run | climb
HD.figure = (L, x, y, s, { phase = 0, pose = 'stand', coat = true, lantern = 0, id = 1, alpha = 1, facing = 1, color = HD.INK } = {}) => {
  const c = L.ink, f = facing;
  const swing = pose === 'run' ? 0.75 : pose === 'walk' || pose === 'climb' ? 0.45 : 0.05;
  const bob = pose === 'run' ? Math.abs(Math.sin(phase)) * 3 * s : 0;
  const P = (px, py) => [x + px * s * f, y + py * s - bob];
  const lean = pose === 'run' ? 6 : pose === 'climb' ? 4 : 0;
  // legs
  for (const k of [0, 1]) {
    const a = Math.sin(phase + k * Math.PI) * swing;
    const hip = P(lean * 0.3 + (k ? 3 : -3), -26);
    const foot = [hip[0] + Math.sin(a) * 26 * s * f, hip[1] + Math.cos(a) * 26 * s];
    HD.ink(c, [hip, foot], id + k, 4.2 * s, 0.4, alpha, color);
  }
  // body
  const body = coat ? [P(-8 + lean, -60), P(9 + lean, -60), P(12, -18), P(-11, -18)] : [P(-7 + lean, -60), P(8 + lean, -60), P(8, -28), P(-7, -28)];
  if (coat) HD.crayon(c, body, color, id + 3, { alpha: alpha, spacing: 3 });
  else HD.crayon(c, body, '#ece6d6', id + 3, { alpha: alpha, hatch: 0.1 });
  HD.inkShape(c, body, id + 4, 1.8 * s, 0.4, alpha, color);
  // arms
  for (const k of [0, 1]) {
    const a = -Math.sin(phase + k * Math.PI) * swing * 1.1 + (pose === 'run' ? 0.4 : 0);
    const sh = P(lean + (k ? 6 : -6), -56);
    const hand = [sh[0] + Math.sin(a) * 24 * s * f, sh[1] + Math.cos(a) * 24 * s];
    HD.ink(c, [sh, hand], id + 5 + k, 3.4 * s, 0.4, alpha, coat ? color : '#ece6d6');
    if (!coat) HD.ink(c, [sh, hand], id + 7 + k, 1.2 * s, 0.4, alpha, color);
    if (lantern > 0 && k === 1) {
      HD.dot(c, hand[0], hand[1] + 6 * s, 4 * s, HD.C.lamp, alpha);
      HD.glow(L.glow, hand[0], hand[1] + 6 * s, 60 * s, HD.C.lamp, lantern * alpha);
    }
  }
  // head + cap
  const hd = P(lean + 1, -70);
  HD.dot(c, hd[0], hd[1], 8 * s, color, alpha);
  HD.ink(c, [P(lean - 10, -75), P(lean + 12, -75)], id + 9, 2.6 * s, 0.3, alpha, color);
};
})(window);
