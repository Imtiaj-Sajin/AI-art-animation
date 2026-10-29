// Episode 02 — The Wow! Signal (YouTube Short, vertical 1080x1920, <= 68 s).
// Uses EP helpers (camAt, flashAt, top, chalk) from ../01-flannan-isles/scenes-1.js.
// Safe zones: key art and text inside x 60..940, y 160..1460. Captions are burned in at y ~1345.
(function () {
'use strict';
const SCENES = window.SCENES = {};
const { C, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, easeOutBack } = HD;
const CHALK = EP.chalk;
const RED = '#d23a2c';
const MONO = '"Courier New", Courier, monospace';
function topText(L) { const c = L.dark; c.setTransform(1, 0, 0, 1, 0, 0); return c; }
const SIGNAL = ['6', 'E', 'Q', 'U', 'J', '5'];
const SIGNAL_V = [6, 14, 26, 30, 19, 5];             // intensity values (A=10 ... U=30)

// ---------- the Big Ear radio telescope (Kraus type), side view ----------
// (x0, y0) = left end of the ground plane; s = scale. vis: 0..1 how much of it still stands (for the teardown).
function bigEar(L, x0, y0, s, { id = 4000, tone = 1, vis = 1, t = 0 } = {}) {
  const T = pts => HD.xform(pts, x0, y0, 0, s);
  const metal = HD.mix('#2a3048', '#c9ccd6', tone), lattice = HD.mix('#0d1020', '#5d6478', tone);
  const part = (k) => clamp(vis * 4 - k);               // parts fall in order: flat, parabola, ground, hut
  // flat tilting reflector (left)
  const a = part(3);
  if (a > 0) {
    const flat = [[40, 0], [90, 0], [50, -330], [0, -330]];
    HD.crayon(L.col, T(flat), metal, id, { alpha: 0.9 * a, spacing: 5 });
    HD.inkShape(L.ink, T(flat), id + 1, 2.4, 1, a);
    for (let i = 1; i < 8; i++) { const u = i / 8; HD.ink(L.ink, T([[lerp(40, 0, u), -330 * u], [lerp(90, 50, u), -330 * u]]), id + 2 + i, 1.2, 0.4, 0.8 * a, lattice); }
    for (let i = 0; i < 6; i++) HD.ink(L.ink, T([[40 + i * 9, 0], [i * 9, -330]]), id + 12 + i, 1, 0.4, 0.5 * a, lattice);
    HD.ink(L.ink, T([[90, 0], [150, -40], [50, -330]]), id + 20, 1.6, 0.6, 0.7 * a, lattice);
  }
  // fixed parabolic reflector (right), concave towards the flat reflector
  const b = part(2);
  if (b > 0) {
    const front = HD.quadPts([760, 0], [800, -120], [900, -210], 12);
    const back = HD.quadPts([900, -210], [840, -90], [800, 0], 12);
    const para = [...front, ...back.slice(1)];
    HD.crayon(L.col, T(para), metal, id + 30, { alpha: 0.9 * b, spacing: 5 });
    HD.inkShape(L.ink, T(para), id + 31, 2.4, 1, b);
    for (let i = 1; i < 7; i++) { const u = i / 7, p = front[Math.round(u * 12)], q = back[12 - Math.round(u * 12)]; HD.ink(L.ink, T([p, q]), id + 32 + i, 1.1, 0.4, 0.7 * b, lattice); }
    for (let i = 0; i < 5; i++) HD.ink(L.ink, T([[820 + i * 22, 0], [820 + i * 22, -40 - i * 30]]), id + 40 + i, 1.4, 0.4, 0.8 * b, lattice);
  }
  // aluminium ground plane between them
  const c = part(1);
  if (c > 0) {
    const plane = [[90, 0], [790, 0], [790, 14], [90, 14]];
    HD.crayon(L.col, T(plane), HD.mix('#3a4058', '#dfe2ea', tone), id + 50, { alpha: 0.9 * c, spacing: 4 });
    HD.inkShape(L.ink, T(plane), id + 51, 2, 0.6, c);
    for (let i = 0; i < 18; i++) HD.ink(L.ink, T([[110 + i * 38, 0], [104 + i * 38, 14]]), id + 52 + i, 1, 0.3, 0.5 * c, lattice);
  }
  // feed-horn house on its track
  const d = part(0);
  if (d > 0) {
    const hut = [[110, 0], [190, 0], [190, -52], [110, -52]];
    HD.crayon(L.col, T(hut), HD.mix('#3b2f2a', '#c45a3a', tone), id + 80, { alpha: 0.9 * d, spacing: 4 });
    HD.inkShape(L.ink, T(hut), id + 81, 2, 0.6, d);
    HD.crayon(L.col, T([[190, -44], [232, -56], [232, -18], [190, -26]]), metal, id + 82, { alpha: 0.9 * d });
    HD.inkShape(L.ink, T([[190, -44], [232, -56], [232, -18], [190, -26]]), id + 83, 1.8, 0.5, d);
  }
  return { feed: T([[232, -37]])[0], flatMid: T([[25, -170]])[0], para: T([[840, -100]])[0] };
}
function sky(L, key, top, bottom, t, starA = 0.8) {
  HD.washRect(L.col, key, -500, -500, 2100, 2900, top, 0.8);
  HD.washRect(L.col, key + 'b', -500, 900, 2100, 1600, bottom, 0.5);
  HD.stars(L, 90, -100, -100, 1300, 1200, t, 7, starA);
}
function ground(L, key, y, color) {
  HD.washRect(L.col, key, -500, y, 2100, 1500, color, 0.85);
  HD.ink(L.ink, [[-500, y], [1600, y + 4]], 4900, 2.4, 1.4, 0.7);
}
// a travelling radio wave (squiggle) along a straight path, drawn up to progress p
function radioWave(L, a, b, p, id, color = '#ffd27a', amp = 18, alpha = 1) {
  if (p <= 0) return;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]), nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
  const pts = [];
  for (let d = 0; d <= len * p; d += 6) {
    const u = d / len, w = Math.sin(d * 0.09) * amp * (0.4 + 0.6 * Math.sin(Math.PI * u));
    pts.push([lerp(a[0], b[0], u) + nx * w, lerp(a[1], b[1], u) + ny * w]);
  }
  if (pts.length < 2) return;
  HD.ink(L.ink, pts, id, 3, 0.6, alpha, color);
  const head = pts[pts.length - 1];
  HD.glow(L.glow, head[0], head[1], 90, '#ffd27a', 0.8 * alpha);
}

