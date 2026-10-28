// Episode 01 scenes, part 1: hook, title, map, keepers, dark, wait, arrival.
// Each scene: { enter: {type: 'bleed'|'fade'|'cut', dur}, draw(L, k) } where k gives timing helpers
// keyed to narration lines (k.at('hook4') = when that line starts). See index.html kit().
(function () {
'use strict';
const SCENES = window.SCENES = window.SCENES || {};
const { C, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutBack } = HD;
const CHALK = '#f1e7cf';

// ---------- shared helpers (also used by scenes-2.js via window.EP) ----------
const EP = window.EP = {};
// draw on top of the darkness layer, in camera space
EP.top = L => { if (L.camera) HD.applyCam(L.dark, L.camera); else L.dark.setTransform(1, 0, 0, 1, 0, 0); return L.dark; };
// camera keyframes [{t, s, x, y, r}] eased between
EP.camAt = (keys, t) => {
  if (t <= keys[0].t) return { ...keys[0] };
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i].t) {
      const a = keys[i - 1], b = keys[i], u = easeInOut((t - a.t) / Math.max(1e-3, b.t - a.t));
      return { s: lerp(a.s, b.s, u), x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), r: lerp(a.r || 0, b.r || 0, u) };
    }
  }
  return { ...keys[keys.length - 1] };
};
// lightning: quick double flicker that decays
EP.flashAt = (t, times) => {
  let f = 0;
  for (const s of times) {
    const d = t - s;
    if (d >= 0 && d < 1.4) f = Math.max(f, Math.exp(-d * 4.5) * (d > 0.07 && d < 0.15 ? 0.25 : 1));
  }
  return f;
};
EP.bolt = (L, x, y0, y1, id, alpha) => {
  if (alpha <= 0.05) return;
  const pts = [];
  let x1 = x;
  for (let y = y0; y <= y1; y += 26) { pts.push([x1, y]); x1 += (HD.h2(id, y | 0) - 0.5) * 50; }
  HD.ink(L.ink, pts, id, 3.5, 0.5, alpha, '#f6f3ff');
  for (const p of pts.filter((_, i) => i % 3 === 0)) HD.glow(L.glow, p[0], p[1], 90, '#cfdcff', alpha * 0.5);
};
EP.peg = (L, x, y, id) => {
  const knob = [[x - 9, y - 6], [x + 9, y - 6], [x + 7, y + 24], [x - 7, y + 24]];
  HD.crayon(L.col, knob, '#6b4428', id, { spacing: 3 });
  HD.inkShape(L.ink, knob, id + 1, 2, 0.4);
  HD.inkShape(L.ink, HD.ellipse(x, y + 26, 11, 6, 12), id + 2, 2, 0.4);
};
// A yellow oilskin coat + sou'wester hat hanging from a peg at (x, y)
EP.coat = (L, x, y, s, sway, id, alpha = 1) => {
  if (alpha <= 0) return;
  const T = pts => HD.xform(pts, x, y, sway, s);
  const body = HD.spline([[-34, 18], [0, 24], [34, 18], [104, 66], [118, 250], [124, 466], [62, 490], [0, 482], [-62, 490], [-124, 466], [-118, 250], [-104, 66]]);
  const sleeve = HD.spline([[92, 70], [130, 88], [146, 250], [146, 330], [110, 340], [98, 220], [90, 112]]);
  HD.crayon(L.col, T(body), C.oil, id, { alpha, spacing: 5, dark: '#a8741f' });
  for (const sx of [1, -1]) {
    const sl = sleeve.map(([px, py]) => [px * sx, py]);
    HD.crayon(L.col, T(sl), '#c99030', id + 2 + sx, { alpha, spacing: 5, dark: '#93641a' });
    HD.inkShape(L.ink, T(sl), id + 5 + sx, 2.4, 1, alpha);
  }
  HD.hatch(L.col, T([[40, 70], [104, 66], [118, 250], [124, 466], [62, 490], [50, 300]]), '#7a5214', id + 40, { alpha: 0.45 * alpha, spacing: 6, angle: 1.1 });
  HD.hatch(L.col, T([[-34, 18], [34, 18], [20, 90], [-20, 90]]), '#7a5214', id + 41, { alpha: 0.35 * alpha, spacing: 5, angle: 0.3 });
  HD.inkShape(L.ink, T(body), id + 8, 2.6, 1.2, alpha);
  HD.ink(L.ink, T(HD.quadPts([-34, 18], [0, 70], [34, 18], 8)), id + 9, 2.2, 0.6, alpha);
  HD.ink(L.ink, T([[0, 62], [3, 482]]), id + 10, 2.2, 1, alpha);
  for (const by of [110, 180, 250, 320, 390]) HD.dot(L.ink, ...T([[12, by]])[0], 5 * s, '#3b2a14', alpha);
  for (const fx of [-70, -30, 46, 84]) HD.ink(L.ink, T([[fx, 150], [fx + 6, 300], [fx - 4, 460]]), id + 20 + fx, 1.3, 2, 0.45 * alpha, '#7a5214');
  // sou'wester hat on the same peg
  const brim = HD.ellipse(0, 4, 78, 17, 24);
  const crown = HD.spline([[-42, 2], [-34, -42], [0, -54], [34, -42], [42, 2]]);
  HD.crayon(L.col, T(brim), '#c99030', id + 30, { alpha, spacing: 4, dark: '#93641a' });
  HD.crayon(L.col, T(crown), C.oil, id + 31, { alpha, spacing: 4, dark: '#a8741f' });
  HD.inkShape(L.ink, T(brim), id + 32, 2.2, 0.8, alpha);
  HD.inkShape(L.ink, T(crown), id + 33, 2.2, 0.8, alpha);
};
// Arched window with a storm outside
EP.window = (L, x, y, w, h, t, key, flash) => {
  const arc = HD.ellipse(x + w / 2, y + 60, w / 2, 60, 20, 0, Math.PI, Math.PI * 2);
  const poly = [[x, y + h], ...arc, [x + w, y + h]];
  const c = L.col;
  c.save(); HD.trace(c, poly, true); c.clip();
  HD.washRect(c, key + 'sky', x - 20, y - 20, w + 40, h + 40, '#1b2648', 0.8);
  HD.washRect(c, key + 'sea', x - 20, y + h * 0.62, w + 40, h, '#22365c', 0.6);
  c.restore();
  const k = L.ink;
  k.save(); HD.trace(k, poly, true); k.clip();
  for (let i = 0; i < 4; i++) {
    const yy = y + h * (0.64 + i * 0.09);
    const pts = [];
    for (let xx = x - 10; xx <= x + w + 10; xx += 12) pts.push([xx, yy + Math.sin(xx * 0.05 + t * (1.5 + i * 0.4) + i) * (3 + i * 2)]);
    HD.ink(k, pts, 880 + i, 1.2 + i * 0.4, 0.6, 0.55, '#9fb2d8');
  }
  k.strokeStyle = '#d4dcf2'; k.lineWidth = 1.5; k.globalAlpha = 0.45; k.beginPath();
  for (let i = 0; i < 70; i++) {
    const sp = 900 + HD.h2(i, 9) * 500, yy = y - 40 + ((HD.h2(i, 10) * (h + 80) + t * sp) % (h + 80)), xx = x + HD.h2(i, 11) * w;
    k.moveTo(xx, yy); k.lineTo(xx - 10, yy - 34);
  }
  k.stroke(); k.globalAlpha = 1;
  if (flash > 0.3) EP.bolt(L, x + w * 0.62, y + 20, y + h * 0.66, 870 + Math.floor(t), flash);
  k.restore();
  HD.inkShape(L.ink, poly, 860, 3.2, 1);
  HD.inkShape(L.ink, [[x + 14, y + h - 10], ...HD.ellipse(x + w / 2, y + 64, w / 2 - 14, 50, 20, 0, Math.PI, Math.PI * 2), [x + w - 14, y + h - 10]], 861, 1.6, 1, 0.7);
  HD.ink(L.ink, [[x + w / 2, y + 6], [x + w / 2, y + h]], 862, 3, 0.6);
  HD.ink(L.ink, [[x, y + h * 0.45], [x + w, y + h * 0.45]], 863, 3, 0.6);
  const sill = HD.rect(x - 24, y + h, w + 48, 22);
  HD.crayon(L.col, sill, '#6b4428', 864, { spacing: 3 });
  HD.inkShape(L.ink, sill, 865, 2.2, 0.6);
};
// generic rocky island/cliff: polygon + ink strata lines
EP.rock = (L, key, pts, { color = '#3c4157', alpha = 0.75, id = 1, strata = 8 } = {}) => {
  HD.occlude(L.ink, pts);
  HD.washPoly(L.col, key, pts, color, alpha / 2.2, { layers: 3 });
  HD.crayon(L.col, pts, color, id, { alpha: alpha * 0.55, spacing: 6, hatch: 0.35 });
  HD.inkShape(L.ink, pts, id + 1, 2.6, 1.6);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const c = L.ink;
  c.save(); HD.trace(c, pts, true); c.clip();
  for (let i = 0; i < strata; i++) {
    const yy = lerp(y0 + 30, y1, i / strata);
    const seg = [];
    for (let xx = x0; xx <= x1; xx += 20) seg.push([xx, yy + HD.noise1(xx * 0.01, id + i) * 14 + (xx - x0) * 0.04]);
    HD.ink(c, seg, id + 10 + i, 1.4, 1, 0.45);
  }
  c.restore();
};
EP.chalk = CHALK;

