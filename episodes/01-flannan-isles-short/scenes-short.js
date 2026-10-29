// Episode 01 — YouTube Shorts edition (vertical 1080x1920).
// Reuses EP helpers from ../01-flannan-isles/scenes-1.js (coat, peg, rock, window, camAt, flashAt, bolt, top)
// but every scene is composed for a phone screen. Safe zones: keep key art and text inside
// x 60..940 and y 160..1460 (top bar, the right-hand buttons and the bottom title overlay cover the rest).
// Captions are burned in by index.html at y ~1345, so scenes keep that band calm and dark-ish.
(function () {
'use strict';
const SCENES = window.SCENES = {};          // drop the landscape scenes; keep EP helpers
const { C, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, easeOutBack } = HD;
const CHALK = EP.chalk;
const MID = { s: 1, x: 540, y: 960 };

// screen-space text (immune to camera moves), drawn above the night
function topText(L) { const c = L.dark; c.setTransform(1, 0, 0, 1, 0, 0); return c; }

// the peg wall used by the hook and the coats scenes
const PEGS = [230, 520, 810];
function pegWall(L, t, sway = 0) {
  HD.washRect(L.col, 'v-wall', -400, -400, 1900, 2800, '#9a97a3', 0.55);
  HD.washRect(L.col, 'v-wains', -400, 1060, 1900, 300, '#6d5a4a', 0.6);
  HD.washRect(L.col, 'v-floor', -400, 1340, 1900, 1000, '#45362c', 0.75);
  for (let x = -360; x < 1500; x += 90) HD.ink(L.ink, [[x, 1066], [x + 3, 1338]], 300 + x, 1.5, 1, 0.45);
  HD.ink(L.ink, [[-400, 1060], [1500, 1064]], 298, 3, 1);
  HD.ink(L.ink, [[-400, 1340], [1500, 1336]], 297, 3, 1);
  for (let i = 0; i < 12; i++) HD.ink(L.ink, [[-100 + (i % 4) * 330, 700 + Math.floor(i / 4) * 120], [-20 + (i % 4) * 330, 704 + Math.floor(i / 4) * 120]], 280 + i, 1.2, 1, 0.22);
  const rail = HD.rect(80, 500, 920, 30);
  HD.crayon(L.col, rail, C.wood, 310, { spacing: 4 });
  HD.inkShape(L.ink, rail, 311, 2.4, 0.8);
  PEGS.forEach((px, i) => EP.peg(L, px, 530, 320 + i * 4));
  EP.coat(L, 810, 544, 0.82, Math.sin(t * 0.8) * 0.015 + sway, 400);
}

// =====================================================================
// HOOK — "Three men vanished. Two took their coats. One didn't."
// =====================================================================
SCENES.hook = {
  enter: { type: 'cut', dur: 0 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 1.12, x: 540, y: 820 },
      { t: k.at('h2') + 0.8, s: 1.05, x: 520, y: 820 },
      { t: k.at('h3') + 0.4, s: 1.05, x: 560, y: 820 },
      { t: k.at('h3') + 1.6, s: 1.3, x: 760, y: 760 },
    ], t);
    HD.cam(L, cam);
    const flash = EP.flashAt(t, [k.start + 0.15, k.at('h3') + 0.6]);
    pegWall(L, t);
    EP.window(L, 600, 70, 300, 340, t, 'v-hk-win', flash);
    const sw = Math.sin(t * 1.1) * 0.16, pivot = [300, -120];
    const lx = pivot[0] + Math.sin(sw) * 250, ly = pivot[1] + Math.cos(sw) * 250;
    HD.ink(L.ink, [pivot, [lx, ly]], 330, 2.2, 0.4);
    const lit = prog(t, k.start, 0.6) * (0.92 + 0.08 * Math.sin(t * 13));
    const flame = HD.lantern(L, lx, ly, 1.05, { swing: sw * 0.4, lit, id: 340, t });
    const reveal = easeOut(prog(t, k.at('h3') + 0.5, 0.9));
    HD.darkness(L, 0.92 - flash * 0.5, [
      { x: flame[0], y: flame[1] + 80, r: 520 * lit, core: 0.35 },
      { x: 810, y: 760, r: 520 * reveal, a: 0.95 * reveal, core: 0.3 },
    ], '#070a1a', cam);
    L.flash = flash * 0.3;
    const c = EP.top(L);
    PEGS.forEach((px, i) => HD.text(c, String(i + 1), px, 470, { size: 60, color: CHALK, p: prog(t, k.at('h1') + 0.3 + i * 0.3, 0.4), align: 'center', id: 350 + i }));
    for (const [i, px] of [[0, 230], [1, 520]]) {
      HD.circleMark(c, px, 610, 75, 95, prog(t, k.at('h2') + 0.2 + i * 0.4, 0.5), 370 + i, 4);
      HD.text(c, 'taken', px, 760, { size: 56, color: CHALK, p: prog(t, k.at('h2') + 0.5 + i * 0.4, 0.5), align: 'center', id: 372 + i, weight: 700 });
    }
    HD.circleMark(c, 810, 760, 170, 290, prog(t, k.at('h3') + 0.8, 0.7), 375, 5);
    HD.text(c, 'left behind.', 690, 1150, { size: 76, color: C.orange, p: prog(t, k.at('h3') + 1.2, 0.6), align: 'center', id: 376, weight: 700 });
    // the big screen-space hook line for people scrolling with the sound off
    const s = topText(L);
    HD.text(s, 'THREE MEN', 540, 250, { size: 118, font: 'brand', weight: 700, color: '#fff3e3', p: prog(t, k.at('h1') - 0.1, 0.5), align: 'center', id: 380, shadow: false });
    HD.text(s, 'VANISHED.', 540, 370, { size: 118, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('h1') + 0.5, 0.5), align: 'center', id: 381, shadow: false });
  },
};