// =====================================================================
// HOOK — a signal from deep space, 72 seconds, never again.
// =====================================================================
SCENES.hook = {
  enter: { type: 'cut', dur: 0 },
  draw(L, k) {
    const t = k.t;
    HD.cam(L, EP.camAt([{ t: k.start, s: 1.08, x: 540, y: 900 }, { t: k.end, s: 1.0, x: 540, y: 960 }], t));
    sky(L, 'w-hk-sky', '#141b3a', '#0b1028', t, 0.9);
    const src = [600, 470];
    const gone = prog(t, k.at('h3') + 0.8, 0.6);
    HD.glow(L.glow, src[0], src[1], 130 * (1 + 0.15 * Math.sin(t * 6)), '#ffe6a6', 0.9 * (1 - gone));
    HD.glow(L.glow, src[0], src[1], 26, '#ffffff', 1 - gone);
    ground(L, 'w-hk-gr', 1190, '#0a0d1c');
    const ear = bigEar(L, 90, 1190, 1.0, { tone: 0.38, t });
    const p = prog(t, k.at('h1') + 1.4, 1.6);
    radioWave(L, src, ear.feed, p, 4100, '#ffd27a', 20, 1 - gone);
    if (p >= 1 && gone < 1) {
      for (let r = 0; r < 3; r++) {
        const age = ((t * 0.9 + r / 3) % 1);
        HD.ink(L.ink, HD.ellipse(ear.feed[0], ear.feed[1], 30 + age * 120, 22 + age * 90, 24, 0, -Math.PI * 0.9, -Math.PI * 0.1), 4110 + r, 2.4, 0.4, (1 - age) * (1 - gone), '#ffd27a');
      }
      HD.glow(L.glow, ear.feed[0], ear.feed[1], 160, '#ffd27a', 0.5 * (1 - gone));
    }
    HD.darkness(L, 0.3, [], '#03050f');
    const s = topText(L);
    const a1 = 1 - prog(t, k.at('h2') - 0.2, 0.3);
    HD.text(s, 'A SIGNAL FROM', 540, 240, { size: 96, font: 'brand', weight: 700, color: '#fff3e3', p: prog(t, 0.05, 0.4), align: 'center', id: 4120, shadow: false, alpha: a1 });
    HD.text(s, 'DEEP SPACE.', 540, 350, { size: 110, font: 'brand', weight: 700, color: C.orange, p: prog(t, 0.4, 0.4), align: 'center', id: 4121, shadow: false, alpha: a1 });
    const a2 = HD.window(t, k.at('h2'), k.at('h3') + 0.1, 0.2, 0.2);
    HD.text(s, '72 SECONDS.', 540, 300, { size: 130, font: 'brand', weight: 700, color: '#fff3e3', p: prog(t, k.at('h2'), 0.4), align: 'center', id: 4122, shadow: false, alpha: a2 });
    HD.text(s, 'NEVER AGAIN.', 540, 300, { size: 124, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('h3') + 0.1, 0.5), align: 'center', id: 4123, shadow: false });
  },
};