// =====================================================================
// 1. HOOK — cold open: three pegs, two empty, one coat left behind.
// =====================================================================
SCENES.hook = {
  enter: { type: 'cut', dur: 0 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 1.25, x: 640, y: 470 },
      { t: k.at('hook3') + 1, s: 1.15, x: 650, y: 470 },
      { t: k.at('hook4'), s: 1.15, x: 760, y: 480 },
      { t: k.at('hook4') + 1.4, s: 1.42, x: 1070, y: 560 },
      { t: k.at('hook5'), s: 1.42, x: 1080, y: 560 },
      { t: k.at('hook5') + 3.2, s: 1.25, x: 1420, y: 430 },
    ], t);
    HD.cam(L, cam);
    const flash = EP.flashAt(t, [k.start + 0.25, k.at('hook4') + 0.7, k.at('hook5') + 2.0]);

    // whitewashed stone wall, wood wainscot, floor
    HD.washRect(L.col, 'hk-wall', -300, -300, 2600, 1400, '#9a97a3', 0.55);
    HD.washRect(L.col, 'hk-wains', -300, 650, 2600, 300, '#6d5a4a', 0.6);
    HD.washRect(L.col, 'hk-floor', -300, 900, 2600, 400, '#45362c', 0.75);
    for (let x = -260; x < 2200; x += 90) HD.ink(L.ink, [[x, 655], [x + 3, 898]], 300 + x, 1.5, 1, 0.45);
    HD.ink(L.ink, [[-300, 650], [2200, 654]], 298, 3, 1);
    HD.ink(L.ink, [[-300, 900], [2200, 896]], 297, 3, 1);
    for (let i = 0; i < 14; i++) HD.ink(L.ink, [[-200 + i * 170, 100 + (i % 3) * 140], [-120 + i * 170, 104 + (i % 3) * 140]], 280 + i, 1.2, 1, 0.25);

    // peg rail, pegs, the one coat
    const rail = HD.rect(300, 318, 960, 30);
    HD.crayon(L.col, rail, C.wood, 310, { spacing: 4 });
    HD.inkShape(L.ink, rail, 311, 2.4, 0.8);
    const pegs = [460, 760, 1060];
    pegs.forEach((px, i) => EP.peg(L, px, 348, 320 + i * 4));
    EP.coat(L, 1060, 362, 1, Math.sin(t * 0.8) * 0.015, 400);

    EP.window(L, 1360, 170, 380, 470, t, 'hk-win', flash);

    // swinging lantern
    const sw = Math.sin(t * 1.1) * 0.16, pivot = [600, -80];
    const lx = pivot[0] + Math.sin(sw) * 200, ly = pivot[1] + Math.cos(sw) * 200;
    HD.ink(L.ink, [pivot, [lx, ly]], 330, 2.2, 0.4);
    const lit = prog(t, k.at('hook1') - 1.0, 1.2) * (0.92 + 0.08 * Math.sin(t * 13));
    const flame = HD.lantern(L, lx, ly, 1.0, { swing: sw * 0.4, lit, id: 340, t });

    const reveal = easeOut(prog(t, k.at('hook4') + 0.6, 1.0));
    HD.darkness(L, 0.93 - flash * 0.55, [
      { x: flame[0], y: flame[1] + 80, r: 470 * lit, core: 0.35 },
      { x: 1080, y: 620, r: 560 * reveal, a: 0.95 * reveal, core: 0.3 },
      { x: 1550, y: 420, r: 420, a: 0.35 + 0.5 * reveal },
    ], '#070a1a', cam);
    L.flash = flash * 0.3;

    // chalk annotations above the pegs (drawn over the darkness)
    const c = EP.top(L);
    pegs.forEach((px, i) => {
      const p = prog(t, k.at('hook1') + 0.5 + i * 0.35, 0.5);
      HD.text(c, String(i + 1), px, 290, { size: 64, color: CHALK, p, align: 'center', id: 350 + i });
      if (i < 3) HD.ink(c, HD.partial([[px - 28, 270], [px + 30, 252]], prog(t, k.at('hook2') + 1.0 + i * 0.25, 0.3)), 360 + i, 4, 0.8, 1, C.orange);
    });
    for (const [i, px] of [[0, 460], [1, 760]]) {
      const p = prog(t, k.at('hook3') + 0.4 + i * 0.5, 0.6);
      HD.circleMark(c, px, 420, 70, 95, p, 370 + i, 3.5);
      HD.text(c, 'coat taken', px, 560, { size: 46, color: CHALK, p: prog(t, k.at('hook3') + 0.8 + i * 0.5, 0.7), align: 'center', id: 372 + i });
    }
    HD.circleMark(c, 1060, 600, 190, 330, prog(t, k.at('hook4') + 1.1, 0.9), 375, 4.5);
    HD.text(c, 'left behind.', 1060, 1000, { size: 64, color: C.orange, p: prog(t, k.at('hook4') + 1.6, 0.8), align: 'center', id: 376, weight: 700 });
    HD.text(c, '...in his shirtsleeves?', 1550, 760, { size: 62, color: CHALK, p: prog(t, k.at('hook5') + 3.6, 1.6), align: 'center', id: 377, weight: 700 });
    L.fade = 1 - prog(t, k.start, 0.5);
  },
};