// =====================================================================
// ISLAND — the rock, the lighthouse, the ship that saw it go dark, 11 days.
// =====================================================================
const ROCK_I = [[60, 1300], [170, 1150], [300, 1080], [410, 975], [660, 965], [770, 1020], [900, 1140], [1020, 1300]];
SCENES.island = {
  enter: { type: 'bleed', dur: 0.9 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 1.0, x: 540, y: 960 },
      { t: k.at('i2'), s: 1.08, x: 560, y: 900 },
      { t: k.at('i3'), s: 1.22, x: 560, y: 860 },
      { t: k.end, s: 1.3, x: 560, y: 850 },
    ], t);
    HD.cam(L, cam);
    const flash = EP.flashAt(t, [k.start + 1.2, k.at('i2') + 2.4, k.at('i3') + 2.2]);
    HD.washRect(L.col, 'v-is-sky', -500, -500, 2100, 2900, '#26325a', 0.75);
    for (let i = 0; i < 5; i++) HD.drawWash(L.col, HD.makeWash(640 + i), -100 + i * 320 + Math.sin(t * 0.15 + i) * 50, 220 + HD.h2(i, 3) * 380, 300, i, '#0d1228', 0.25);
    HD.sea(L, { horizon: 1180, bottom: 2100, t, storm: 0.95, color: '#1c2c50', alpha: 0.85, id: 980, inkColor: '#8ea6d6', inkAlpha: 0.7, x0: -500, x1: 1600 });
    // the passing ship goes behind the island
    const sx = lerp(-200, 1300, prog(t, k.at('i1') + 1, k.endOf('i2') - k.at('i1') + 2));
    const behind = sx > 130 && sx < 950;
    HD.steamer(L, sx, 1200, 0.5, { t, id: 990, lights: behind ? 0 : 0.9, roll: 0.05, color: '#141828' });
    EP.rock(L, 'v-is-rock', ROCK_I, { color: '#0f1222', alpha: 0.95, id: 960 });
    const dark = prog(t, k.at('i2') + 1.4, 1.0);
    const lit = (1 - dark) * (dark > 0 ? (0.6 + 0.4 * Math.sin(t * 40)) : 1);
    HD.lighthouse(L, 560, 972, 0.95, { lit, beamAng: t * 0.7, beamAlpha: 0.5, id: 970 });
    HD.rain(L, t, { density: 240, alpha: 0.3 });
    if (flash > 0.3) EP.bolt(L, 200, -100, 700, 999, flash);
    HD.darkness(L, 0.4 - flash * 0.3 + dark * 0.15, [{ x: 560, y: 750, r: 380, a: 1 - dark }], '#03050f', cam);
    L.flash = flash * 0.35;
    const c = EP.top(L);
    HD.text(c, '?', 640, 760, { size: 130, color: C.orange, p: prog(t, k.at('i2') + 2.4, 0.4), id: 1020, weight: 700 });
    const s = topText(L);
    const a1 = 1 - prog(t, k.at('i2') + 1.6, 0.4);
    HD.text(s, 'Flannan Isles', 540, 290, { size: 120, font: 'serif', weight: 400, color: '#f6ecd6', p: prog(t, k.at('i1') + 0.2, 1.0), align: 'center', id: 1030, alpha: a1 });
    HD.text(s, 'Scotland · December 1900', 540, 370, { size: 56, color: '#d8ccb2', p: prog(t, k.at('i1') + 1.0, 1.0), align: 'center', id: 1031, alpha: a1 });
    const a2 = HD.window(t, k.at('i2') + 2.0, k.at('i3') + 0.2, 0.3, 0.3);
    HD.text(s, 'the light went out.', 540, 330, { size: 84, color: '#f1e7cf', p: prog(t, k.at('i2') + 2.0, 0.8), align: 'center', id: 1032, weight: 700, alpha: a2 });
    const days = 1 + Math.floor(10 * easeInOut(prog(t, k.at('i3') + 0.4, k.endOf('i3') - k.at('i3'))));
    const a3 = prog(t, k.at('i3') + 0.2, 0.3);
    HD.text(s, `DAY ${days}`, 540, 320, { size: 140, font: 'brand', weight: 700, color: days === 11 ? C.orange : '#fff3e3', align: 'center', id: 1033, alpha: a3, shadow: false });
    HD.text(s, 'before help arrived', 540, 395, { size: 54, color: '#d8ccb2', p: prog(t, k.at('i3') + 0.6, 0.8), align: 'center', id: 1034 });
  },
};

