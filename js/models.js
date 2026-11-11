'use strict';
/* ============================================================
   FIGHTER CRAFT - 3D models. Every character is built from boxes
   with a few joints (hips, shoulders), animated by code.
   Facing: a character with yaw 0 looks toward +Z.
   ============================================================ */
const ID4 = M4.id(), WHITE = [1, 1, 1];
/* a box hanging from a joint: joint at (px,py,pz) inside m, swung forward by rx, sideways by rz */
function jbox(m, px, py, pz, rx, rz, hx, hy, hz, oy, col, em) {
  let j = M4.t(m, px, py, pz); if (rz) j = M4.rz(j, rz); if (rx) j = M4.rx(j, -rx);
  G3.box(M4.t(j, 0, oy, 0), hx, hy, hz, col, em || 0); return j;
}

/* ---------------- the hero ---------------- */
function hero3(o) {
  const A = o.armor || [], su = SUITS[o.suit || 0], c1 = C3(su[0]), c2 = C3(su[1]), skin = C3('#f2b98a'), dark = C3('#20242e'), t = o.t || 0, p = clamp(o.pt || 0, 0, 1), W = o.melee || 'fist';
  let lean = 0, twist = 0, bob = Math.sin(t * 3) * 0.015, lr = 0.06, ll = -0.06, ar = 0.25, al = 0.2, arz = 0.08, alz = 0.08;
  const k = Math.sin(Math.min(1, p * 1.4) * Math.PI);
  switch (o.pose) {
    case 'run': { const ph = t * 12; lr = Math.sin(ph) * 0.95; ll = -lr; ar = -lr * 0.8 + 0.2; al = lr * 0.8 + 0.2; lean = 0.2; bob = Math.abs(Math.cos(ph)) * 0.07; break; }
    case 'back': { const ph = t * 9; lr = Math.sin(ph) * 0.5; ll = -lr; lean = -0.08; break; }
    case 'jump': lr = 0.8; ll = -0.3; ar = 2.5; al = 2.3; break;
    case 'fall': lr = 0.3; ll = -0.4; ar = 2.0; al = 1.9; arz = 0.5; alz = 0.5; break;
    case 'hover': lr = 0.25; ll = -0.2; ar = 0.5; al = 0.5; arz = 0.4; alz = 0.4; lean = 0.4; break;
    case 'atk1': if (W === 'hammer') { ar = lerp(3.0, 0.5, p); lean = 0.3 * p; } else if (W === 'sword') { ar = 1.5; twist = lerp(-1.0, 0.8, p); lean = 0.12; } else { ar = lerp(0.4, 1.65, k); twist = 0.45 * k; lean = 0.14 * k; } lr = 0.4; ll = -0.4; break;
    case 'atk2': if (W === 'hammer') { ar = lerp(3.0, 0.5, p); lean = 0.3 * p; } else if (W === 'sword') { ar = 1.5; twist = lerp(0.8, -1.0, p); lean = 0.12; } else { al = lerp(0.4, 1.65, k); twist = -0.45 * k; lean = 0.14 * k; } lr = -0.4; ll = 0.4; break;
    case 'atk3': if (W === 'hammer') { ar = lerp(3.1, 0.3, p); al = lerp(3.1, 0.3, p); lean = 0.45 * p; bob = 0.5 * k; } else if (W === 'sword') { ar = 1.55; twist = p * TAU; bob = 0.15 * k; } else { ar = lerp(0.2, 2.7, k); lean = 0.1; bob = 0.35 * k; } lr = 0.5; ll = -0.5; break;
    case 'kick': lr = 1.5; ll = -0.6; ar = -0.4; al = 0.8; lean = -0.25; break;
    case 'blast': al = 1.57; alz = 0; twist = -0.25; lr = 0.3; ll = -0.3; break;
    case 'hurt': lean = -0.45; ar = -0.9; al = -0.9; lr = 0.4; ll = 0.1; break;
    case 'win': { const w = Math.sin(t * 8) * 0.2; ar = 2.8 + w; al = 2.8 - w; arz = 0.3; alz = 0.3; bob = Math.abs(Math.sin(t * 6)) * 0.3; break; }
  }
  const m = M4.ry(M4.t(ID4, o.x, o.y + bob, o.z), o.yaw + twist);
  // legs + boots
  for (const s of [-1, 1]) {
    const j = jbox(m, s * 0.16, 0.86, 0, s < 0 ? lr : ll, 0, 0.13, 0.43, 0.14, -0.43, s < 0 ? c1 : c2);
    if (A[0]) { G3.box(M4.t(j, 0, -0.66, 0.02), 0.165, 0.2, 0.19, C3('#b8f0ff'), 0.25); G3.box(M4.t(j, 0, -0.83, 0.03), 0.17, 0.035, 0.2, C3('#39d0ff'), 1); }
    else G3.box(M4.t(j, 0, -0.78, 0.03), 0.145, 0.09, 0.18, dark);
  }
  const up = M4.rx(M4.t(m, 0, 0.86, 0), lean);
  // jet wings (on the back)
  if (A[3]) {
    G3.box(M4.t(up, 0, 0.42, -0.25), 0.17, 0.23, 0.08, C3('#596275'));
    for (const s of [-1, 1]) G3.box(M4.rz(M4.t(up, s * 0.36, 0.62, -0.27), s * 0.55), 0.3, 0.07, 0.03, C3('#ff8c1a'), 0.15);
    if (o.jet) { const fl = 0.28 + Math.sin(t * 50) * 0.08; G3.glow(M4.t(up, 0, 0.1 - fl, -0.25), 0.1, fl, 0.1, C3('#ffb347'), 1.4); G3.glow(M4.t(up, 0, 0.1 - fl, -0.25), 0.2, fl * 1.3, 0.2, C3('#ff5a1a'), 0.5); }
  }
  // torso
  G3.box(M4.t(up, 0, 0.36, 0), 0.3, 0.36, 0.17, c1); G3.box(M4.t(up, 0, 0.03, 0), 0.31, 0.05, 0.18, dark);
  if (A[2]) {
    G3.box(M4.t(up, 0, 0.45, 0.01), 0.33, 0.25, 0.2, C3('#c9d6e8'));
    G3.box(M4.t(up, 0, 0.47, 0.215), 0.07, 0.07, 0.01, C3('#7df9ff'), 1);
    for (const s of [-1, 1]) G3.box(M4.t(up, s * 0.43, 0.7, 0), 0.15, 0.07, 0.17, C3('#e4ecf7'));
  } else G3.box(M4.t(up, 0, 0.42, 0.175), 0.07, 0.1, 0.01, C3('#ffe14d'), 0.6);
  // head
  const hd = M4.t(up, 0, 0.93, 0);
  G3.box(hd, 0.2, 0.2, 0.2, skin);
  if (A[4]) {
    G3.box(M4.t(hd, 0, 0.02, -0.02), 0.24, 0.24, 0.23, C3('#9d7be0')); G3.box(M4.t(hd, 0, 0.02, 0.215), 0.19, 0.06, 0.01, C3('#7df9ff'), 1);
    G3.box(M4.t(hd, 0, 0.32, -0.04), 0.03, 0.09, 0.2, C3('#ffe14d'), 0.4);
  } else {
    G3.box(M4.t(hd, 0, 0.17, -0.02), 0.215, 0.07, 0.22, C3('#3b2a20')); G3.box(M4.t(hd, 0, 0.02, -0.17), 0.21, 0.16, 0.05, C3('#3b2a20'));
    G3.box(M4.t(hd, 0, 0.08, 0), 0.212, 0.03, 0.212, c1);
    for (const s of [-1, 1]) G3.box(M4.t(hd, s * 0.08, 0, 0.2), 0.03, 0.04, 0.01, C3('#1c1c22'));
  }
  // right arm (weapon arm) - hero's right side is -X
  const ra = jbox(up, -0.42, 0.66, 0, ar, -arz, 0.1, 0.33, 0.1, -0.31, c1);
  if (A[1]) G3.box(M4.t(ra, 0, -0.56, 0), 0.135, 0.17, 0.135, C3('#ffd23f'), 0.25); else G3.box(M4.t(ra, 0, -0.66, 0), 0.09, 0.07, 0.09, skin);
  if (W === 'sword') {
    const w = M4.rx(M4.t(ra, 0, -0.68, 0), -1.25);
    G3.box(M4.t(w, 0, -0.78, 0), 0.055, 0.68, 0.02, C3('#d9fbff'), 0.55); G3.box(M4.t(w, 0, -0.08, 0), 0.17, 0.035, 0.05, C3('#ffd23f')); G3.box(M4.t(w, 0, 0.08, 0), 0.035, 0.12, 0.035, C3('#3b2a20'));
    if (o.pose && o.pose.startsWith('atk')) G3.glow(M4.t(w, 0, -0.78, 0), 0.12, 0.72, 0.06, C3('#39d0ff'), 0.7);
  } else if (W === 'hammer') {
    const w = M4.rx(M4.t(ra, 0, -0.68, 0), -1.1);
    G3.box(M4.t(w, 0, -0.5, 0), 0.04, 0.62, 0.04, C3('#6b4a2b')); G3.box(M4.t(w, 0, -1.14, 0), 0.2, 0.2, 0.36, C3('#8a94a8')); G3.box(M4.t(w, 0, -1.14, 0), 0.215, 0.07, 0.37, C3('#ffd23f'), 0.5);
    if (o.pose && o.pose.startsWith('atk')) G3.glow(M4.t(w, 0, -1.14, 0), 0.32, 0.32, 0.5, C3('#ffd23f'), 0.5);
  }
  // left arm + ranged weapon
  const la = jbox(up, 0.42, 0.66, 0, al, alz, 0.1, 0.33, 0.1, -0.31, c2);
  if (A[1]) G3.box(M4.t(la, 0, -0.56, 0), 0.135, 0.17, 0.135, C3('#ffd23f'), 0.25); else G3.box(M4.t(la, 0, -0.66, 0), 0.09, 0.07, 0.09, skin);
  const R = o.ranged || 'blaster';
  if (R === 'rocket') { G3.box(M4.t(up, 0.43, 0.86, 0.06), 0.11, 0.11, 0.46, C3('#3f5a3a')); G3.box(M4.t(up, 0.43, 0.86, 0.53), 0.085, 0.085, 0.02, C3('#ff5a36'), 0.8); }
  else { const w = R === 'tri' ? 0.15 : 0.075; G3.box(M4.t(la, 0, -0.52, 0.13), w, 0.16, 0.075, C3('#2b3242')); G3.box(M4.t(la, 0, -0.7, 0.13), w * 0.8, 0.025, 0.05, C3('#7df9ff'), 1); }
  if (o.pose === 'blast') G3.glow(M4.t(la, 0, -0.85, 0.1), 0.22, 0.22, 0.22, C3('#39d0ff'), 1.2);
}