// =====================================================================
// 2. TITLE — the owl wakes in the dark, lifts its lantern, title is written.
// =====================================================================
SCENES.title = {
  enter: { type: 'cut', dur: 0 },
  draw(L, k) {
    const t = k.t, lt = k.lt;
    HD.cam(L, { s: 1, x: 960 + Math.sin(lt * 0.25) * 8, y: 540 });
    HD.washRect(L.col, 'tt-bg', -100, -100, 2200, 1300, C.night, 0.75);
    HD.washRect(L.col, 'tt-bg2', -100, 700, 2200, 600, C.deep, 0.5);
    for (let i = 0; i < 7; i++) {
      const x = 80 + i * 300, h = 160 + HD.h2(i, 4) * 200;
      HD.washPoly(L.col, 'tt-tree' + i, [[x - 120, 1100], [x - 40, 1100 - h], [x + 30, 1100 - h * 1.15], [x + 140, 1100]], '#0f1430', 0.25);
    }
    HD.stars(L, 70, 0, 0, 1920, 650, t, 3, 0.6 * prog(lt, 1.6, 2));

    const s = 1.02, oy = 838 - 232 * s;
    HD.ink(L.ink, [[-60, 852], [260, 836], [560, 848], [820, 838]], 520, 26, 2, 1, '#2a1d17');
    HD.ink(L.ink, [[560, 848], [700, 800], [760, 770]], 521, 9, 1.5, 1, '#2a1d17');
    const wingUp = easeInOut(prog(lt, 1.1, 1.1));
    const lit = prog(lt, 1.7, 0.7);
    const eyesOpen = lt > 0.35;
    const blink = (lt > 0.35 && lt < 0.5) || (lt > 6.6 && lt < 6.75) ? 1 : 0;
    const look = lt < 2.4 ? [0, 0] : lt < 6.4 ? [1, -0.3] : [0, 0.1];
    HD.owl(L, 470, oy, s, {
      blink: eyesOpen ? blink : 1, look, brow: smooth(prog(lt, 5.4, 0.4)), wingUp, lantern: 1, lit,
      swing: Math.sin(lt * 1.6) * 0.12 * wingUp, eyeGlow: (1 - lit) * (eyesOpen ? 1 : 0), id: 5000, t,
    });
    const lantern = [470 + 150 * s, oy - 30];
    HD.darkness(L, 0.96, [
      { x: lantern[0], y: lantern[1], r: 820 * easeOut(lit), core: 0.25 },
      { x: 1350, y: 520, r: 900, a: 0.45 * prog(lt, 2.4, 1.5) },
    ], '#05071a', { s: 1, x: 960, y: 540 });

    const c = EP.top(L);
    const X = 1010;
    HD.text(c, 'HOUSE OF OWLS', X, 300, { size: 44, font: 'brand', weight: 700, color: C.orange, p: prog(lt, 2.5, 0.8), id: 530 });
    HD.text(c, 'presents', X + 360, 300, { size: 44, color: CHALK, p: prog(lt, 3.0, 0.5), id: 531 });
    HD.text(c, 'The Vanishing', X - 6, 450, { size: 138, font: 'serif', weight: 400, color: '#f6ecd6', p: prog(lt, 3.1, 1.1), id: 532 });
    HD.text(c, 'at Flannan Isles', X + 4, 575, { size: 100, font: 'serif', weight: 400, italic: true, color: '#f6ecd6', p: prog(lt, 4.0, 1.0), id: 533 });
    HD.underline(c, X, X + 700, 612, prog(lt, 4.9, 0.6), 534, 5);
    HD.text(c, 'Outer Hebrides, Scotland  ·  December 1900', X + 6, 700, { size: 52, color: '#d8ccb2', p: prog(lt, 5.4, 1.0), id: 535 });
    HD.text(c, 'a true story', X + 6, 780, { size: 40, color: C.orange, p: prog(lt, 6.2, 0.6), id: 536 });
  },
};