// =====================================================================
// INSIDE — three stacked panels: gate shut, beds empty, clock stopped.
// =====================================================================
function panel(L, x, y, w, h, p, id, drawInside) {
  if (p <= 0) return;
  const box = HD.rect(x, y, w, h);
  for (const c of [L.col, L.ink, L.glow]) { c.save(); HD.trace(c, box, true); c.clip(); }
  HD.washRect(L.col, 'vpn' + id, x - 10, y - 10, w + 20, h + 20, '#efe6d2', 0.6 * smooth(p));
  drawInside(smooth(p));
  for (const c of [L.col, L.ink, L.glow]) c.restore();
  HD.ink(L.ink, HD.partial(HD.closed(box), easeOut(p)), id, 6, 1.2);
}
SCENES.inside = {
  enter: { type: 'bleed', dur: 0.9 },
  draw(L, k) {
    const t = k.t;
    const P = [[60, 170, 960, 330], [60, 530, 960, 330], [60, 890, 960, 380]];
    const appear = [k.at('n1') - 0.3, k.at('n1') + 1.1, k.at('n2') - 0.2];
    const stopT = k.at('n2') + 1.6;
    const cam = EP.camAt([
      { t: k.start, ...MID },
      { t: k.at('n2'), s: 1.0, x: 540, y: 900 },
      { t: k.at('n2') + 1.0, s: 1.2, x: 540, y: 1010 },
    ], t);
    HD.cam(L, cam);
    HD.washRect(L.col, 'v-in-page', -400, -400, 1900, 2800, '#2a2f48', 0.55);
    const ps = appear.map(a => prog(t, a, 0.5));
    panel(L, ...P[0], ps[0], 1600, () => {
      HD.washRect(L.col, 'v-in-p1', 60, 170, 960, 330, '#a3abbd', 0.4);
      for (const px of [250, 790]) { HD.crayon(L.col, HD.rect(px, 230, 40, 270), '#8a8778', 1610 + px, { spacing: 4 }); HD.inkShape(L.ink, HD.rect(px, 230, 40, 270), 1612 + px, 2.2, 0.8); }
      for (let i = 0; i < 18; i++) {
        const bx = 315 + i * 26;
        HD.ink(L.ink, [[bx, 270], [bx, 500]], 1620 + i, 3, 0.5);
        HD.ink(L.ink, [[bx - 6, 276], [bx, 256], [bx + 6, 276]], 1640 + i, 2, 0.4);
      }
      HD.ink(L.ink, [[290, 320], [790, 320]], 1660, 3, 0.6);
      HD.ink(L.ink, [[290, 450], [790, 450]], 1661, 3, 0.6);
    });
    panel(L, ...P[1], ps[1], 1900, () => {
      HD.washRect(L.col, 'v-in-p2', 60, 530, 960, 330, '#c9c2b2', 0.5);
      for (const [bx, id] of [[110, 0], [570, 1]]) {
        const by = 700;
        const frame = HD.rect(bx, by, 400, 80);
        HD.crayon(L.col, frame, '#7a5230', 1910 + id * 10, { spacing: 4 });
        HD.crayon(L.col, HD.spline([[bx + 20, by + 6], [bx + 140, by - 18], [bx + 250, by + 2], [bx + 380, by - 10], [bx + 380, by + 30], [bx + 20, by + 30]]), '#8c96b0', 1911 + id * 10, { spacing: 4 });
        HD.inkShape(L.ink, frame, 1912 + id * 10, 2.4, 0.8);
        HD.ink(L.ink, HD.spline([[bx + 20, by + 6], [bx + 140, by - 18], [bx + 250, by + 2], [bx + 380, by - 10]], false), 1913 + id * 10, 2, 1);
        HD.crayon(L.col, HD.ellipse(bx + 60, by - 4, 40, 18, 14), '#efe9dc', 1914 + id * 10, { hatch: 0.1 });
        HD.inkShape(L.ink, HD.ellipse(bx + 60, by - 4, 40, 18, 14), 1915 + id * 10, 1.8, 0.6);
        HD.ink(L.ink, [[bx + 10, by + 80], [bx + 10, by + 130]], 1916 + id * 10, 4, 0.4);
        HD.ink(L.ink, [[bx + 390, by + 80], [bx + 390, by + 130]], 1917 + id * 10, 4, 0.4);
      }
    });
    panel(L, ...P[2], ps[2], 2000, () => {
      HD.washRect(L.col, 'v-in-p3', 60, 890, 960, 380, '#d3cab6', 0.5);
      const cx = 540, cy = 1010;
      const caseP = [[478, 1080], [602, 1080], [626, 1280], [454, 1280]];
      HD.crayon(L.col, caseP, '#6b4428', 2010, { spacing: 4 });
      HD.inkShape(L.ink, caseP, 2011, 3, 1);
      HD.crayon(L.col, HD.ellipse(cx, cy, 88, 88, 36), '#f4eedf', 2012, { hatch: 0.08 });
      HD.inkShape(L.ink, HD.ellipse(cx, cy, 88, 88, 36), 2013, 3.5, 0.8);
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; HD.ink(L.ink, [[cx + Math.cos(a) * 70, cy + Math.sin(a) * 70], [cx + Math.cos(a) * 80, cy + Math.sin(a) * 80]], 2014 + i, i % 3 ? 1.6 : 3.5, 0.3); }
      const run = clamp((stopT - t) / 3);
      const hand = (ang, len, w, id) => HD.ink(L.ink, [[cx, cy], [cx + Math.cos(ang) * len, cy + Math.sin(ang) * len]], id, w, 0.4);
      hand(-Math.PI / 2 + 1.1, 44, 6, 2030);
      hand(-Math.PI / 2 - 0.55, 66, 3.5, 2031);
      HD.dot(L.ink, cx, cy, 7, HD.INK);
      const sw = Math.sin(Math.min(t, stopT) * Math.PI) * 0.32 * Math.pow(run, 0.6);
      const bob = [cx + Math.sin(sw) * 150, 1100 + Math.cos(sw) * 140];
      HD.ink(L.ink, [[cx, 1100], bob], 2040, 2.4, 0.3);
      HD.crayon(L.col, HD.ellipse(bob[0], bob[1], 24, 24, 16), '#c9a24a', 2041, { spacing: 3 });
      HD.inkShape(L.ink, HD.ellipse(bob[0], bob[1], 24, 24, 16), 2042, 2.2, 0.4);
    });
    const stopped = prog(t, stopT + 0.3, 0.8);
    HD.darkness(L, 0.25 + stopped * 0.3, [{ x: 540, y: 1060, r: 520, a: stopped }], '#06081a', cam);
    const c = EP.top(L);
    HD.text(c, 'shut.', 900, 480, { size: 64, color: C.orange, p: prog(t, appear[0] + 0.6, 0.5), align: 'center', id: 2100, weight: 700 });
    HD.text(c, 'empty.', 880, 840, { size: 64, color: C.orange, p: prog(t, appear[1] + 0.6, 0.5), align: 'center', id: 2101, weight: 700 });
    HD.text(c, 'stopped.', 790, 1175, { size: 64, color: C.orange, p: prog(t, stopT + 0.2, 0.6), align: 'center', id: 2102, weight: 700 });
  },
};