/* ---------------- robots ---------------- */
const LOOK3 = {
  scrapper: { s: 0.86, bw: 0.42, bh: 0.42, leg: 0.5, hw: 0.3, arm: 1.1, aw: 0.1, c: '#8d99ae', d: '#4a5568', eye: '#ff8a36', ant: 1 },
  zapper: { s: 1.0, bw: 0.27, bh: 0.5, leg: 0.6, hw: 0.26, arm: 1.0, aw: 0.075, c: '#7b6fd6', d: '#3d357a', eye: '#7df9ff', coil: 1 },
  brute: { s: 1.35, bw: 0.62, bh: 0.5, leg: 0.42, hw: 0.3, arm: 1.3, aw: 0.2, c: '#b0562f', d: '#5e2a14', eye: '#ffcf33' },
  crusher: { s: 1.9, bw: 0.64, bh: 0.52, leg: 0.45, hw: 0.34, arm: 1.5, aw: 0.22, c: '#c0392b', d: '#641e16', eye: '#ffe14d', horn: 1, core: '#ffe14d' },
  viper: { s: 1.75, bw: 0.4, bh: 0.62, leg: 0.62, hw: 0.32, arm: 1.5, aw: 0.12, c: '#8e44ad', d: '#4a235a', eye: '#7dffb0', coil: 1, core: '#7dffb0' },
  furnace: { s: 2.0, bw: 0.68, bh: 0.52, leg: 0.42, hw: 0.3, arm: 1.5, aw: 0.24, c: '#66737f', d: '#1c2833', eye: '#ff7b00', stack: 1, core: '#ff7b00' },
  corex: { s: 2.25, bw: 0.56, bh: 0.62, leg: 0.55, hw: 0.36, arm: 1.6, aw: 0.18, c: '#2b3144', d: '#0c0e16', eye: '#ff2244', horn: 1, crown: 1, core: '#ff2244' }
};
function bot3(e, L) {
  const s = L.s, f = e.flash > 0, col = f ? WHITE : C3(L.c), dk = f ? WHITE : C3(L.d), lt = f ? WHITE : mixC(C3(L.c), WHITE, 0.3), t = e.t;
  const walk = e.moving ? Math.sin(t * 8) : 0, st = e.state;
  let aF = walk * 0.5, aB = -walk * 0.5, lean = 0;
  if (st === 'wind') { const q = clamp(1 - e.st / (e.windT || 1), 0, 1); aF = 2.9 * q; aB = e.boss ? 2.9 * q : aB; lean = -0.15 * q; }
  else if (st === 'swing') { aF = 0.9; aB = e.boss ? 0.9 : aB; lean = 0.35; }
  else if (st === 'stun' || st === 'dizzy') { lean = -0.2 + Math.sin(t * 5) * 0.08; aF = -0.3; aB = -0.2; }
  else if (st === 'charge') { lean = 0.45; aF = 1.4; aB = 1.4; }
  else if (st === 'air') { aF = 2.9; aB = 2.9; }
  else if (st === 'cast' || st === 'laser') { aF = 1.57; aB = 1.57; lean = -0.05; }
  const hot = st === 'wind' || st === 'charge' || st === 'cast' || st === 'laser', eye = f ? WHITE : C3(hot ? '#ff2a1a' : L.eye);
  const m = M4.ry(M4.t(ID4, e.x, e.y, e.z), e.yaw), hip = L.leg * 2 * s;
  for (const sd of [-1, 1]) { const j = jbox(m, sd * L.bw * 0.55 * s, hip, 0, sd * walk * 0.5, 0, L.aw * 1.3 * s, L.leg * s, L.aw * 1.5 * s, -L.leg * s, dk); G3.box(M4.t(j, 0, -L.leg * 1.9 * s, L.aw * 0.5 * s), L.aw * 1.5 * s, L.leg * 0.16 * s, L.aw * 2.1 * s, dk); }
  const up = M4.rx(M4.t(m, 0, hip, 0), lean), bw = L.bw * s, bh = L.bh * s, bd = L.bw * 0.62 * s;
  G3.box(M4.t(up, 0, bh, 0), bw, bh, bd, col);
  if (!f) {
    if (L.core) { G3.box(M4.t(up, 0, bh * 1.2, bd + 0.01), bw * 0.3, bw * 0.3, 0.02, C3(L.core), 1); G3.glow(M4.t(up, 0, bh * 1.2, bd + 0.05), bw * 0.5, bw * 0.5, 0.08, C3(L.core), 0.45 + Math.sin(t * 6) * 0.2); }
    else G3.box(M4.t(up, 0, bh * 1.15, bd + 0.01), bw * 0.6, bh * 0.4, 0.02, dk);
  }
  if (L.stack) for (const sd of [-1, 1]) G3.box(M4.t(up, sd * bw * 0.6, bh * 2 + 0.3 * s, -bd * 0.3), 0.13 * s, 0.4 * s, 0.13 * s, dk);
  const hy = bh * 2 + L.hw * 0.8 * s, hw = L.hw * s, hd = M4.t(up, 0, hy, 0);
  G3.box(hd, hw, hw * 0.8, hw, lt);
  G3.box(M4.t(hd, 0, 0.02 * s, hw + 0.01), hw * 0.75, hw * 0.24, 0.02, eye, 1);
  if (hot && !f) G3.glow(M4.t(hd, 0, 0.02 * s, hw + 0.06), hw, hw * 0.5, 0.1, C3('#ff2a1a'), 0.8);
  if (L.ant) { G3.box(M4.t(hd, -hw * 0.4, hw * 1.25, 0), 0.02, hw * 0.5, 0.02, dk); G3.box(M4.t(hd, -hw * 0.4, hw * 1.8, 0), 0.06, 0.06, 0.06, C3('#ff5a36'), 1); }
  if (L.coil) { G3.box(M4.t(hd, 0, hw * 1.3, 0), 0.04 * s, hw * 0.6, 0.04 * s, C3('#cfd8e6')); G3.box(M4.t(hd, 0, hw * 2, 0), 0.11 * s, 0.11 * s, 0.11 * s, C3('#7df9ff'), 1); if (hot) G3.glow(M4.t(hd, 0, hw * 2, 0), 0.35 * s, 0.35 * s, 0.35 * s, C3('#7df9ff'), 0.9); }
  if (L.horn) for (const sd of [-1, 1]) G3.box(M4.rz(M4.t(hd, sd * hw * 1.05, hw * 0.9, 0), -sd * 0.6), 0.07 * s, hw * 0.75, 0.07 * s, C3('#f3e9d2'));
  if (L.crown) for (let i = -1; i <= 1; i++) G3.box(M4.t(hd, i * hw * 0.55, hw * 1.05, 0), hw * 0.16, hw * 0.3, hw * 0.16, C3('#ffd23f'), 0.5);
  const ah = L.arm * 0.5 * s, aw = L.aw * s;
  for (const sd of [-1, 1]) {
    const j = jbox(up, sd * (bw + aw), bh * 1.8, 0, sd < 0 ? aF : aB, sd * 0.06, aw, ah, aw, -ah, sd < 0 ? col : dk);
    G3.box(M4.t(j, 0, -ah * 2, 0), aw * 1.6, aw * 1.6, aw * 1.6, lt);
    if (hot && !f && (sd < 0 || e.boss)) G3.glow(M4.t(j, 0, -ah * 2, 0), aw * 2.6, aw * 2.6, aw * 2.6, C3('#ff3322'), 0.7);
  }
}
function roller3(e) {
  const f = e.flash > 0, hot = e.state === 'wind' || e.state === 'roll', g1 = f ? WHITE : C3('#2fa37a'), g2 = f ? WHITE : C3('#1f7a5c');
  const sh = e.state === 'wind' ? Math.sin(e.t * 60) * 0.03 : 0, m = M4.ry(M4.t(ID4, e.x + sh, e.y + 0.72, e.z), e.yaw), w = M4.rx(m, e.spin || 0);
  G3.box(w, 0.42, 0.52, 0.52, g1); G3.box(M4.rx(w, 0.785), 0.44, 0.52, 0.52, g2);
  if (e.state === 'roll') G3.box(M4.rx(w, 0.39), 0.3, 0.72, 0.72, f ? WHITE : C3('#d7dde8'));
  const ec = C3(hot ? '#ff2a1a' : '#ffe14d');
  for (const s of [-1, 1]) G3.box(M4.t(m, s * 0.46, 0, 0), 0.04, 0.2, 0.2, ec, 1);
  G3.box(M4.t(m, 0, 0.82, 0), 0.22, 0.13, 0.22, f ? WHITE : C3('#9be7c4')); G3.box(M4.t(m, 0, 0.83, 0.225), 0.16, 0.05, 0.01, ec, 1);
  if (hot && !f) G3.glow(m, 0.75, 0.75, 0.75, C3('#ff2a1a'), 0.3);
}
function drone3(e, big) {
  const f = e.flash > 0, s = big ? 2.5 : 1, hot = e.state === 'wind' || e.state === 'charge' || e.state === 'cast', dz = e.state === 'dizzy';
  const c = f ? WHITE : C3(big ? '#3e6fa8' : '#8a93a6'), d = f ? WHITE : C3('#2b3242');
  let m = M4.ry(M4.t(ID4, e.x, e.y + 0.35 * s + (dz ? 0 : Math.sin(e.t * 4) * 0.06), e.z), e.yaw);
  if (e.state === 'charge') m = M4.rx(m, 0.4); if (dz) m = M4.rz(m, Math.sin(e.t * 5) * 0.15);
  G3.box(m, 0.62 * s, 0.14 * s, 0.62 * s, c); G3.box(M4.t(m, 0, 0.2 * s, 0), 0.3 * s, 0.12 * s, 0.3 * s, d);
  const ec = C3(hot ? '#ff2a1a' : big ? '#ffe14d' : '#ff5a36');
  G3.box(M4.t(m, 0, 0.02 * s, 0.63 * s), 0.22 * s, 0.07 * s, 0.01, ec, 1); G3.box(M4.t(m, 0, -0.16 * s, 0), 0.12 * s, 0.03 * s, 0.12 * s, C3(hot ? '#ff2a1a' : '#39d0ff'), 1);
  if (hot && !f) G3.glow(M4.t(m, 0, -0.3 * s, 0), 0.3 * s, 0.2 * s, 0.3 * s, C3('#ff2a1a'), 0.8);
  for (let i = 0; i < 4; i++) { const rx = (i & 1 ? 1 : -1) * 0.6 * s, rz = (i & 2 ? 1 : -1) * 0.6 * s; G3.box(M4.t(m, rx, 0.2 * s, rz), 0.03 * s, 0.07 * s, 0.03 * s, d); if (!dz) G3.box(M4.ry(M4.t(m, rx, 0.29 * s, rz), e.t * 40 + i), 0.34 * s, 0.012, 0.05 * s, C3('#cfd8e6')); }
  if (big) { for (const sd of [-1, 1]) G3.box(M4.rz(M4.t(m, sd * 1.0 * s, 0.05 * s, -0.1 * s), sd * 0.25), 0.5 * s, 0.05 * s, 0.3 * s, C3('#2c4f7a')); G3.box(M4.t(m, 0, -0.02 * s, 0.8 * s), 0.1 * s, 0.07 * s, 0.2 * s, C3('#ffd23f'), 0.3); }
}
function enemy3(e) {
  if (e.kind === 'roller') roller3(e); else if (e.kind === 'drone') drone3(e, false); else if (e.look === 'warden') drone3(e, true); else bot3(e, LOOK3[e.look || e.kind]);
}
/* a friendly citizen (they come back when a district is saved) */
function citizen3(c, t) {
  const w = c.moving ? Math.sin(t * 9 + c.ph) * 0.7 : 0, m = M4.ry(M4.t(ID4, c.x, 0, c.z), c.yaw), s = c.s;
  for (const sd of [-1, 1]) jbox(m, sd * 0.12 * s, 0.7 * s, 0, sd * w, 0, 0.1 * s, 0.35 * s, 0.11 * s, -0.35 * s, c.c2);
  G3.box(M4.t(m, 0, 1.0 * s, 0), 0.24 * s, 0.3 * s, 0.14 * s, c.c1); G3.box(M4.t(m, 0, 1.47 * s, 0), 0.16 * s, 0.16 * s, 0.16 * s, c.skin); G3.box(M4.t(m, 0, 1.61 * s, -0.01), 0.17 * s, 0.05 * s, 0.17 * s, c.hair);
  for (const sd of [-1, 1]) jbox(m, sd * 0.32 * s, 1.26 * s, 0, c.cheer ? 2.8 + Math.sin(t * 10 + c.ph) * 0.3 : -sd * w, sd * 0.06, 0.07 * s, 0.27 * s, 0.07 * s, -0.25 * s, c.c1);
}
/* BOLT the helper drone */
function bolt3(x, y, z, t, yaw) {
  const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 2.4) * 0.12, z), yaw);
  G3.box(m, 0.26, 0.24, 0.26, C3('#f4f8ff')); G3.box(M4.t(m, 0, 0.02, 0.265), 0.2, 0.11, 0.01, C3('#1d2a3a'));
  const bl = (t % 3.5) < 0.12 ? 0.01 : 0.05; for (const s of [-1, 1]) G3.box(M4.t(m, s * 0.09, 0.03, 0.28), 0.04, bl, 0.01, C3('#7df9ff'), 1);
  G3.box(M4.t(m, 0, 0.34, 0), 0.015, 0.1, 0.015, C3('#9fb4cc')); G3.box(M4.t(m, 0, 0.46, 0), 0.05, 0.05, 0.05, C3('#ffd23f'), 1);
  G3.glow(M4.t(m, 0, -0.4, 0), 0.14, 0.14, 0.14, C3('#39d0ff'), 0.8);
}