// =====================================================================
// 3. MAP — an old chart: Lewis, the route west, the Flannan Isles, Eilean Mòr.
// =====================================================================
const LEWIS = HD.spline([
  [1330, 140], [1425, 112], [1505, 168], [1525, 262], [1478, 330], [1505, 420], [1440, 470], [1395, 560],
  [1340, 640], [1270, 720], [1210, 800], [1160, 880], [1095, 925], [1060, 880], [1100, 805], [1118, 722],
  [1165, 642], [1178, 566], [1146, 522], [1196, 468], [1226, 398], [1256, 330], [1246, 252], [1288, 192],
], true, 4).map(([x, y], i) => [x + HD.noise1(i * 0.7, 3) * 9, y + HD.noise1(i * 0.7, 4) * 9]);
const MAINLAND = [[1720, -60], [1980, -60], [1980, 1140], [1760, 1140], [1790, 980], [1735, 900], [1770, 820], [1720, 700], [1765, 610], [1712, 520], [1758, 430], [1705, 330], [1750, 240], [1700, 120]];
const ISLETS = [[440, 430, 34, 19], [398, 470, 13, 9], [478, 472, 16, 10], [372, 418, 11, 8], [506, 408, 12, 8], [352, 500, 9, 6], [522, 505, 10, 7]];
const SOUTH = [[[1000, 960], [1060, 940], [1080, 1000], [1030, 1060], [990, 1030]], [[930, 1070], [980, 1050], [995, 1100], [940, 1120]]];
SCENES.map = {
  enter: { type: 'bleed', dur: 1.4 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 0.95, x: 960, y: 540 },
      { t: k.at('map2') + 4.5, s: 1.0, x: 900, y: 520 },
      { t: k.endOf('map2') - 1.0, s: 1.9, x: 520, y: 470 },
      { t: k.at('map3') + 0.8, s: 1.9, x: 520, y: 470 },
      { t: k.at('map3') + 2.6, s: 3.6, x: 445, y: 425 },
    ], t);
    HD.cam(L, cam);
    // parchment
    HD.washRect(L.col, 'mp-paper', -400, -300, 2800, 1700, '#d9c49a', 0.35);
    for (let i = 0; i < 6; i++) HD.drawWash(L.col, HD.makeWash(600 + i), HD.h2(i, 1) * 1900, HD.h2(i, 2) * 1000, 120 + HD.h2(i, 3) * 160, i, '#b08a52', 0.06);
    // sea tint + hatching
    HD.washRect(L.col, 'mp-sea', -400, -300, 2800, 1700, '#8fb0c4', 0.2);
    for (let y = -200; y < 1300; y += 34) {
      const pts = [];
      for (let x = -300; x < 2300; x += 30) pts.push([x, y + Math.sin(x * 0.012 + y) * 4]);
      HD.ink(L.ink, pts, 600 + y, 1, 1, 0.13, '#3c5876');
    }
    // land
    const land = (key, pts, id) => {
      HD.washPoly(L.col, key, pts, '#a99e6c', 0.28);
      HD.crayon(L.col, pts, '#c2b07a', id, { alpha: 0.55, spacing: 6 });
      for (const [sc, a] of [[1.025, 0.35], [1.05, 0.18]]) {
        let cx = 0, cy = 0; for (const [x, y] of pts) { cx += x; cy += y; } cx /= pts.length; cy /= pts.length;
        HD.inkShape(L.ink, pts.map(([x, y]) => [cx + (x - cx) * sc, cy + (y - cy) * sc]), id + 2 + sc * 10, 1, 1, a, '#3c5876');
      }
      HD.inkShape(L.ink, pts, id + 1, 1.8, 1.2);
    };
    land('mp-lewis', LEWIS, 610);
    land('mp-main', MAINLAND, 620);
    SOUTH.forEach((p, i) => land('mp-s' + i, p, 630 + i * 5));
    ISLETS.forEach(([x, y, rx, ry], i) => land('mp-isl' + i, HD.ellipse(x, y, rx, ry, 14).map(([px, py], j) => [px + HD.noise1(j, i) * rx * 0.2, py + HD.noise1(j, i + 9) * ry * 0.2]), 650 + i * 4));
    // border
    HD.inkShape(L.ink, HD.rect(-330, -240, 2580, 1560), 690, 4, 1);
    // compass rose
    const cx = 230, cy = 840, cr = 90, cp = prog(t, k.start + 0.5, 1.2);
    HD.ink(L.ink, HD.partial(HD.closed(HD.ellipse(cx, cy, cr, cr, 40)), cp), 700, 1.6, 0.8);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 - Math.PI / 2, a2 = a + Math.PI / 4;
      const tip = [cx + Math.cos(a) * cr * 1.25, cy + Math.sin(a) * cr * 1.25];
      const side = [[cx + Math.cos(a2) * 18, cy + Math.sin(a2) * 18], [cx + Math.cos(a - Math.PI / 4) * 18, cy + Math.sin(a - Math.PI / 4) * 18]];
      HD.crayon(L.col, [tip, side[0], [cx, cy]], i === 0 ? C.rust : '#3c4157', 701 + i, { alpha: cp });
      HD.inkShape(L.ink, [tip, side[0], [cx, cy], side[1]], 705 + i, 1.4, 0.4, cp);
    }
    HD.text(L.ink, 'N', cx, cy - cr * 1.35, { size: 36, font: 'serif', weight: 400, p: cp, align: 'center', id: 709 });

    // labels and route
    const c = L.ink;
    HD.text(c, 'December 1900', 960, 110, { size: 110, font: 'serif', italic: true, weight: 400, p: prog(t, k.at('map1'), 1.6), align: 'center', id: 710 });
    HD.underline(c, 700, 1220, 140, prog(t, k.at('map1') + 1.4, 0.7), 711, 3, C.rust);
    HD.text(c, 'Isle of Lewis', 1330, 360, { size: 44, font: 'serif', italic: true, weight: 400, p: prog(t, k.at('map2') + 1.6, 1), align: 'center', id: 712 });
    HD.text(c, 'OUTER  HEBRIDES', 1220, 1010, { size: 30, font: 'serif', weight: 400, p: prog(t, k.at('map2') + 3.0, 1), align: 'center', id: 713 });
    HD.text(c, 'SCOTLAND', 1850, 560, { size: 34, font: 'serif', weight: 400, p: prog(t, k.at('map2') + 3.4, 1), align: 'center', id: 714, rot: -Math.PI / 2 });
    HD.text(c, 'ATLANTIC  OCEAN', 520, 760, { size: 54, font: 'serif', italic: true, weight: 400, p: prog(t, k.at('map2') + 4.6, 1.4), align: 'center', id: 715, color: '#2d4866' });
    const route = HD.quadPts([1170, 520], [820, 380], [500, 432], 40);
    const rp = prog(t, k.at('map2') + 1.0, 3.2);
    const rq = HD.partial(route, rp);
    for (let i = 0; i < rq.length - 1; i += 2) HD.ink(c, [rq[i], rq[i + 1]], 720 + i, 3, 0.6, 1, C.rust);
    HD.text(c, '~ 20 miles', 840, 395, { size: 40, color: C.rust, p: prog(t, k.at('map2') + 3.4, 0.8), align: 'center', id: 721, rot: -0.1 });
    const fp = prog(t, k.endOf('map2') - 2.2, 0.9);
    HD.circleMark(c, 440, 455, 120, 80, fp, 722, 3, C.orange);
    HD.text(c, 'The Flannan Isles', 440, 330, { size: 50, font: 'serif', weight: 400, p: prog(t, k.endOf('map2') - 1.6, 1.0), align: 'center', id: 723 });

    // Eilean Mòr + lighthouse
    const lp = prog(t, k.at('map3') + 1.2, 0.8);
    if (lp > 0) {
      HD.lighthouse(L, 448, 428, 0.12 * easeOutBack(lp), { lit: prog(t, k.at('map3') + 2.4, 0.6), house: false, id: 740, beamAng: t * 0.8, beamAlpha: 0.25 });
    }
    HD.text(c, 'Eilean Mòr', 440, 462, { size: 13, font: 'hand', weight: 700, p: prog(t, k.at('map3') + 1.8, 0.8), align: 'center', id: 741, color: C.rust });
    HD.text(c, 'lighthouse · first lit 7 Dec 1899', 440, 474, { size: 7, p: prog(t, k.at('map3') + 3.4, 1.2), id: 742, align: 'center' });
  },
};