// =====================================================================
// EAR — Big Ear, listening; mostly noise.
// =====================================================================
SCENES.ear = {
  enter: { type: 'bleed', dur: 0.8 },
  draw(L, k) {
    const t = k.t;
    HD.cam(L, EP.camAt([{ t: k.start, s: 1.12, x: 520, y: 1000 }, { t: k.at('e2'), s: 1.0, x: 540, y: 960 }, { t: k.end, s: 1.0, x: 540, y: 940 }], t));
    sky(L, 'w-er-sky', '#2b3a6e', '#6b5a7a', t, 0.5);
    HD.glow(L.glow, 800, 1150, 600, '#f4a35c', 0.25);
    ground(L, 'w-er-gr', 1190, '#2c3324');
    const ear = bigEar(L, 90, 1190, 1.0, { tone: 0.8, t });
    // waves from the sky: down onto the flat reflector, across to the dish, back to the feed horns
    for (let i = 0; i < 3; i++) {
      const ph = ((t - k.start) * 0.45 + i / 3) % 1;
      const a = [ear.flatMid[0] + 260 - i * 30, ear.flatMid[1] - 420], b = [ear.flatMid[0] + 10, ear.flatMid[1] + i * 30 - 20];
      const c = [ear.para[0] - 20, ear.para[1] + i * 20 - 20], d = ear.feed;
      const seg = ph < 0.4 ? [a, b, ph / 0.4] : ph < 0.75 ? [b, c, (ph - 0.4) / 0.35] : [c, d, (ph - 0.75) / 0.25];
      const pa = seg[0], pb = seg[1], u = seg[2];
      const head = [lerp(pa[0], pb[0], u), lerp(pa[1], pb[1], u)];
      HD.ink(L.ink, [[lerp(pa[0], pb[0], Math.max(0, u - 0.25)), lerp(pa[1], pb[1], Math.max(0, u - 0.25))], head], 4200 + i, 3, 0.4, 0.8, '#fff1c2');
      HD.glow(L.glow, head[0], head[1], 40, '#fff1c2', 0.6);
    }
    // noise readout on a little paper strip
    const np = prog(t, k.at('e2') - 0.1, 0.4);
    if (np > 0) {
      const strip = HD.rect(160, 520, 760, 120);
      HD.crayon(L.col, strip, '#f4efe0', 4220, { alpha: np, hatch: 0.05 });
      HD.inkShape(L.ink, strip, 4221, 2, 0.6, np);
      const row = '1 1 2 1   1 2 1 1   2 1 1';
      HD.text(L.ink, row.slice(0, Math.floor(row.length * prog(t, k.at('e2'), 1.4))), 190, 600, { size: 52, font: MONO, weight: 700, id: 4222, alpha: np, shadow: false });
      HD.text(L.ink, 'noise...', 900, 690, { size: 50, color: '#f1e7cf', p: prog(t, k.at('e2') + 0.8, 0.6), align: 'right', id: 4223, weight: 700 });
    }
    const s = topText(L);
    const a = 1 - prog(t, k.at('e2') - 0.2, 0.3);
    HD.text(s, 'BIG EAR', 540, 270, { size: 130, font: 'brand', weight: 700, color: '#fff3e3', p: prog(t, k.start + 0.2, 0.5), align: 'center', id: 4230, shadow: false, alpha: a });
    HD.text(s, 'Ohio State University · listening for other worlds', 540, 340, { size: 40, color: '#f1e7cf', p: prog(t, k.start + 0.8, 1.2), align: 'center', id: 4231, weight: 700, alpha: a });
    HD.text(s, 'OHIO, 1977', 540, 270, { size: 90, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('e2'), 0.4), align: 'center', id: 4232, shadow: false });
  },
};