/* ---------------- small objects ---------------- */
function crate3(p) {
  const m = M4.rz(M4.ry(M4.t(ID4, p.x, 0.62, p.z), p.rot || 0), Math.sin(p.hitT * 40) * p.hitT * 0.5), c = C3(p.gold ? '#f2c230' : '#a9753d');
  G3.box(m, 0.62, 0.62, 0.62, c, p.gold ? 0.25 : 0); G3.box(m, 0.64, 0.1, 0.64, C3(p.gold ? '#fff3b0' : '#6e4b22'), p.gold ? 0.6 : 0); G3.box(m, 0.1, 0.64, 0.64, C3(p.gold ? '#fff3b0' : '#6e4b22'), p.gold ? 0.6 : 0);
  if (p.gold) G3.glow(m, 0.9, 0.9, 0.9, C3('#ffd23f'), 0.25);
}
function coin3(x, y, z, t) { G3.box(M4.ry(M4.t(ID4, x, y, z), t * 6), 0.2, 0.2, 0.04, C3('#ffd23f'), 0.75); }
function heart3(x, y, z, t) { const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 5) * 0.08, z), t * 3), c = C3('#ff4d6d'); G3.box(M4.t(m, -0.11, 0.08, 0), 0.13, 0.13, 0.07, c, 0.7); G3.box(M4.t(m, 0.11, 0.08, 0), 0.13, 0.13, 0.07, c, 0.7); G3.box(M4.rz(M4.t(m, 0, -0.06, 0), 0.785), 0.15, 0.15, 0.07, c, 0.7); }
function crystal3(x, y, z, t) {
  const m = M4.rx(M4.rz(M4.ry(M4.t(ID4, x, y + Math.sin(t * 3) * 0.2, z), t * 2), 0.785), 0.62);
  G3.box(m, 0.42, 0.42, 0.42, C3('#7df9ff'), 0.85); G3.glow(m, 0.8, 0.8, 0.8, C3('#39d0ff'), 0.5); G3.aglow(x, 6, z, 0.25, 6, 0.25, C3('#39d0ff'), 0.5);
}
/* glowing ring on the ground that marks a place you can use */
function pad3(x, z, r, col, t, active) {
  const n = 14, c = C3(col);
  for (let i = 0; i < n; i++) { const a = i * TAU / n + t * 0.8; G3.box(M4.ry(M4.t(ID4, x + Math.cos(a) * r, 0.06, z + Math.sin(a) * r), -a), 0.08, 0.05, r * 0.2, c, 1); }
  if (active) G3.aglow(x, 0.3, z, r * 0.8, 0.3, r * 0.8, c, 0.22);
}