// =====================================================================
// COATS — names on the pegs, two ghost coats walk off, one stays; a man runs out.
// =====================================================================
const COAT_SHAPE = HD.spline([[-34, 18], [0, 24], [34, 18], [104, 66], [118, 250], [124, 466], [62, 490], [0, 482], [-62, 490], [-124, 466], [-118, 250], [-104, 66]]);
SCENES.coats = {
  enter: { type: 'bleed', dur: 0.9 },
  draw(L, k) {
    const t = k.t;
    const cam = EP.camAt([
      { t: k.start, s: 1.05, x: 540, y: 860 },
      { t: k.at('c1') + 2.6, s: 1.05, x: 520, y: 860 },
      { t: k.at('c1') + 3.4, s: 1.25, x: 760, y: 820 },
      { t: k.at('c2'), s: 1.1, x: 600, y: 900 },
      { t: k.end, s: 1.05, x: 540, y: 940 },
    ], t);
    HD.cam(L, cam);
    const gustT = k.at('c2') + 2.4;
    const gust = prog(t, gustT, 0.3) * (1 - prog(t, gustT + 1.5, 1.5));
    const flash = EP.flashAt(t, [gustT]);
    pegWall(L, t, gust * (0.12 + 0.05 * Math.sin(t * 9)));
    for (const [i, px] of [[0, 230], [1, 520]]) {
      const gp = prog(t, k.at('c1') + 0.2 + i * 0.4, 0.5), leave = easeIn(prog(t, k.at('c1') + 1.6 + i * 0.3, 1.8));
      const a = gp * (1 - leave);
      if (a <= 0) continue;
      const ghost = HD.xform(COAT_SHAPE, lerp(px, -200, leave), 544 + leave * 60, -leave * 0.3, 0.82 * (1 - leave * 0.3));
      const d = HD.resample(HD.closed(ghost), 14);
      for (let j = 0; j < d.length - 1; j += 2) HD.ink(L.ink, [d[j], d[j + 1]], 2400 + i * 200 + j, 2.4, 0.6, a * 0.85, '#3d4a7a');
    }
    const runU = prog(t, gustT + 0.2, 1.6);
    if (runU > 0 && runU < 1) HD.figure(L, lerp(1000, 80, runU), 1330, 2.2, { pose: 'run', phase: t * 14, coat: false, facing: -1, id: 2470, alpha: 1 - prog(runU, 0.8, 0.2) });
    HD.rain(L, t, { density: Math.floor(160 * gust), alpha: 0.4 * gust, angle: -0.9, len: 60 });
    HD.darkness(L, 0.35 - flash * 0.25, [{ x: 810, y: 760, r: 520, a: 0.6 }], '#070a1a', cam);
    L.flash = flash * 0.3;
    const c = EP.top(L);
    ['Ducat', 'Marshall', 'McArthur'].forEach((nm, i) => HD.text(c, nm, PEGS[i], 470, { size: 54, color: CHALK, p: prog(t, k.at('c1') + 0.1 + i * 0.3, 0.5), align: 'center', id: 2480 + i, weight: 700 }));
    for (const [i, px] of [[0, 230], [1, 520]]) HD.text(c, 'gone', px, 760, { size: 58, color: C.orange, p: prog(t, k.at('c1') + 1.0 + i * 0.3, 0.5), align: 'center', id: 2490 + i, weight: 700 });
    HD.underline(c, 700, 920, 486, prog(t, k.at('c1') + 3.0, 0.5), 2495, 5);
    HD.text(c, 'still here.', 760, 1150, { size: 76, color: C.orange, p: prog(t, k.at('c1') + 3.4, 0.6), align: 'center', id: 2496, weight: 700 });
    const s = topText(L);
    HD.text(s, '2 COATS GONE.', 540, 270, { size: 100, font: 'brand', weight: 700, color: '#fff3e3', p: prog(t, k.at('c1') + 0.3, 0.6), align: 'center', id: 2497, shadow: false, alpha: 1 - prog(t, k.at('c2') - 0.3, 0.3) });
    HD.text(s, 'WHY NO COAT?', 540, 270, { size: 100, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('c2') + 0.1, 0.6), align: 'center', id: 2498, shadow: false });
  },
};