// =====================================================================
// PRINTOUT — 6EQUJ5, read out letter by letter, circled in red: "Wow!"
// =====================================================================
const COLS = 9, ROWS = 34, CW = 86, RH = 64, PX = 150, PY = -200, TARGET_COL = 3, TARGET_ROW = 17;
const GRID = Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => {
  if (c === TARGET_COL && r >= TARGET_ROW && r < TARGET_ROW + 6) return SIGNAL[r - TARGET_ROW];
  if (r >= TARGET_ROW - 4 && r <= TARGET_ROW - 2) return ' ';          // room for the date header
  const v = HD.h2(r * 31 + c, 77);
  return v < 0.38 ? ' ' : v < 0.78 ? '1' : v < 0.95 ? '2' : '3';
}));
const cellX = c => PX + 40 + c * CW, cellY = r => PY + 120 + r * RH;
SCENES.printout = {
  enter: { type: 'bleed', dur: 0.8 },
  draw(L, k) {
    const t = k.t;
    const ids = ['p2a', 'p2b', 'p2c', 'p2d', 'p2e', 'p2f'];
    const focusY = cellY(TARGET_ROW + 2.5);
    HD.cam(L, EP.camAt([
      { t: k.start, s: 1.0, x: 540, y: focusY - 900 },
      { t: k.at('p1') + 2.6, s: 1.05, x: 540, y: focusY },
      { t: k.at('p3'), s: 1.12, x: 520, y: focusY },
      { t: k.at('p3') + 2.2, s: 1.05, x: 500, y: focusY },
    ], t));
    HD.washRect(L.col, 'w-pr-desk', -500, -2000, 2100, 6000, '#3a2c22', 0.7);
    // fan-fold computer paper with pale green bars and tractor holes
    const paperTop = PY - 1400, paperBot = PY + 120 + ROWS * RH + 200;
    const paper = [[PX - 60, paperTop], [PX + COLS * CW + 120, paperTop], [PX + COLS * CW + 120, paperBot], [PX - 60, paperBot]];
    HD.crayon(L.col, paper, '#f6f2e4', 4300, { hatch: 0.04 });
    for (let r = -22; r < ROWS + 2; r += 2) HD.washRect(L.col, 'w-pr-bar' + r, PX - 20, cellY(r) - RH * 0.8, COLS * CW + 100, RH, '#bfe0bf', 0.35);
    for (let y = paperTop + 30; y < paperBot; y += 48) for (const hx of [PX - 32, PX + COLS * CW + 92]) HD.inkShape(L.ink, HD.ellipse(hx, y, 9, 9, 10), 4310 + (y | 0) + hx, 1.4, 0.3, 0.6);
    HD.inkShape(L.ink, paper, 4301, 2, 0.8);
    HD.text(L.ink, '15 AUG 1977   22:16 EST   BIG EAR / OSURO', PX + 10, cellY(TARGET_ROW - 3), { size: 34, font: MONO, weight: 700, id: 4320, color: '#3b3b48', shadow: false });
    const dim = 1 - 0.65 * prog(t, k.at('p2a') - 0.4, 0.5);               // the rest of the page fades back
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const ch = GRID[r][c];
      if (ch === ' ') continue;
      const isSig = c === TARGET_COL && r >= TARGET_ROW && r < TARGET_ROW + 6;
      HD.text(L.ink, ch, cellX(c), cellY(r), { size: 50, font: MONO, weight: 700, id: 4400 + r * 13 + c, color: isSig ? '#14141c' : '#4a4a58', shadow: false, boil: 0.4, alpha: isSig ? 1 : dim });
    }
    // highlight each character as it's read, with its intensity bar
    ids.forEach((id, i) => {
      const hp = prog(t, k.at(id) - 0.05, 0.25);
      if (hp <= 0) return;
      const x = cellX(TARGET_COL), y = cellY(TARGET_ROW + i);
      HD.washRect(L.col, 'w-pr-hl' + i, x - 18, y - 50, 70, 64, '#ffd84a', 0.55 * hp);
      const bw = SIGNAL_V[i] * 12 * easeOut(prog(t, k.at(id), 0.4));
      const bar = HD.rect(x + 80, y - 40, Math.max(2, bw), 40);
      HD.crayon(L.col, bar, i === 3 ? RED : C.orange, 4500 + i, { spacing: 4 });
      HD.inkShape(L.ink, bar, 4510 + i, 1.6, 0.4);
    });
    // noise level and labels
    const nl = prog(t, k.at('p3') + 0.2, 0.6);
    if (nl > 0) {
      const x0 = cellX(TARGET_COL) + 80 + 2 * 12;
      HD.ink(L.ink, HD.partial([[x0, cellY(TARGET_ROW) - 90], [x0, cellY(TARGET_ROW + 5) + 30]], nl), 4520, 2.4, 0.5, 0.9, '#2e6b3a');
      HD.text(L.ink, 'noise', x0 - 6, cellY(TARGET_ROW) - 100, { size: 40, color: '#2e6b3a', p: nl, id: 4521, weight: 700, align: 'center' });
      HD.text(L.ink, 'the signal', cellX(TARGET_COL) + 80 + 30 * 12, cellY(TARGET_ROW) - 70, { size: 44, color: RED, p: prog(t, k.at('p3') + 0.8, 0.6), id: 4522, weight: 700, align: 'right' });
    }
    // red circle and "Wow!"
    const cx = cellX(TARGET_COL) + 14, cy = cellY(TARGET_ROW + 2.5) - 20;
    HD.circleMark(L.ink, cx, cy, 64, 230, prog(t, k.at('p3') + 2.3, 0.7), 4530, 6, RED);
    HD.text(L.ink, 'Wow!', cx - 110, cy + 30, { size: 150, weight: 700, color: RED, p: prog(t, k.at('p3') + 3.5, 0.6), align: 'right', id: 4531, rot: -0.12 });
    HD.darkness(L, 0.18, [{ x: 540, y: 900, r: 900, core: 0.4 }], '#120c08');
    const s = topText(L);
    const band = s.createLinearGradient(0, 0, 0, 430);
    band.addColorStop(0, 'rgba(18,12,8,0.85)'); band.addColorStop(0.7, 'rgba(18,12,8,0.6)'); band.addColorStop(1, 'rgba(18,12,8,0)');
    s.fillStyle = band; s.fillRect(0, 0, 1080, 430);
    HD.text(s, 'THE PRINTOUT', 540, 230, { size: 90, font: 'brand', weight: 700, color: '#fff3e3', p: prog(t, k.start + 0.2, 0.5), align: 'center', id: 4540, shadow: false, alpha: 1 - prog(t, k.at('p2a') - 0.2, 0.3) });
    HD.text(s, '6 E Q U J 5', 540, 240, { size: 110, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('p2a') - 0.1, 0.3) * 1, align: 'center', id: 4541, shadow: false, alpha: 1 - prog(t, k.at('p3') + 3.2, 0.3) });
    HD.text(s, 'WOW!', 540, 250, { size: 150, font: 'brand', weight: 700, color: RED, p: prog(t, k.at('p3') + 3.5, 0.4), align: 'center', id: 4542, shadow: false });
  },
};