// =====================================================================
// 4. KEEPERS — the great lamp, then three portraits with names.
// =====================================================================
function lens(L, x, y, s, t, lit) {
  const T = pts => HD.xform(pts, x, y, 0, s);
  // a beehive Fresnel lens: barrel of glass prism rings in a brass cage
  const body = HD.spline([[-96, -150], [96, -150], [126, -70], [132, 0], [126, 70], [96, 150], [-96, 150], [-126, 70], [-132, 0], [-126, -70]]);
  HD.crayon(L.col, T(body), HD.mix('#6c5a3a', '#ffd982', lit * 0.7), 800, { alpha: 0.9, spacing: 4 });
  for (let i = -6; i <= 6; i++) {
    const yy = i * 22, half = 132 * Math.sqrt(1 - (yy / 160) ** 2);
    HD.ink(L.ink, T(HD.quadPts([-half, yy], [0, yy + i * 4], [half, yy], 8)), 801 + i + 6, 1.6, 0.6, 0.75, '#5b4524');
  }
  for (let r = 18; r < 80; r += 14) HD.inkShape(L.ink, T(HD.ellipse(0, 0, r, r, 24)), 820 + r, 1.4, 0.5, 0.7, '#5b4524');
  HD.inkShape(L.ink, T(body), 830, 4, 1, 1, '#4a3518');
  for (const sx of [-1, 0, 1]) HD.ink(L.ink, T([[sx * 70, -150], [sx * 84, 0], [sx * 70, 150]]), 831 + sx, 5, 0.8, 0.9, '#9a7a3a');
  for (const cy of [-150, 150]) {
    const cap = HD.rect(-104, cy - (cy < 0 ? 26 : 0), 208, 26);
    HD.crayon(L.col, T(cap), '#9a7a3a', 834 + (cy > 0), { spacing: 4 });
    HD.inkShape(L.ink, T(cap), 836 + (cy > 0), 2.4, 0.6);
  }
  const c = T([[0, 0]])[0];
  HD.glow(L.glow, c[0], c[1], 520 * s * lit, C.lamp, 0.85 * lit);
  HD.glow(L.glow, c[0], c[1], 90 * s * lit, C.lampHot, lit);
  HD.beam(L.glow, c[0], c[1], Math.PI + Math.sin(t * 0.4) * 0.5, 1600, 0.12, 0.25 * lit);
  HD.beam(L.glow, c[0], c[1], Math.sin(t * 0.4) * 0.5, 1600, 0.12, 0.25 * lit);
}
function portrait(L, x, y, s, variant, id, p) {
  if (p <= 0) return;
  const pop = easeOutBack(p), swing = Math.sin(p * 9) * 0.08 * (1 - p);
  const T = pts => HD.xform(pts, x, y, swing, s * pop);
  const outer = HD.ellipse(0, 0, 128, 160, 40), inner = HD.ellipse(0, 0, 104, 136, 40);
  HD.crayon(L.col, T(outer), '#7a5230', id, { spacing: 4, dark: '#4f321a' });
  HD.crayon(L.col, T(inner), '#d9c39a', id + 1, { spacing: 6, hatch: 0.2 });
  HD.inkShape(L.ink, T(outer), id + 2, 3, 1);
  HD.inkShape(L.ink, T(inner), id + 3, 2.2, 1);
  // bust silhouette, like an old sepia cabinet photograph (faces unknown, so kept anonymous)
  const sepia = '#3a2a1f', coat = '#231c22';
  HD.crayon(L.col, T(HD.ellipse(0, 0, 100, 130, 30)), '#b89870', id + 11, { alpha: 0.35, hatch: 0.1 });
  const torso = HD.spline([[-100, 140], [-96, 92], [-70, 66], [-26, 54], [26, 54], [70, 66], [96, 92], [100, 140]], false);
  HD.crayon(L.col, T([...torso, [0, 150]]), coat, id + 4, { spacing: 3 });
  HD.crayon(L.col, T(HD.rect(-15, 22, 30, 36)), sepia, id + 6, { spacing: 3 });
  HD.crayon(L.col, T([[-22, 54], [0, 86], [22, 54], [10, 50], [0, 64], [-10, 50]]), '#e2d3b3', id + 12, { spacing: 3, hatch: 0.1 });
  HD.ink(L.ink, T([[-28, 56], [-8, 120]]), id + 13, 1.6, 0.4, 0.6, '#8a7a6a');
  HD.ink(L.ink, T([[28, 56], [8, 120]]), id + 14, 1.6, 0.4, 0.6, '#8a7a6a');
  for (const by of [96, 124]) HD.dot(L.ink, ...T([[0, by]])[0], 3.5 * s, '#c9a24a');
  for (const ex of [-37, 37]) HD.crayon(L.col, T(HD.ellipse(ex, -8, 8, 13, 10)), sepia, id + 15 + ex, { spacing: 3 });
  HD.crayon(L.col, T(HD.ellipse(0, -10, 36, 46, 20)), sepia, id + 5, { spacing: 3 });
  // keeper's uniform cap: crown, band, badge, peak
  HD.crayon(L.col, T([[-46, -78], [46, -78], [38, -54], [-38, -54]]), coat, id + 7, { spacing: 3 });
  HD.crayon(L.col, T(HD.rect(-38, -56, 76, 10)), '#121016', id + 16, { spacing: 3 });
  HD.crayon(L.col, T(HD.ellipse(0, -46, 42, 9, 14, 0, 0, Math.PI)), '#121016', id + 8, { spacing: 3 });
  HD.dot(L.ink, ...T([[0, -66]])[0], 4.5 * s, '#c9a24a');
  if (variant === 0) HD.crayon(L.col, T(HD.spline([[-34, 2], [34, 2], [28, 40], [0, 58], [-28, 40]])), '#1e150f', id + 9, { spacing: 3 });
  if (variant === 1) HD.crayon(L.col, T(HD.ellipse(0, 12, 17, 5, 12)), '#1e150f', id + 9, { spacing: 3 });
  if (variant === 2) HD.crayon(L.col, T(HD.spline([[-34, 6], [34, 6], [22, 30], [0, 38], [-22, 30]])), '#1e150f', id + 9, { spacing: 3 });
  // string + nail
  HD.ink(L.ink, [T([[-60, -128]])[0], [x, y - 230 * s], T([[60, -128]])[0]], id + 10, 1.6, 0.6, 0.8);
  HD.dot(L.ink, x, y - 230 * s, 5, '#2a2a30');
}
SCENES.keepers = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    const F = [430, 960, 1490];
    const cam = EP.camAt([
      { t: k.start, s: 1.0, x: 960, y: 420 },
      { t: k.at('keep1') + 3.5, s: 1.0, x: 960, y: 500 },
      { t: k.at('keep2'), s: 1.3, x: F[0], y: 600 },
      { t: k.at('keep3'), s: 1.3, x: F[1], y: 600 },
      { t: k.at('keep4'), s: 1.3, x: F[2], y: 600 },
      { t: k.at('keep4') + 3.8, s: 1.0, x: 960, y: 560 },
    ], t);
    HD.cam(L, cam);
    HD.washRect(L.col, 'kp-wall', -300, -300, 2600, 1500, '#7b6650', 0.5);
    HD.washRect(L.col, 'kp-wall2', -300, -300, 2600, 1500, '#3f3550', 0.25);
    for (let i = 0; i < 22; i++) HD.ink(L.ink, [[-200 + i * 110, -200], [-196 + i * 110, 1300]], 840 + i, 1, 1.5, 0.15);
    const lit = 0.9 + 0.1 * Math.sin(t * 7) * Math.sin(t * 3.1);
    lens(L, 960, 150, 0.9, t, lit * prog(t, k.start, 1.5));
    const names = [['James Ducat', 'Principal Keeper'], ['Thomas Marshall', 'Assistant Keeper'], ['Donald McArthur', '"the Occasional"']];
    const ps = ['keep2', 'keep3', 'keep4'].map(id => prog(t, k.at(id) - 0.7, 0.8));
    F.forEach((fx, i) => portrait(L, fx, 600, 1, i, 850 + i * 20, ps[i]));
    HD.darkness(L, 0.82, [
      { x: 960, y: 150, r: 900, core: 0.2 },
      ...F.map((fx, i) => ({ x: fx, y: 600, r: 420 * ps[i], a: 0.9 })),
    ], '#0b0812', cam);
    const c = EP.top(L);
    F.forEach((fx, i) => {
      const id = ['keep2', 'keep3', 'keep4'][i];
      HD.text(c, names[i][0], fx, 840, { size: 48, color: '#f3e6c8', p: prog(t, k.at(id) + 0.1, 1.0), align: 'center', id: 900 + i, weight: 700 });
      HD.text(c, names[i][1], fx, 890, { size: 38, color: '#e7b25e', p: prog(t, k.at(id) + 0.9, 0.8), align: 'center', id: 910 + i });
    });
    HD.text(c, 'filling in for William Ross, off sick', F[2], 935, { size: 30, color: '#cdbf9f', p: prog(t, k.at('keep4') + 2.6, 1.2), align: 'center', id: 920 });
    HD.text(c, 'three keepers. one light.', 960, 470, { size: 50, color: '#f3e6c8', p: prog(t, k.at('keep1') + 1.4, 1.2), align: 'center', id: 921, alpha: 1 - prog(t, k.at('keep2') - 1, 0.6) });
  },
};