// =====================================================================
// LANDING — Muirhead's survey as a vertical cliff section.
// =====================================================================
const MPX = 13;
const yAt = m => 1250 - m * MPX;
const CLIFF_V = [[440, 2200], [440, 1255], [490, 1232], [530, yAt(8)], [570, yAt(20)], [600, yAt(33)], [660, yAt(45)], [720, yAt(55)], [790, yAt(62)], [900, yAt(66)], [1500, yAt(68)], [1500, 2200]];
SCENES.landing = {
  enter: { type: 'bleed', dur: 0.9 },
  draw(L, k) {
    const t = k.t;
    HD.cam(L, EP.camAt([
      { t: k.start, s: 1.0, x: 540, y: 900 },
      { t: k.at('l1') + 0.5, s: 1.25, x: 500, y: 1080 },
      { t: k.at('l2'), s: 1.25, x: 560, y: 820 },
      { t: k.at('l2') + 3.0, s: 1.3, x: 560, y: 860 },
      { t: k.end, s: 1.05, x: 540, y: 880 },
    ], t));
    HD.washRect(L.col, 'v-ld-paper', -500, -500, 2100, 2900, '#e2d7bd', 0.3);
    for (let y = -400; y < 2300; y += 40) HD.ink(L.ink, [[-400, y], [1500, y]], 2500 + y, 0.8, 0.5, 0.12, '#4f6f9a');
    for (let x = -400; x < 1500; x += 40) HD.ink(L.ink, [[x, -400], [x, 2300]], 2600 + x, 0.8, 0.5, 0.12, '#4f6f9a');
    HD.sea(L, { horizon: 1255, bottom: 2100, t, storm: 0.6, color: '#3c5a86', alpha: 0.7, id: 2700, rows: 8, x0: -500, x1: 1500 });
    EP.rock(L, 'v-ld-cliff', CLIFF_V, { color: '#a19da3', alpha: 0.55, id: 2710, strata: 14 });
    HD.washPoly(L.col, 'v-ld-turf', [[790, yAt(62)], [900, yAt(66)], [1500, yAt(68)], [1500, yAt(65)], [900, yAt(63)], [800, yAt(59)]], C.grass, 0.4);
    HD.ink(L.ink, [[110, yAt(0)], [110, yAt(70)]], 2720, 3, 0.4);
    for (let m = 0; m <= 70; m += 10) {
      HD.ink(L.ink, [[95, yAt(m)], [125, yAt(m)]], 2721 + m, 2.4, 0.3);
      HD.text(L.ink, `${m} m`, 85, yAt(m) + 10, { size: 30, align: 'right', id: 2730 + m });
    }
    // railings that bend
    const bend = easeOut(prog(t, k.at('l1') + 1.6, 1.2));
    for (let i = 0; i < 7; i++) {
      const u = i / 6, px = lerp(470, 600, u), py = lerp(1232, yAt(33) - 6, u);
      const kink = bend * (i % 2 ? 1 : -0.6) * (1 - u * 0.5);
      HD.ink(L.ink, [[px, py], [px + 10 * kink, py - 26], [px + 30 * kink, py - 50 + 10 * Math.abs(kink)]], 2760 + i, 2.6, 0.4, 0.9, '#2a2a33');
    }
    const railTop = [];
    for (let i = 0; i <= 12; i++) { const u = i / 12; railTop.push([lerp(470, 600, u) + Math.sin(u * 9) * 24 * bend, lerp(1182, yAt(33) - 56, u) + Math.cos(u * 7) * 16 * bend]); }
    HD.ink(L.ink, railTop, 2770, 2.6, 0.6, 0.9, '#2a2a33');
    // the rock that moved
    const rp = easeInOut(prog(t, k.at('l2') + 0.4, 1.4));
    const r0 = [690, yAt(47)], r1 = [740, yAt(53)];
    if (rp > 0) { const ghost = HD.ellipse(r0[0], r0[1], 44, 30, 16); for (let i = 0; i < 16; i += 2) HD.ink(L.ink, [ghost[i], ghost[i + 1]], 2780 + i, 1.6, 0.4, 0.6); }
    const rock = HD.ellipse(lerp(r0[0], r1[0], rp), lerp(r0[1], r1[1], rp), 44, 30, 16);
    HD.crayon(L.col, rock, '#4b4a52', 2790, { spacing: 4 });
    HD.inkShape(L.ink, rock, 2791, 2.6, 0.8);
    // the box in its crevice, smashed
    const cx = 612, cy = yAt(33);
    HD.crayon(L.col, [[cx - 30, cy - 50], [cx + 50, cy - 60], [cx + 60, cy + 10], [cx - 20, cy + 14]], '#2a2a33', 2800, { spacing: 3 });
    const smash = easeOut(prog(t, k.at('l2') + 4.4, 0.8));
    [[-30, -30, 0], [10, -32, 0.4], [-20, -8, -0.3], [16, -6, 0.8]].forEach(([px, py, rot], i) => {
      const pk = HD.xform(HD.rect(-22, -6, 44, 12), cx + px + smash * (i - 1.5) * 30, cy + py + smash * (20 + i * 12), rot * smash * 2, 1);
      HD.crayon(L.col, pk, '#9a6a3f', 2810 + i, { spacing: 3 });
      HD.inkShape(L.ink, pk, 2815 + i, 1.8, 0.4);
    });
    if (smash > 0) for (let i = 0; i < 4; i++) {
      const pts = [];
      for (let a = 0; a < 12; a += 0.35) pts.push([cx - 70 + i * 40 + Math.cos(a) * (10 + a), cy + 70 + i * 22 + Math.sin(a) * (6 + a * 0.6)]);
      HD.ink(L.ink, HD.partial(pts, smash), 2820 + i, 2, 0.5, 0.9, '#7a5a2a');
    }
    const c = L.ink;
    const note = (txt, x, y, p, id, align = 'right', size = 46) => HD.text(c, txt, x, y, { size, color: C.rust, p, id, align, weight: 700 });
    note('railings bent', 430, yAt(14), prog(t, k.at('l1') + 2.0, 0.8), 2850);
    HD.arrow(c, [[300, yAt(12)], [380, yAt(10)], [470, yAt(8)]], prog(t, k.at('l1') + 2.4, 0.5), 2851);
    note('1-ton rock', 640, yAt(49), prog(t, k.at('l2') + 0.8, 0.8), 2852);
    note('moved', 640, yAt(45), prog(t, k.at('l2') + 1.4, 0.6), 2853);
    HD.ink(c, [[110, yAt(33)], [590, yAt(33)]], 2854, 2, 0.4, 0.55 * prog(t, k.at('l2') + 3.2, 0.6), C.rust);
    note('box of ropes · 33 m', 560, yAt(36), prog(t, k.at('l2') + 3.0, 0.9), 2855);
    note('smashed.', 560, yAt(26), prog(t, k.at('l2') + 4.6, 0.6), 2856, 'right', 54);
    const s = topText(L);
    HD.text(s, 'THE WEST LANDING', 540, 230, { size: 80, font: 'brand', weight: 700, color: HD.INK, p: prog(t, k.start + 0.2, 0.8), align: 'center', id: 2860, shadow: false });
    HD.text(s, "Superintendent Muirhead's survey", 540, 290, { size: 46, p: prog(t, k.start + 0.8, 1.0), align: 'center', id: 2861 });
  },
};