// =====================================================================
// HYDROGEN — the radio dial settles on 1420 MHz; the hydrogen atom glows.
// =====================================================================
SCENES.hydrogen = {
  enter: { type: 'bleed', dur: 0.8 },
  draw(L, k) {
    const t = k.t, lt = k.lt;
    HD.cam(L, EP.camAt([{ t: k.start, s: 1.08, x: 540, y: 880 }, { t: k.end, s: 1.0, x: 540, y: 900 }], t));
    sky(L, 'w-hy-bg', '#1c2148', '#120f2c', t, 0.4);
    const cx = 540, cy = 900, R = 360, a0 = -Math.PI * 0.9, a1 = -Math.PI * 0.1;
    const fAt = f => lerp(a0, a1, (f - 1400) / 40);
    // dial face
    const face = [...HD.ellipse(cx, cy, R + 40, R + 40, 40, 0, a0 - 0.12, a1 + 0.12), ...HD.ellipse(cx, cy, R - 120, R - 120, 30, 0, a1 + 0.12, a0 - 0.12)];
    HD.crayon(L.col, face, '#e9dcb8', 4600, { spacing: 5, hatch: 0.15 });
    HD.inkShape(L.ink, face, 4601, 3, 1);
    for (let f = 1400; f <= 1440; f += 2) {
      const a = fAt(f), big = f % 10 === 0;
      HD.ink(L.ink, [[cx + Math.cos(a) * (R - (big ? 50 : 30)), cy + Math.sin(a) * (R - (big ? 50 : 30))], [cx + Math.cos(a) * R, cy + Math.sin(a) * R]], 4610 + f, big ? 3 : 1.6, 0.3);
      if (big) HD.text(L.ink, String(f), cx + Math.cos(a) * (R - 90), cy + Math.sin(a) * (R - 90) + 14, { size: 36, font: MONO, weight: 700, align: 'center', id: 4660 + f, shadow: false });
    }
    // needle sweeps, overshoots, settles on 1420
    const u = prog(lt, 0.3, 3.2);
    const f = u < 0.55 ? lerp(1402, 1437, easeInOut(u / 0.55)) : lerp(1437, 1420.4, easeOutBack(clamp((u - 0.55) / 0.45)));
    const na = fAt(f);
    HD.ink(L.ink, [[cx, cy], [cx + Math.cos(na) * (R + 20), cy + Math.sin(na) * (R + 20)]], 4700, 5, 0.3, 1, RED);
    HD.dot(L.ink, cx, cy, 16, '#2a2a33');
    const lock = prog(lt, 3.4, 0.5);
    const la = fAt(1420.4);
    HD.glow(L.glow, cx + Math.cos(la) * R, cy + Math.sin(la) * R, 160, '#ffd27a', 0.8 * lock);
    // hydrogen atom below the dial
    const ax = 540, ay = 1110;
    HD.dot(L.ink, ax, ay, 18, C.orange);
    HD.glow(L.glow, ax, ay, 90, '#ffb36b', 0.5 * (0.6 + 0.4 * lock));
    HD.ink(L.ink, HD.closed(HD.ellipse(ax, ay, 110, 44, 30, 0.3)), 4720, 2, 0.6, 0.8, '#c9d4ff');
    const ea = lt * 3;
    const ex = ax + Math.cos(ea) * 110 * Math.cos(0.3) - Math.sin(ea) * 44 * Math.sin(0.3), ey = ay + Math.cos(ea) * 110 * Math.sin(0.3) + Math.sin(ea) * 44 * Math.cos(0.3);
    HD.dot(L.ink, ex, ey, 9, '#c9d4ff');
    HD.glow(L.glow, ex, ey, 40, '#c9d4ff', 0.6);
    HD.darkness(L, 0.2, [], '#03050f');
    const s = topText(L);
    HD.text(s, '1420 MHz', 540, 270, { size: 130, font: 'brand', weight: 700, color: C.orange, p: prog(lt, 3.3, 0.5), align: 'center', id: 4730, shadow: false });
    HD.text(s, 'the hydrogen line', 540, 345, { size: 56, color: '#f1e7cf', p: prog(lt, 3.8, 0.8), align: 'center', id: 4731, weight: 700 });
    HD.text(s, 'where an alien call was expected', 540, 1260, { size: 44, color: '#d8ccb2', p: prog(lt, 4.6, 1.0), align: 'center', id: 4732 });
  },
};