// =====================================================================
// 5. DARK — 15 Dec: the Archtor passes in a storm; the light is out.
// =====================================================================
const ISLAND_A = [[1080, 700], [1150, 600], [1240, 560], [1300, 470], [1420, 452], [1560, 470], [1650, 520], [1760, 600], [1830, 700]];
SCENES.dark = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 1.0, x: 960, y: 540 },
      { t: k.at('dark2'), s: 1.05, x: 1000, y: 540 },
      { t: k.at('dark3'), s: 1.05, x: 1050, y: 520 },
      { t: k.at('dark3') + 2.5, s: 1.9, x: 1460, y: 430 },
    ], t);
    HD.cam(L, cam);
    const flash = EP.flashAt(t, [k.start + 1.5, k.at('dark1') + 4.2, k.at('dark2') + 0.6]);
    HD.washRect(L.col, 'dk-sky', -400, -300, 2700, 1700, '#26325a', 0.75);
    for (let i = 0; i < 5; i++) HD.drawWash(L.col, HD.makeWash(640 + i), 200 + i * 400 + Math.sin(t * 0.1 + i) * 40, 120 + HD.h2(i, 3) * 160, 260, i, '#0d1228', 0.25);
    EP.rock(L, 'dk-isl', ISLAND_A, { color: '#0f1222', alpha: 0.95, id: 960 });
    const ember = HD.window(t, k.at('dark2') + 0.4, k.at('dark2') + 1.6, 0.3, 0.6) * 0.18;
    HD.lighthouse(L, 1430, 456, 0.62, { lit: ember, id: 970 });
    HD.sea(L, { horizon: 690, t, storm: 0.9, color: '#1c2c50', alpha: 0.85, id: 980, inkColor: '#8ea6d6', inkAlpha: 0.7 });
    const sx = lerp(80, 760, k.u());
    HD.steamer(L, sx, 800, 1.05, { t, id: 990, lights: 0.9, roll: 0.06, color: '#141828' });
    HD.rain(L, t, { density: 260, alpha: 0.32 });
    if (flash > 0.3) EP.bolt(L, 700, -100, 560, 999, flash);
    HD.darkness(L, 0.42 - flash * 0.3 + prog(t, k.at('dark3'), 2) * 0.18, [
      { x: sx, y: 790, r: 260, a: 0.6 },
    ], '#03050f', cam);
    L.flash = flash * 0.35;
    const c = EP.top(L);
    const sightP = prog(t, k.at('dark2') + 0.1, 1.2) * (1 - prog(t, k.at('dark3') + 1.5, 0.8));
    if (sightP > 0) {
      const sight = HD.partial([[sx + 40, 720], [1430, 300]], sightP);
      for (let i = 0; i < 18; i++) {
        const a = HD.partial(sight, i / 18), b = HD.partial(sight, (i + 0.5) / 18);
        if (b.length >= 2 && a.length < b.length + 2) HD.ink(c, [a[a.length - 1], b[b.length - 1]], 1000 + i, 3, 0.3, 0.9, '#e9dfc6');
      }
    }
    HD.text(c, '?', 1475, 330, { size: 110, color: C.orange, p: prog(t, k.at('dark2') + 1.2, 0.4), id: 1020, weight: 700 });
    HD.text(c, '15 December 1900', 150, 140, { size: 64, color: '#e9dfc6', p: prog(t, k.at('dark1') + 0.4, 1.2), id: 1021, weight: 700 });
    HD.text(c, 'the steamer Archtor', 180, 200, { size: 44, color: '#c8bfa6', p: prog(t, k.at('dark1') + 3.6, 1.0), id: 1022 });
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);   // screen space: the camera push-in must not crop it
    HD.text(c, 'the light is out.', 960, 120, { size: 72, color: '#e9dfc6', p: prog(t, k.at('dark3') + 0.8, 1.0), align: 'center', id: 1023, weight: 700 });
    c.restore();
  },
};