// =====================================================================
// WAVE — the theory, staged: two men at the landing, McArthur runs, the sea rises.
// =====================================================================
const ISLAND_W = [[260, 2200], [300, 1250], [400, 1205], [480, 1120], [550, 1000], [620, 880], [700, 760], [760, 650], [860, 590], [1500, 575], [1500, 2200]];
const PATH_W = [[880, 585], [800, 640], [730, 740], [660, 860], [590, 980], [520, 1100], [440, 1195]];
const along = (pts, u) => { const p = HD.partial(HD.resample(pts, 6), clamp(u)); return p[p.length - 1]; };
SCENES.wave = {
  enter: { type: 'bleed', dur: 0.9 },
  draw(L, k) {
    const t = k.t;
    const crash = k.at('w3') - 0.4;
    const cam = EP.camAt([
      { t: k.start, s: 1.0, x: 540, y: 900 },
      { t: k.at('w2'), s: 1.08, x: 600, y: 880 },
      { t: k.at('w2') + 3.2, s: 1.15, x: 760, y: 700 },
      { t: k.at('w2') + 4.4, s: 0.98, x: 540, y: 900 },
      { t: crash, s: 1.06, x: 480, y: 980 },
      { t: crash + 0.4, s: 1.0, x: 500, y: 960, r: -0.02 },
      { t: crash + 2, s: 1.0, x: 540, y: 920, r: 0 },
    ], t);
    const shake = t > crash ? Math.exp(-(t - crash) * 2) : 0;
    cam.x += Math.sin(t * 60) * 14 * shake; cam.y += Math.cos(t * 53) * 10 * shake;
    HD.cam(L, cam);
    const flash = EP.flashAt(t, [k.at('w1') + 0.3, crash]);
    HD.washRect(L.col, 'v-wv-sky', -500, -500, 2100, 2900, '#34416b', 0.7);
    for (let i = 0; i < 5; i++) HD.drawWash(L.col, HD.makeWash(720 + i), -200 + i * 360 - t * 12, 200 + HD.h2(i, 5) * 300, 300, i, '#121730', 0.28);
    HD.sea(L, { horizon: 1000, bottom: 2100, t: t * 1.2, storm: 1, color: '#22365f', alpha: 0.85, id: 3000, inkColor: '#9db2da', inkAlpha: 0.65, x0: -500, x1: 900 });
    EP.rock(L, 'v-wv-isl', ISLAND_W, { color: '#1c1f2e', alpha: 0.9, id: 3010, strata: 12 });
    HD.ink(L.ink, PATH_W, 3020, 2.2, 1, 0.7, '#9aa0b8');
    HD.lighthouse(L, 920, 590, 0.75, { lit: 0.85, id: 3030, windows: 1, beamAng: Math.PI * 0.95 + Math.sin(t * 0.3) * 0.2, beamAlpha: 0.3 });
    if (t < crash + 0.3) {
      for (const i of [0, 1]) {
        const u = easeInOut(prog(t, k.at('w2') + 0.2 + i * 0.4, 3.0));
        const p = along(PATH_W, u);
        HD.figure(L, p[0] + (u >= 1 ? i * 34 - 20 : 0), p[1], 0.85, { pose: u > 0 && u < 1 ? 'walk' : 'stand', phase: t * 7 + i, id: 3040 + i * 10, facing: -1 });
      }
      const runU = easeIn(prog(t, k.at('w2') + 3.6, crash - (k.at('w2') + 3.6)));
      if (runU <= 0) HD.figure(L, 820, 585, 0.55, { id: 3060, alpha: prog(t, k.at('w2') + 2.6, 0.5) });
      else { const p = along(PATH_W, runU * 0.9); HD.figure(L, p[0], p[1], 0.85, { pose: 'run', phase: t * 13, coat: false, id: 3060, facing: -1 }); }
    }
    // the breaker
    const rise0 = k.at('w1') + 0.6;
    const g = easeIn(prog(t, rise0, crash - rise0));
    if (g > 0 && t < crash + 0.7) {
      const fall = clamp((t - crash) / 0.7);
      const base = 1230, ht = lerp(40, 640, Math.pow(g, 0.85)) * (1 - fall * 0.7);
      const cx = lerp(-300, 250, g) + fall * 100, cy = base - ht, lp = lerp(30, 230, g);
      const wave = HD.spline([
        [-900, base + 40], [cx - 700, base - 10], [cx - 400, base - ht * 0.42], [cx - 180, cy + ht * 0.1], [cx - 30, cy],
        [cx + lp * 0.55, cy - 6], [cx + lp, cy + lp * 0.42], [cx + lp * 0.8, cy + lp * 0.78], [cx + lp * 0.45, cy + lp * 0.6],
        [cx + lp * 0.3, cy + lp * 0.95], [cx + lp * 0.62, base - ht * 0.22], [cx + lp + 150, base + 30], [cx + lp + 320, base + 400], [-900, base + 400],
      ]);
      HD.occlude(L.ink, wave);
      HD.crayon(L.col, wave, '#2f5f98', 3100, { spacing: 6, dark: '#1b3e6c' });
      const face = HD.spline([[cx - 30, cy + 12], [cx + lp * 0.5, cy + 8], [cx + lp * 0.85, cy + lp * 0.45], [cx + lp * 0.4, cy + lp * 0.6], [cx + lp * 0.3, cy + lp * 0.95], [cx + lp * 0.62, base - ht * 0.22], [cx + lp + 120, base + 20], [cx - 60, base - ht * 0.3]]);
      HD.crayon(L.col, face, '#86b1da', 3101, { alpha: 0.7, spacing: 5 });
      HD.inkShape(L.ink, wave, 3102, 3.6, 2);
      for (let i = 1; i <= 6; i++) {
        const f = i / 7;
        HD.ink(L.ink, HD.spline([[cx - 700 + i * 70, base - 6], [cx - 400 + i * 50, base - ht * (0.42 - f * 0.3)], [cx - 180 + i * 32, cy + ht * (0.1 + f * 0.35)], [cx - 30 + i * 22, cy + ht * f * 0.45]], false), 3110 + i, 1.8, 1.4, 0.75, '#b8d0f0');
      }
      for (let j = 0; j < 12; j++) {
        const u = j / 11, px = lerp(cx - 150, cx + lp * 0.95, u), py = j < 6 ? lerp(cy + 30, cy - 4, u * 2) : cy + (u - 0.5) * lp * 0.9;
        HD.ink(L.ink, HD.quadPts([px, py], [px + 14, py - 12], [px + 24, py + 4], 5), 3130 + j, 3, 0.6, 1, C.foam);
      }
      HD.spatter(L.ink, cx + lp * 0.3, cy - 20, 60 + g * 80, 26, C.foam, 3145 + Math.floor(t * 8) % 4, 0.9);
    }
    const cr = t - crash;
    if (cr > 0) {
      const a = clamp(1 - cr / 4);
      // spray: streaks flung up and out, then falling, plus fine droplets (no cloud blobs)
      for (let i = 0; i < 26; i++) {
        const ang = -Math.PI * (0.15 + HD.h2(i, 2) * 0.7), sp = 420 + HD.h2(i, 3) * 520;
        const tt = Math.min(cr, 1.6), x = 450 + Math.cos(ang) * sp * tt, y = 1150 + Math.sin(ang) * sp * tt + 260 * tt * tt;
        const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp + 520 * tt, vl = Math.hypot(vx, vy) || 1;
        HD.ink(L.ink, [[x, y], [x - vx / vl * 40, y - vy / vl * 40]], 3180 + i, 3, 0.4, a * 0.9, C.foam);
      }
      HD.spatter(L.ink, 450, 1050, 160 + cr * 170, 180, C.foam, 3150 + Math.floor(cr * 8), 0.9 * a);
      HD.glow(L.glow, 450, 1120, 500, '#cfe0ff', 0.4 * a);
      // three seabirds rise from the empty landing
      for (let i = 0; i < 3; i++) {
        const u = easeIn(prog(t, k.at('w3') + 0.4 + i * 0.3, 3.5));
        if (u <= 0 || u >= 1) continue;
        const bx = 460 + i * 40 + u * (300 + i * 90), by = 1100 - u * (700 + i * 80), f = Math.sin(t * 8 + i * 2), s = 22;
        HD.ink(L.ink, [...HD.quadPts([bx - s, by - s * 0.35 * f], [bx - s * 0.45, by - s * 0.55 * f - s * 0.1], [bx, by], 5), ...HD.quadPts([bx, by], [bx + s * 0.45, by - s * 0.55 * f - s * 0.1], [bx + s, by - s * 0.35 * f], 5).slice(1)], 3240 + i, 2.6, 0.5, 1 - u, '#d8d6e8');
      }
    }
    HD.rain(L, t, { density: 220, alpha: 0.28, angle: 0.35 });
    if (flash > 0.3) EP.bolt(L, 260, -200, 600, 3160 + Math.floor(t), flash);
    HD.darkness(L, 0.3 - flash * 0.2 + prog(t, k.at('w3'), 1.5) * 0.25, [{ x: 920, y: 400, r: 420, a: 0.7 }], '#03050f', cam);
    L.flash = flash * 0.35 + (cr > 0 ? clamp(1 - cr / 0.5) * 0.6 : 0);
    const s = topText(L);
    const aTop = 1 - prog(t, k.at('w3') - 0.6, 0.3);
    HD.text(s, 'A MONSTER WAVE?', 540, 260, { size: 96, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('w1') + 1.0, 0.6), align: 'center', id: 3170, shadow: false, alpha: aTop });
    HD.text(s, 'the most likely theory', 540, 330, { size: 50, color: '#e9e2d4', p: prog(t, k.at('w1') + 1.5, 0.8), align: 'center', id: 3171, alpha: aTop });
    HD.text(s, 'NEVER FOUND.', 540, 280, { size: 112, font: 'brand', weight: 700, color: '#fff3e3', p: prog(t, k.at('w3') + 0.2, 0.6), align: 'center', id: 3172, shadow: false });
  },
};