// =====================================================================
// SEARCH — Sagittarius; dishes listening for decades; theories; NOT PROVEN.
// =====================================================================
const TEAPOT = [[360, 600], [470, 560], [590, 590], [660, 520], [760, 560], [700, 660], [560, 700], [420, 690]];
const TEAPOT_LINES = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0], [1, 6], [2, 5]];
const YEARS = ['1977', '1987', '1995', '1999', '2022'];
function dish(L, x, y, s, aim, id) {
  const T = pts => HD.xform(pts, x, y, 0, s);
  HD.ink(L.ink, T([[-40, 0], [0, -90], [40, 0]]), id, 4, 0.5);
  const bowl = HD.xform(HD.ellipse(0, 0, 90, 30, 20, 0, 0, Math.PI), x, y - 100 * s, aim, s);
  const rim = HD.xform([[-90, 0], [90, 0]], x, y - 100 * s, aim, s);
  HD.crayon(L.col, [...bowl, ...rim.reverse()], '#c9ccd6', id + 1, { spacing: 4 });
  HD.inkShape(L.ink, [...bowl], id + 2, 2.4, 0.6);
  HD.ink(L.ink, HD.xform([[0, 10], [0, -70]], x, y - 100 * s, aim, s), id + 3, 2, 0.4);
  return HD.xform([[0, -70]], x, y - 100 * s, aim, s)[0];
}
SCENES.search = {
  enter: { type: 'bleed', dur: 0.8 },
  draw(L, k) {
    const t = k.t;
    HD.cam(L, EP.camAt([{ t: k.start, s: 1.1, x: 560, y: 760 }, { t: k.at('s2'), s: 1.0, x: 540, y: 900 }, { t: k.end, s: 1.04, x: 540, y: 880 }], t));
    sky(L, 'w-se-sky', '#0f1534', '#0b0f26', t, 0.9);
    const lp = prog(t, k.start + 0.3, 1.5);
    TEAPOT_LINES.forEach(([a, b], i) => HD.ink(L.ink, HD.partial([TEAPOT[a], TEAPOT[b]], clamp(lp * 2 - i * 0.1)), 4800 + i, 1.6, 0.4, 0.6, '#9fb2e8'));
    TEAPOT.forEach(([x, y], i) => { HD.glow(L.glow, x, y, 30, '#fff6dc', 0.9); HD.dot(L.ink, x, y, 4, '#fff6dc'); });
    HD.text(L.ink, 'SAGITTARIUS', 560, 790, { size: 40, font: 'serif', weight: 400, color: '#c9d4ff', p: prog(t, k.start + 1.2, 1), align: 'center', id: 4830 });
    const tgt = [610, 450];
    const ring = HD.ellipse(tgt[0], tgt[1], 70, 70, 30);
    for (let i = 0; i < ring.length; i += 2) HD.ink(L.ink, [ring[i], ring[(i + 1) % ring.length]], 4840 + i, 2.4, 0.3, 0.9 * prog(t, k.start + 1.8, 0.5), C.orange);
    ground(L, 'w-se-gr', 1190, '#0a0d1c');
    const tips = [[230, 0.35], [540, 0.05], [850, -0.3]].map(([x, aim], i) => dish(L, x, 1190, 1.0, aim, 4850 + i * 10));
    tips.forEach((tip, i) => {
      const sweep = Math.sin(t * 0.8 + i) * 0.06;
      const ang = Math.atan2(tgt[1] - tip[1], tgt[0] - tip[0]) + sweep;
      HD.beam(L.glow, tip[0], tip[1], ang, Math.hypot(tgt[1] - tip[1], tgt[0] - tip[0]) + 60, 0.05, 0.25);
    });
    YEARS.forEach((y, i) => HD.text(L.ink, y, 150 + i * 195, 960, { size: 46, font: MONO, weight: 700, color: '#f1e7cf', p: prog(t, k.at('s1') + 0.4 + i * 0.5, 0.3), align: 'center', id: 4880 + i, shadow: false }));
    const no = prog(t, k.at('s2'), 0.3);
    YEARS.forEach((y, i) => { if (no > 0) HD.ink(L.ink, [[110 + i * 195, 948], [190 + i * 195, 930]], 4890 + i, 4, 0.5, no, RED); });
    // theories, then a stamp
    HD.text(L.ink, 'a flaring hydrogen cloud?', 540, 300, { size: 52, color: '#f1e7cf', p: prog(t, k.at('t1'), 0.8), align: 'center', id: 4900, weight: 700 });
    HD.text(L.ink, 'interference?', 540, 1080, { size: 52, color: '#f1e7cf', p: prog(t, k.at('t1') + 1.5, 0.6), align: 'center', id: 4901, weight: 700 });
    const sp = prog(t, k.at('t1') + 2.6, 0.3);
    if (sp > 0) {
      const sc = lerp(1.8, 1, easeOut(sp)), c = L.ink;
      c.save(); c.translate(540, 640); c.rotate(-0.12); c.scale(sc, sc); c.globalAlpha = 0.9 * clamp(sp * 2);
      c.strokeStyle = RED; c.lineWidth = 9; c.strokeRect(-330, -80, 660, 140); c.restore();
      HD.text(c, 'NOT PROVEN', 540, 640 + 34 * sc, { size: 104 * sc, font: 'brand', weight: 700, color: RED, align: 'center', rot: -0.12, alpha: 0.9 * clamp(sp * 2), id: 4910, shadow: false });
    }
    HD.darkness(L, 0.15, [], '#03050f');
    const s = topText(L);
    HD.text(s, 'NOT ONCE.', 540, 250, { size: 120, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('s2'), 0.3), align: 'center', id: 4920, shadow: false, alpha: 1 - prog(t, k.at('t1') - 0.2, 0.3) });
  },
};