// =====================================================================
// 6. WAIT — a tear-off calendar flips 15 -> 26 while the storm keeps the Hesperus in port.
// =====================================================================
function calendarDay(k, t) {
  const keys = [[k.at('wait1') + 0.5, 15], [k.at('wait1') + 4.0, 18], [k.at('wait2') + 0.6, 18], [k.at('wait2') + 2.6, 20], [k.at('wait3') - 0.2, 23], [k.at('wait3') + 3.0, 26]];
  if (t <= keys[0][0]) return 15;
  for (let i = 1; i < keys.length; i++) {
    if (t < keys[i][0]) return Math.floor(lerp(keys[i - 1][1], keys[i][1], (t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  }
  return 26;
}
function flipTime(k, day) {   // first moment the calendar shows `day`
  let lo = k.start, hi = k.end;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (calendarDay(k, m) >= day) hi = m; else lo = m; }
  return hi;
}
function calPage(c, L, x, y, day, rot, alpha, id) {
  const T = pts => HD.xform(pts, x, y, rot, 1);
  const page = HD.rect(-200, -120, 400, 440);
  HD.crayon(L.col, T(page), '#f7f0e0', id, { alpha, hatch: 0.08 });
  HD.inkShape(c, T(page), id + 1, 2.4, 1, alpha);
  c.save(); c.translate(x, y); c.rotate(rot);
  HD.text(c, String(day), 0, 210, { size: 250, font: 'serif', weight: 400, align: 'center', id: id + 2, alpha, color: day === 26 ? C.rust : HD.INK });
  HD.text(c, ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][(day + 6) % 7], 0, 280, { size: 44, align: 'center', id: id + 3, alpha });
  c.restore();
}
SCENES.wait = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    HD.cam(L, EP.camAt([
      { t: k.start, s: 1.05, x: 1000, y: 520 },
      { t: k.at('wait2'), s: 1.0, x: 900, y: 540 },
      { t: k.at('wait3'), s: 1.0, x: 980, y: 540 },
      { t: k.at('wait3') + 4, s: 1.12, x: 1180, y: 500 },
    ], t));
    const flash = EP.flashAt(t, [k.at('wait1') + 5.2, k.at('wait2') + 3.0]);
    HD.washRect(L.col, 'wt-sky', -400, -300, 2700, 1000, '#4a5470', 0.6);
    for (let i = 0; i < 6; i++) HD.drawWash(L.col, HD.makeWash(660 + i), ((i * 380 - t * 60) % 2600 + 2600) % 2600 - 400, 140 + HD.h2(i, 7) * 200, 240, i, '#262d45', 0.25);
    HD.washRect(L.col, 'wt-sky2', -400, 600, 2700, 900, '#4a5470', 0.6);
    HD.sea(L, { horizon: 640, t: t * 1.4, storm: 1, color: '#2a3c62', alpha: 0.75, id: 1050, inkColor: '#22284a', inkAlpha: 0.9 });
    // harbour wall + the Hesperus straining at her ropes
    const wall = [[-300, 760], [560, 740], [600, 1200], [-300, 1200]];
    HD.occlude(L.ink, wall);
    HD.crayon(L.col, wall, '#6c6a72', 1060, { spacing: 5 });
    HD.inkShape(L.ink, wall, 1061, 3, 1);
    for (let r = 0; r < 6; r++) for (let q = 0; q < 8; q++) HD.ink(L.ink, [[-280 + q * 110 + (r % 2) * 55, 790 + r * 60], [-200 + q * 110 + (r % 2) * 55, 790 + r * 60]], 1070 + r * 10 + q, 1.2, 0.8, 0.5);
    const bob = Math.sin(t * 2.2) * 10;
    HD.steamer(L, 320, 712 + bob, 0.95, { t: t * 1.5, id: 1100, roll: 0.09, color: '#2a2f45', smoke: 0.6 });
    HD.ink(L.ink, [[500, 716 + bob], [545, 745]], 1110, 2, 1);
    HD.ink(L.ink, [[150, 718 + bob], [100, 755]], 1111, 2, 1);
    HD.rain(L, t, { density: 300, alpha: 0.35, angle: 0.4, color: '#dfe5f5' });
    if (flash > 0.3) EP.bolt(L, 1600, -100, 520, 1120, flash);
    L.flash = flash * 0.3;
    const c = L.ink;
    HD.text(c, 'Hesperus', 330, 520, { size: 54, p: prog(t, k.at('wait2') + 0.6, 1), align: 'center', id: 1130, weight: 700, color: '#f1e7cf' });
    HD.text(c, "can't sail", 330, 572, { size: 44, p: prog(t, k.at('wait2') + 1.6, 0.8), align: 'center', id: 1131, color: C.orange, weight: 700 });

    // calendar block pinned to a board
    const CX = 1290, CY = 330;
    const board = HD.rect(CX - 240, CY - 220, 480, 620);
    HD.occlude(c, board);
    HD.crayon(L.col, board, '#7a5230', 1140, { spacing: 4 });
    HD.inkShape(c, board, 1141, 3, 1);
    const head = HD.rect(CX - 200, CY - 190, 400, 80);
    HD.crayon(L.col, head, '#b5452b', 1142, { spacing: 4 });
    HD.inkShape(c, head, 1143, 2.4, 1);
    HD.text(c, 'DECEMBER  1900', CX, CY - 136, { size: 46, font: 'serif', weight: 400, align: 'center', id: 1144, color: '#f7efe0' });
    const day = calendarDay(k, t);
    calPage(c, L, CX, CY + 10, day, 0, 1, 1150);
    // pages torn off by the wind
    for (let d = 15; d < day; d++) {
      const ft = flipTime(k, d + 1), age = t - ft;
      if (age < 0 || age > 1.6) continue;
      const fx = CX - age * 900 - age * age * 300, fy = CY + 10 - age * 260 + Math.sin(age * 5 + d) * 40;
      calPage(c, L, fx, fy, d, -age * 2.4 - d * 0.3, 1 - age / 1.6, 1160 + d * 5);
    }
    HD.circleMark(c, CX, CY + 125, 150, 130, prog(t, k.at('wait3') + 3.3, 0.8), 1290, 5, C.orange);
    HD.text(c, '11 days.', CX + 10, CY + 470, { size: 84, color: C.orange, p: prog(t, k.at('wait3') + 4.1, 0.9), align: 'center', id: 1291, weight: 700 });
    HD.text(c, 'Archtor reports the dark light', CX - 330, CY + 520, { size: 36, p: HD.window(t, k.at('wait1') + 2.6, k.at('wait2') + 1, 1, 0.5), align: 'center', id: 1292, color: '#e9e2d4' });
  },
};