// =====================================================================
// OUTRO — the owl, its lantern, the eyes of the Owl Society.
// =====================================================================
const SOCIETY_V = Array.from({ length: 22 }, (_, i) => ({ x: 70 + HD.h2(i, 41) * 940, y: 560 + HD.h2(i, 42) * 560, s: 0.55 + HD.h2(i, 43) * 0.6, at: HD.h2(i, 44) }))
  .filter(e => Math.hypot(e.x - 560, (e.y - 900) * 0.9) > 300);
SCENES.outro = {
  enter: { type: 'fade', dur: 1.0 },
  draw(L, k) {
    const t = k.t, lt = k.lt;
    HD.cam(L, EP.camAt([{ t: k.start, s: 1.15, x: 540, y: 980 }, { t: k.at('o2') + 1.5, s: 1.0, x: 540, y: 960 }], t));
    HD.washRect(L.col, 'v-ou-bg', -400, -400, 1900, 2800, '#1a2144', 0.8);
    for (let i = 0; i < 6; i++) {
      const x = -60 + i * 230, h = 600 + HD.h2(i, 6) * 400;
      HD.washPoly(L.col, 'v-ou-tree' + i, [[x - 90, 1700], [x - 30, 1560 - h], [x + 40, 1540 - h * 1.05], [x + 110, 1700]], '#0a0d20', 0.35);
    }
    HD.stars(L, 60, -100, 100, 1300, 700, t, 21, 0.5);
    HD.ink(L.ink, [[-100, 1180], [300, 1166], [700, 1176], [1200, 1164]], 3300, 30, 2, 1, '#22170f');
    const s = 1.2, oy = 1166 - 232 * s;
    const wink = HD.window(t, k.at('o2') + 3.4, k.at('o2') + 3.95, 0.12, 0.15);
    const raise = 0.75 + 0.25 * easeInOut(prog(t, k.at('o1') + 0.6, 1.0));
    HD.owl(L, 540, oy, s, {
      blink: (lt % 3.6 > 3.4) ? 1 : 0, wink, look: [Math.sin(lt * 0.5) * 0.3, 0], brow: 0.6 + 0.4 * prog(t, k.at('o2'), 0.5),
      wingUp: raise, lantern: 1, lit: 1, swing: Math.sin(lt * 1.4) * 0.1, id: 5000, t, tilt: Math.sin(lt * 0.7) * 0.03,
    });
    const lantern = [540 + 150 * s, oy - 40 - raise * 60];
    const open = prog(t, k.at('o2') + 0.4, 3.0);
    for (const e of SOCIETY_V) HD.eyePair(L, e.x, e.y, e.s, clamp((open - e.at * 0.7) * 3), 3400 + Math.floor(e.x));
    HD.darkness(L, 0.9, [{ x: lantern[0], y: lantern[1], r: 650 + 100 * prog(t, k.at('o1') + 0.6, 1.0), core: 0.3 }], '#04051a', { s: 1, x: 540, y: 960 });
    const c = topText(L);
    const em = prog(t, k.at('o2') + 1.6, 1.4);
    if (em > 0) HD.owlEmblem({ ink: c, glow: L.glow, t }, 540, 400, 0.85, em, 3320);
    const a1 = 1 - prog(t, k.at('o2') - 0.2, 0.3);
    HD.text(c, 'the full story is on', 540, 1280, { size: 58, color: CHALK, p: prog(t, k.at('o1'), 0.8), align: 'center', id: 3310, weight: 700, alpha: a1 });
    HD.text(c, 'HOUSE OF OWLS', 540, 1385, { size: 90, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('o1') + 0.6, 0.7), align: 'center', id: 3311, shadow: false, alpha: a1 });
    HD.text(c, 'Keep watching. Keep learning.', 540, 1280, { size: 58, color: CHALK, p: prog(t, k.at('o2'), 1.2), align: 'center', id: 3312, weight: 700 });
    HD.text(c, 'THE OWL SOCIETY', 540, 1385, { size: 84, font: 'brand', weight: 700, color: C.orange, p: prog(t, k.at('o2') + 2.4, 0.9), align: 'center', id: 3313, shadow: false });
    L.fade = prog(t, k.end - 0.5, 0.5);
  },
};
})();