// =====================================================================
// END — 1998: Big Ear comes down; a golf flag goes up.
// =====================================================================
SCENES.end = {
  enter: { type: 'bleed', dur: 0.8 },
  draw(L, k) {
    const t = k.t;
    HD.cam(L, EP.camAt([{ t: k.start, s: 1.05, x: 540, y: 980 }, { t: k.end, s: 1.0, x: 540, y: 960 }], t));
    HD.washRect(L.col, 'w-en-sky', -500, -500, 2100, 2900, '#9cc2dc', 0.4);
    HD.drawWash(L.col, HD.makeWash(910), 250, 420, 160, 1, '#ffffff', 0.25);
    HD.drawWash(L.col, HD.makeWash(911), 800, 300, 120, 2, '#ffffff', 0.25);
    ground(L, 'w-en-gr', 1190, '#7c9a55');
    const down = prog(t, k.at('d1') + 2.0, 1.8);
    bigEar(L, 90, 1190, 1.0, { tone: 0.9, vis: 1 - down, t });
    if (down > 0 && down < 1) for (let i = 0; i < 6; i++) HD.drawWash(L.col, HD.makeWash(920 + i), 150 + i * 150, 1150 - down * 60, 40 + down * 70, i, '#b9a78a', 0.18 * (1 - down));
    const up = easeOutBack(prog(t, k.at('d1') + 3.6, 0.6));
    if (up > 0) {
      HD.ink(L.ink, [[620, 1190], [620, 1190 - 260 * up]], 4950, 4, 0.4);
      const flag = [[620, 1190 - 260 * up], [740, 1190 - 230 * up], [620, 1190 - 200 * up]];
      HD.crayon(L.col, flag, RED, 4951, { spacing: 3 });
      HD.inkShape(L.ink, flag, 4952, 2, 0.4);
      HD.inkShape(L.ink, HD.ellipse(620, 1192, 28, 7, 12), 4953, 2, 0.3);
      for (const [hx, i] of [[180, 0], [360, 1]]) {
        const hp = easeOutBack(prog(t, k.at('d1') + 3.9 + i * 0.2, 0.5)), T = pts => HD.xform(pts, hx, 1190, 0, hp);
        const house = [[-60, 0], [60, 0], [60, -80], [0, -130], [-60, -80]];
        HD.crayon(L.col, T(house), '#efe6d2', 4960 + i, { spacing: 4, hatch: 0.1 });
        HD.inkShape(L.ink, T(house), 4962 + i, 2.2, 0.6);
        HD.inkShape(L.ink, T(HD.rect(-15, -45, 30, 45)), 4964 + i, 1.6, 0.4);
      }
    }
    const s = topText(L);
    HD.text(s, '1998', 540, 280, { size: 150, font: 'brand', weight: 700, color: HD.INK, p: prog(t, k.at('d1'), 0.4), align: 'center', id: 4970, shadow: false });
    HD.text(s, 'torn down.', 540, 370, { size: 70, color: RED, p: prog(t, k.at('d1') + 2.2, 0.6), align: 'center', id: 4971, weight: 700 });
  },
};