// =====================================================================
// 7. ARRIVAL — 26 Dec, noon: no flag, no boxes, no one. Horn, flare, silence.
// =====================================================================
const CLIFF = [[760, 1200], [820, 780], [900, 740], [960, 610], [1010, 470], [1100, 420], [1300, 400], [1600, 390], [2100, 380], [2200, 1200]];
SCENES.arrival = {
  enter: { type: 'bleed', dur: 1.3 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 1.0, x: 960, y: 540 },
      { t: k.at('arr1') + 0.4, s: 1.25, x: 1350, y: 380 },
      { t: k.at('arr1') + 3.0, s: 1.2, x: 1060, y: 640 },
      { t: k.at('arr2'), s: 1.0, x: 960, y: 540 },
      { t: k.at('arr3'), s: 1.0, x: 960, y: 520 },
      { t: k.at('arr3') + 3.0, s: 1.35, x: 1330, y: 360 },
    ], t);
    HD.cam(L, cam);
    HD.washRect(L.col, 'ar-sky', -400, -300, 2700, 1000, '#9aa3b4', 0.5);
    for (let i = 0; i < 5; i++) HD.drawWash(L.col, HD.makeWash(680 + i), 150 + i * 420 - t * 8, 140 + HD.h2(i, 5) * 120, 220, i, '#6d7790', 0.18);
    HD.sea(L, { horizon: 620, t, storm: 0.45, color: '#4a6688', alpha: 0.6, id: 1300, inkAlpha: 0.7 });
    EP.rock(L, 'ar-cliff', CLIFF, { color: '#4b4a52', alpha: 0.85, id: 1310, strata: 10 });
    HD.washPoly(L.col, 'ar-grass', [[1010, 470], [1100, 420], [1300, 400], [1600, 390], [2100, 380], [2100, 430], [1300, 450], [1100, 470]], C.grass, 0.35);
    // landing + steps up the cliff
    HD.crayon(L.col, [[820, 780], [960, 772], [960, 800], [820, 806]], '#8a8778', 1320, { spacing: 4 });
    HD.inkShape(L.ink, [[820, 780], [960, 772], [960, 800], [820, 806]], 1321, 2, 0.6);
    const steps = [[930, 772], [980, 690], [940, 640], [1010, 560], [980, 520], [1080, 450], [1180, 410]];
    HD.ink(L.ink, steps, 1322, 3, 1, 0.9, '#2a2a33');
    for (let i = 0; i < steps.length - 1; i++) for (let s = 0; s < 4; s++) {
      const a = HD.lerp(steps[i][0], steps[i + 1][0], s / 4), b = HD.lerp(steps[i][1], steps[i + 1][1], s / 4);
      HD.ink(L.ink, [[a - 8, b], [a + 8, b]], 1330 + i * 5 + s, 1.4, 0.4, 0.6);
    }
    HD.lighthouse(L, 1340, 404, 0.9, { lit: 0, id: 1350 });
    HD.ink(L.ink, [[1520, 396], [1522, 180]], 1360, 3, 0.6);       // flagstaff, empty
    HD.ink(L.ink, [[1500, 200], [1544, 200]], 1361, 2, 0.4);
    // the Hesperus offshore
    const hx = 380;
    HD.steamer(L, hx, 800, 1.1, { t, id: 1370, roll: 0.03, color: '#30364d' });
    // horn: rings from the funnel
    const hornT = t - (k.at('arr2') + 1.2);
    if (hornT > 0 && hornT < 2.6) {
      for (let r = 0; r < 3; r++) {
        const age = hornT - r * 0.35;
        if (age <= 0) continue;
        const rad = 40 + age * 260;
        HD.ink(L.ink, HD.ellipse(hx + 5, 690, rad, rad * 0.75, 20, 0, -Math.PI * 0.4, Math.PI * 0.15), 1380 + r, 3, 0.6, Math.max(0, 1 - age / 2), '#1b2140');
      }
    }
    // flare
    const fT = t - (k.at('arr2') + 2.9);
    let flare = 0;
    if (fT > 0) {
      const up = easeOut(clamp(fT / 1.3));
      const fx = hx + 80 + up * 260 + Math.max(0, fT - 1.3) * 20, fy = 680 - up * 560 + Math.max(0, fT - 1.3) * 45;
      flare = clamp(1 - Math.max(0, fT - 3.5) / 3);
      const trail = [];
      for (let i = 0; i <= 20; i++) { const u = easeOut(clamp((fT - i * 0.05) / 1.3)); trail.push([hx + 80 + u * 260, 680 - u * 560]); }
      HD.ink(L.ink, trail, 1390, 3, 1.5, 0.5 * flare, '#c9c2b8');
      HD.glow(L.glow, fx, fy, 380, '#ff6a3a', 0.7 * flare);
      HD.glow(L.glow, fx, fy, 40, '#fff0d8', flare);
      for (let i = 0; i < 10; i++) {
        const a = HD.h2(i, 7) * 6.28, d = (fT - 1.2) * 70 * (0.5 + HD.h2(i, 8));
        if (fT > 1.2) HD.dot(L.ink, fx + Math.cos(a) * d, fy + Math.sin(a) * d + (fT - 1.2) * 30, 2.5, '#ffb070', flare * 0.9);
      }
    }
    L.flash = 0;
    HD.darkness(L, 0.18 + 0.08 * flare, [], '#1a1530');
    const c = EP.top(L);
    const notes = [
      ['no flag', 1590, 230, 'arr1', 0.6, [1522, 220, 70, 90]],
      ['no supply boxes', 890, 870, 'arr1', 2.6, [890, 790, 110, 50]],
      ['no one.', 1150, 560, 'arr1', 5.2, null],
    ];
    notes.forEach(([txt, x, y, id, off, circ], i) => {
      if (circ) HD.circleMark(c, circ[0], circ[1], circ[2], circ[3], prog(t, k.at(id) + off, 0.7), 1400 + i, 4, C.orange);
      HD.text(c, txt, x, y, { size: 54, color: C.orange, p: prog(t, k.at(id) + off + 0.4, 0.8), id: 1410 + i, weight: 700 });
    });
    HD.text(c, '26 December 1900 · noon', 90, 130, { size: 60, p: prog(t, k.start + 0.6, 1.2), id: 1420, weight: 700 });
  },
};
})();