// =====================================================================
// OUTRO — the owl looks up at the sky; the Owl Society.
// =====================================================================
const SOCIETY_V = Array.from({ length: 22 }, (_, i) => ({ x: 70 + HD.h2(i, 41) * 940, y: 560 + HD.h2(i, 42) * 560, s: 0.55 + HD.h2(i, 43) * 0.6, at: HD.h2(i, 44) }))
  .filter(e => Math.hypot(e.x - 560, (e.y - 900) * 0.9) > 300);
SCENES.outro = {
  enter: { type: 'fade', dur: 1.0 },
  draw(L, k) {
    const t = k.t, lt = k.lt;
    HD.cam(L, EP.camAt([{ t: k.start, s: 1.12, x: 540, y: 960 }, { t: k.at('o2') + 1.5, s: 1.0, x: 540, y: 960 }], t));
    HD.washRect(L.col, 'w-ou-bg', -400, -400, 1900, 2800, '#1a2144', 0.8);
    for (let i = 0; i < 6; i++) {
      const x = -60 + i * 230, h = 600 + HD.h2(i, 6) * 400;
      HD.washPoly(L.col, 'w-ou-tree' + i, [[x - 90, 1700], [x - 30, 1560 - h], [x + 40, 1540 - h * 1.05], [x + 110, 1700]], '#0a0d20', 0.35);
    }
    HD.stars(L, 60, -100, 100, 1300, 700, t, 21, 0.5);
    // the star in Sagittarius pulses once more, and the owl looks up at it
    const ping = Math.max(0, Math.sin((lt - 0.5) * 2.2)) * (1 - prog(t, k.at('o2'), 1));
    HD.glow(L.glow, 820, 300, 140 * (0.6 + ping), '#ffe6a6', 0.4 + 0.6 * ping);
    HD.ink(L.ink, [[-100, 1180], [300, 1166], [700, 1176], [1200, 1164]], 3300, 30, 2, 1, '#22170f');
    const s = 1.2, oy = 1166 - 232 * s;
    const wink = HD.window(t, k.at('o2') + 2.4, k.at('o2') + 2.95, 0.12, 0.15);
    const lookUp = 1 - prog(t, k.at('o2'), 0.6);
    HD.owl(L, 540, oy, s, {
      blink: (lt % 3.6 > 3.4) ? 1 : 0, wink, look: [0.8 * lookUp, -0.9 * lookUp], brow: 0.6 + 0.4 * prog(t, k.at('o1') + 1.0, 0.4),
      wingUp: 0.85, lantern: 1, lit: 1, swing: Math.sin(lt * 1.4) * 0.1, id: 5000, t, tilt: 0.05 * lookUp,
    });
    const lantern = [540 + 150 * s, oy - 40 - 0.85 * 60];
    const open = prog(t, k.at('o2') + 0.3, 2.4);
    for (const e of SOCIETY_V) HD.eyePair(L, e.x, e.y, e.s, clamp((open - e.at * 0.7) * 3), 3400 + Math.floor(e.x));
    HD.darkness(L, 0.88, [{ x: lantern[0], y: lantern[1], r: 700, core: 0.3 }, { x: 820, y: 300, r: 260, a: 0.7 }], '#04051a', { s: 1, x: 540, y: 960 });
    const c = topText(L);
    const a1 = 1 - prog(t, k.at('o2') - 0.2, 0.3);
    HD.text(c, 'nature...', 540, 1260, { size: 70, color: CHALK, p: prog(t, k.at('o1') + 0.4, 0.6), align: 'center', id: 3310, weight: 700, alpha: a1 });
    HD.text(c, 'OR HELLO?', 540, 1370, { size: 100, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('o1') + 1.2, 0.5), align: 'center', id: 3311, shadow: false, alpha: a1 });
    const em = prog(t, k.at('o2') + 0.9, 1.3);
    if (em > 0) HD.owlEmblem({ ink: c, glow: L.glow, t }, 540, 420, 0.85, em, 3320);
    HD.text(c, 'Keep watching. Keep learning.', 540, 1280, { size: 58, color: CHALK, p: prog(t, k.at('o2'), 1.2), align: 'center', id: 3312, weight: 700 });
    HD.text(c, 'THE OWL SOCIETY', 540, 1385, { size: 84, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('o2') + 1.6, 0.8), align: 'center', id: 3313, shadow: false });
    L.fade = prog(t, k.end - 0.5, 0.5);
  },
};
})();
