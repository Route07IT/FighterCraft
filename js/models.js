'use strict';
/* ============================================================
   FIGHTER CRAFT - 3D models, built from smooth rounded shapes
   (spheres, capsules, cylinders, cones) and animated by code.
   Facing: a character with yaw 0 looks toward +Z.
   ============================================================ */
const ID4 = M4.id(), WHITE = [1, 1, 1], HPI = Math.PI / 2;
/* rounded shape at an offset inside m */
function ell(m, x, y, z, sx, sy, sz, col, e, M) { G3.mesh(M4.t(m, x, y, z), M || SPL, sx, sy, sz, col, e || 0); }
/* a joint: +rx swings forward (toward +Z), rz swings sideways */
function jnt(m, px, py, pz, rx, rz) { let j = M4.t(m, px, py, pz); if (rz) j = M4.rz(j, rz); if (rx) j = M4.rx(j, -rx); return j; }
/* a rounded limb segment hanging down from joint j */
function seg3(j, len, r, col, e, M) { G3.mesh(M4.t(j, 0, -len / 2, 0), M || SPL, r, len / 2 + r * 0.45, r, col, e || 0); }

/* ---------------- the hero: a normal human figure ---------------- */
function hero3(o) {
  const A = o.armor || [], su = SUITS[o.suit || 0], c1 = C3(su[0]), c2 = C3(su[1]), skin = C3('#f0b68a'), hair = C3('#3a281d'), pants = C3('#27324a'), shoe = C3('#1d2028'), gold = C3('#ffd23f');
  const t = o.t || 0, p = clamp(o.pt || 0, 0, 1), W = o.melee || 'fist', SH = -0.14, k = Math.sin(Math.min(1, p * 1.4) * Math.PI);
  let lean = 0, twist = 0, bob = Math.sin(t * 3) * 0.012, lr = 0.05, ll = -0.05, kr = 0.08, kl = 0.08, ar = 0.1, al = 0.1, er = 0.3, el = 0.3, arz = 0.1, alz = 0.1;
  switch (o.pose) {
    case 'run': { const ph = t * 12; lr = Math.sin(ph) * 0.85; ll = -lr; kr = 0.25 + 0.95 * Math.max(0, Math.cos(ph)); kl = 0.25 + 0.95 * Math.max(0, -Math.cos(ph)); ar = -lr * 0.75; al = lr * 0.75; er = el = 1.25; lean = 0.2; bob = Math.abs(Math.cos(ph)) * 0.06; break; }
    case 'back': { const ph = t * 9; lr = Math.sin(ph) * 0.45; ll = -lr; kr = kl = 0.3; lean = -0.08; break; }
    case 'jump': lr = 0.75; kr = 1.1; ll = -0.25; kl = 0.5; ar = 2.5; al = 2.3; break;
    case 'fall': lr = 0.3; kr = 0.5; ll = -0.35; kl = 0.6; ar = 1.9; al = 1.9; arz = 0.7; alz = 0.7; break;
    case 'hover': lr = 0.2; ll = -0.2; kr = kl = 0.4; ar = 0.4; al = 0.4; arz = 0.5; alz = 0.5; lean = 0.45; break;
    case 'chute': lr = 0.15; ll = -0.1; kr = kl = 0.3; ar = 2.9; al = 2.9; arz = 0.35; alz = 0.35; er = el = 0.2; break;
    case 'climb': { const ph = t * 9, s = Math.sin(ph); ar = 2.3 + s * 0.5; al = 2.3 - s * 0.5; er = el = 0.6; lr = 0.7 + s * 0.4; ll = 0.7 - s * 0.4; kr = kl = 1.1; break; }
    case 'atk1': if (W === 'hammer') { ar = lerp(3.0, 0.5, p); er = 0.2; lean = 0.3 * p; } else if (W === 'sword') { ar = 1.5; er = 0.15; twist = lerp(-1.0, 0.8, p); lean = 0.12; } else { ar = lerp(0.5, 1.6, k); er = lerp(1.6, 0.05, k); al = 0.5; el = 1.6; twist = 0.45 * k; lean = 0.14 * k; } lr = 0.4; ll = -0.4; kr = 0.3; break;
    case 'atk2': if (W === 'hammer') { ar = lerp(3.0, 0.5, p); er = 0.2; lean = 0.3 * p; } else if (W === 'sword') { ar = 1.5; er = 0.15; twist = lerp(0.8, -1.0, p); lean = 0.12; } else { al = lerp(0.5, 1.6, k); el = lerp(1.6, 0.05, k); ar = 0.5; er = 1.6; twist = -0.45 * k; lean = 0.14 * k; } lr = -0.4; ll = 0.4; kl = 0.3; break;
    case 'atk3': if (W === 'hammer') { ar = lerp(3.1, 0.3, p); al = lerp(3.1, 0.3, p); er = el = 0.2; lean = 0.45 * p; bob = 0.5 * k; } else if (W === 'sword') { ar = 1.55; er = 0.1; twist = p * TAU; bob = 0.15 * k; } else { ar = lerp(0.2, 2.7, k); er = lerp(1.4, 0.2, k); lean = 0.1; bob = 0.35 * k; } lr = 0.5; ll = -0.5; kr = 0.4; break;
    case 'kick': lr = 1.5; kr = 0.05; ll = -0.6; kl = 1.0; ar = -0.4; al = 0.8; lean = -0.25; break;
    case 'blast': al = 1.57; el = 0.05; alz = 0; twist = -0.25; lr = 0.3; ll = -0.3; break;
    case 'hurt': lean = -0.45; ar = -0.9; al = -0.9; lr = 0.4; ll = 0.1; kr = kl = 0.4; break;
    case 'win': { const w = Math.sin(t * 8) * 0.2; ar = 2.8 + w; al = 2.8 - w; arz = 0.3; alz = 0.3; er = el = 0.15; bob = Math.abs(Math.sin(t * 6)) * 0.3; break; }
  }
  const m = M4.ry(M4.t(ID4, o.x, o.y + bob, o.z), o.yaw + twist);
  // legs
  for (const s of [-1, 1]) {
    const j1 = jnt(m, s * 0.1, 0.93, 0, s < 0 ? lr : ll, s * 0.03); seg3(j1, 0.44, 0.095, pants, SH);
    const j2 = jnt(j1, 0, -0.44, 0, -(s < 0 ? kr : kl), 0);
    if (A[0]) { seg3(j2, 0.42, 0.108, C3('#b8f0ff'), -0.85); ell(j2, 0, -0.46, 0.06, 0.105, 0.065, 0.175, C3('#dffaff'), -0.85); ell(j2, 0, -0.515, 0.05, 0.09, 0.018, 0.15, C3('#39d0ff'), 1, SPX); }
    else { seg3(j2, 0.42, 0.078, pants, SH); ell(j2, 0, -0.46, 0.06, 0.085, 0.055, 0.15, shoe, -0.35); }
  }
  const up = M4.rx(M4.t(m, 0, 0.95, 0), lean);
  // jet wings (on the back)
  if (A[3]) {
    for (const s of [-1, 1]) { G3.mesh(M4.t(up, s * 0.085, 0.36, -0.18), CYL, 0.065, 0.2, 0.065, C3('#6d7890'), -0.8); G3.box(M4.rz(M4.t(up, s * 0.34, 0.5, -0.2), s * 0.5), 0.26, 0.05, 0.02, C3('#ff8c1a'), -0.5); }
    if (o.jet) { const fl = 0.3 + Math.sin(t * 50) * 0.08; for (const s of [-1, 1]) { G3.gmesh(M4.rx(M4.t(up, s * 0.085, 0.14 - fl, -0.18), Math.PI), CONE, 0.07, fl, 0.07, C3('#ffb347'), 1.5); G3.gmesh(M4.rx(M4.t(up, s * 0.085, 0.14 - fl, -0.18), Math.PI), CONE, 0.13, fl * 1.3, 0.13, C3('#ff5a1a'), 0.5); } }
  }
  // body
  ell(up, 0, 0.03, 0, 0.17, 0.13, 0.12, pants, SH); G3.mesh(M4.t(up, 0, 0.33, 0), SPH, 0.2, 0.27, 0.13, c1, SH);
  ell(up, 0, 0.1, 0, 0.18, 0.035, 0.125, C3('#20242e'), -0.4);
  if (A[2]) { G3.mesh(M4.t(up, 0, 0.36, 0.015), SPH, 0.215, 0.25, 0.155, C3('#c9d6e8'), -0.95); ell(up, 0, 0.4, 0.15, 0.05, 0.05, 0.025, C3('#7df9ff'), 1, SPX); for (const s of [-1, 1]) ell(up, s * 0.235, 0.54, 0, 0.115, 0.085, 0.115, C3('#e4ecf7'), -0.95); }
  else { ell(up, 0, 0.4, 0.122, 0.05, 0.06, 0.014, C3('#ffe14d'), 0.7, SPX); for (const s of [-1, 1]) ell(up, s * 0.2, 0.52, 0, 0.085, 0.075, 0.085, c1, SH); }
  ell(up, 0, 0.62, 0, 0.05, 0.07, 0.05, skin, 0, SPX);
  // head
  const hd = M4.t(up, 0, 0.77, 0);
  G3.mesh(hd, SPH, 0.115, 0.135, 0.125, skin, -0.06);
  if (A[4]) { G3.mesh(M4.t(hd, 0, 0.02, -0.005), SPH, 0.14, 0.152, 0.15, C3('#8f6be0'), -0.9); ell(hd, 0, 0.005, 0.1, 0.105, 0.045, 0.065, C3('#7df9ff'), 0.9); G3.box(M4.t(hd, 0, 0.175, -0.03), 0.012, 0.045, 0.12, gold, 0.4); }
  else {
    ell(hd, 0, 0.05, -0.03, 0.122, 0.105, 0.132, hair, -0.3);
    for (const s of [-1, 1]) { ell(hd, s * 0.042, 0.012, 0.112, 0.02, 0.024, 0.012, WHITE, 0, SPX); ell(hd, s * 0.042, 0.012, 0.121, 0.011, 0.014, 0.006, C3('#2a1a12'), 0, SPX); ell(hd, s * 0.114, 0, 0, 0.02, 0.03, 0.02, skin, 0, SPX); }
    ell(hd, 0, -0.058, 0.113, 0.028, 0.008, 0.008, C3('#a8553c'), 0, SPX);
  }
  // arms (the hero's right arm is on -X and holds the weapon)
  const arm = (s, a, e, z) => {
    const j1 = jnt(up, s * 0.255, 0.52, 0, a, s * z); seg3(j1, 0.27, 0.062, c1, SH);
    const j2 = jnt(j1, 0, -0.27, 0, e, 0);
    if (A[1]) { seg3(j2, 0.25, 0.078, gold, -0.9); ell(j2, 0, -0.3, 0, 0.07, 0.075, 0.065, C3('#ffe680'), -0.9); } else { seg3(j2, 0.25, 0.052, c2, SH); ell(j2, 0, -0.29, 0, 0.05, 0.06, 0.045, skin, 0, SPX); }
    return j2;
  };
  const ra = arm(-1, ar, er, arz), la = arm(1, al, el, alz), atk = o.pose && o.pose.startsWith('atk');
  if (W === 'sword') {
    const w = M4.rx(M4.t(ra, 0, -0.3, 0), -1.25);
    G3.box(M4.t(w, 0, -0.78, 0), 0.05, 0.66, 0.014, C3('#e6fbff'), 0.5); G3.mesh(M4.rz(M4.t(w, 0, -0.1, 0), HPI), CYX, 0.03, 0.16, 0.03, gold, -0.9); G3.mesh(M4.t(w, 0, 0.04, 0), CYX, 0.028, 0.1, 0.028, hair, 0);
    if (atk) G3.glow(M4.t(w, 0, -0.78, 0), 0.12, 0.7, 0.05, C3('#39d0ff'), 0.7);
  } else if (W === 'hammer') {
    const w = M4.rx(M4.t(ra, 0, -0.3, 0), -1.1);
    G3.mesh(M4.t(w, 0, -0.5, 0), CYX, 0.035, 0.62, 0.035, C3('#6b4a2b'), 0); G3.mesh(M4.rx(M4.t(w, 0, -1.14, 0), HPI), CYL, 0.2, 0.34, 0.2, C3('#9aa4b8'), -0.9); G3.mesh(M4.rx(M4.t(w, 0, -1.14, 0), HPI), CYL, 0.215, 0.07, 0.215, gold, 0.5);
    if (atk) G3.gmesh(M4.t(w, 0, -1.14, 0), SPX, 0.45, 0.45, 0.55, gold, 0.5);
  }
  const R = o.ranged || 'blaster';
  if (R === 'rocket') { G3.mesh(M4.rx(M4.t(up, 0.27, 0.66, 0.05), HPI), CYL, 0.085, 0.42, 0.085, C3('#3f5a3a'), -0.5); G3.mesh(M4.rx(M4.t(up, 0.27, 0.66, 0.48), HPI), CONE, 0.07, 0.08, 0.07, C3('#ff5a36'), 0.8); }
  else { G3.mesh(M4.t(la, R === 'tri' ? 0.03 : 0, -0.14, 0.085), CYX, R === 'tri' ? 0.075 : 0.045, 0.14, 0.045, C3('#2b3242'), -0.7); ell(la, 0, -0.29, 0.085, R === 'tri' ? 0.07 : 0.04, 0.02, 0.04, C3('#7df9ff'), 1, SPX); }
  if (o.pose === 'blast') G3.gmesh(M4.t(la, 0, -0.42, 0.06), SPX, 0.24, 0.24, 0.24, C3('#39d0ff'), 1.2);
  if (o.chute) { // parachute
    G3.mesh(M4.t(m, 0, 4.6, 0), SPH, 2.1, 1.05, 2.1, c1, -0.2); G3.mesh(M4.t(m, 0, 4.25, 0), CYL, 2.12, 0.1, 2.12, WHITE, 0);
    for (const s of [-1, 1]) for (const q of [-1, 1]) { const dx = s * 1.45, dz = q * 1.45, len = Math.hypot(dx, 2.7, dz) / 2; G3.box(M4.rx(M4.rz(M4.t(m, dx / 2 + s * 0.12, 2.85, dz / 2), -Math.atan2(dx, 2.7)), Math.atan2(dz, 2.7)), 0.008, len, 0.008, WHITE, 0); }
  }
}

/* ---------------- robots ---------------- */
const LOOK3 = {
  scrapper: { s: 0.86, bw: 0.4, bh: 0.42, leg: 0.5, hw: 0.29, arm: 1.1, aw: 0.1, c: '#93a1b8', d: '#465066', eye: '#ff8a36', ant: 1 },
  zapper: { s: 1.0, bw: 0.26, bh: 0.5, leg: 0.6, hw: 0.25, arm: 1.0, aw: 0.075, c: '#8275e0', d: '#3d357a', eye: '#7df9ff', coil: 1 },
  brute: { s: 1.35, bw: 0.62, bh: 0.5, leg: 0.42, hw: 0.3, arm: 1.3, aw: 0.2, c: '#c0623a', d: '#5e2a14', eye: '#ffcf33' },
  crusher: { s: 1.9, bw: 0.64, bh: 0.52, leg: 0.45, hw: 0.34, arm: 1.5, aw: 0.22, c: '#c8402f', d: '#641e16', eye: '#ffe14d', horn: 1, core: '#ffe14d' },
  viper: { s: 1.75, bw: 0.4, bh: 0.62, leg: 0.62, hw: 0.32, arm: 1.5, aw: 0.12, c: '#9a4fbc', d: '#4a235a', eye: '#7dffb0', coil: 1, core: '#7dffb0' },
  furnace: { s: 2.0, bw: 0.68, bh: 0.52, leg: 0.42, hw: 0.3, arm: 1.5, aw: 0.24, c: '#75828f', d: '#1c2833', eye: '#ff7b00', stack: 1, core: '#ff7b00' },
  corex: { s: 2.25, bw: 0.56, bh: 0.62, leg: 0.55, hw: 0.36, arm: 1.6, aw: 0.18, c: '#343c54', d: '#0c0e16', eye: '#ff2244', horn: 1, crown: 1, core: '#ff2244' }
};
function bot3(e, L) {
  const s = L.s, f = e.flash > 0, pal = e.pal, base = pal ? C3('#eef4ff') : C3(L.c), col = f ? WHITE : base, dk = f ? WHITE : pal ? C3('#3a78d8') : C3(L.d), lt = f ? WHITE : mixC(base, WHITE, 0.35), t = e.t, MT = f ? 0 : -0.65;
  const walk = e.moving ? Math.sin(t * 8) : 0, st = e.state;
  let aF = walk * 0.5, aB = -walk * 0.5, lean = 0;
  if (st === 'wind') { const q = clamp(1 - e.st / (e.windT || 1), 0, 1); aF = 2.9 * q; aB = e.boss ? 2.9 * q : aB; lean = -0.15 * q; }
  else if (st === 'swing') { aF = 0.9; aB = e.boss ? 0.9 : aB; lean = 0.35; }
  else if (st === 'stun' || st === 'dizzy') { lean = -0.2 + Math.sin(t * 5) * 0.08; aF = -0.3; aB = -0.2; }
  else if (st === 'charge') { lean = 0.45; aF = 1.4; aB = 1.4; }
  else if (st === 'air') { aF = 2.9; aB = 2.9; }
  else if (st === 'cast' || st === 'laser') { aF = 1.57; aB = 1.57; lean = -0.05; }
  else if (st === 'cheer') { aF = 2.8 + Math.sin(t * 10) * 0.3; aB = 2.8 - Math.sin(t * 10) * 0.3; }
  const hot = !pal && (st === 'wind' || st === 'charge' || st === 'cast' || st === 'laser'), eye = f ? WHITE : C3(hot ? '#ff2a1a' : pal ? '#5dff9a' : L.eye);
  const m = M4.ry(M4.t(ID4, e.x, e.y, e.z), e.yaw), hip = L.leg * 2 * s, lr = L.aw * 1.15 * s;
  for (const sd of [-1, 1]) {
    const j = jnt(m, sd * L.bw * 0.5 * s, hip, 0, sd * walk * 0.5, 0);
    G3.mesh(M4.t(j, 0, -L.leg * s, 0), CYX, lr, L.leg * s * 0.92, lr, dk, MT); ell(j, 0, -L.leg * s, 0, lr * 1.25, lr * 1.25, lr * 1.25, lt, MT, SPX);
    ell(j, 0, -L.leg * 1.9 * s, lr * 0.6, lr * 1.5, L.leg * 0.2 * s, lr * 2.2, dk, MT, SPX);
  }
  const up = M4.rx(M4.t(m, 0, hip, 0), lean), bw = L.bw * s, bh = L.bh * s, bd = L.bw * 0.72 * s;
  G3.mesh(M4.t(up, 0, bh, 0), SPL, bw, bh * 1.08, bd, col, MT);
  G3.mesh(M4.t(up, 0, bh * 0.35, 0), CYX, bw * 0.8, bh * 0.14, bd * 0.8, dk, MT);
  if (!f) {
    const cc = C3(pal ? '#5dff9a' : L.core || L.eye);
    ell(up, 0, bh * 1.2, bd * 0.86, bw * 0.26, bw * 0.26, bd * 0.2, cc, 1, SPX);
    if (L.core || pal) G3.gmesh(M4.t(up, 0, bh * 1.2, bd), SPX, bw * 0.5, bw * 0.5, bw * 0.3, cc, 0.4 + Math.sin(t * 6) * 0.18);
    if (pal) G3.mesh(M4.t(up, 0, bh * 2 - 0.03 * s, 0), CYX, L.hw * s * 0.8, 0.055 * s, L.hw * s * 0.8, C3(SUITS[S.suit][0]), -0.2); // a scarf in the hero's colour
  }
  if (L.stack) for (const sd of [-1, 1]) G3.mesh(M4.t(up, sd * bw * 0.6, bh * 2 + 0.3 * s, -bd * 0.3), CYX, 0.13 * s, 0.4 * s, 0.13 * s, dk, MT);
  const hy = bh * 2 + L.hw * 0.75 * s, hw = L.hw * s, hd = M4.t(up, 0, hy, 0);
  G3.mesh(M4.t(up, 0, bh * 2, 0), CYX, hw * 0.4, hw * 0.3, hw * 0.4, dk, MT);
  G3.mesh(hd, SPL, hw, hw * 0.82, hw, lt, MT);
  ell(hd, 0, 0.02 * s, hw * 0.74, hw * 0.74, hw * 0.24, hw * 0.34, eye, 1, SPX);
  if (hot && !f) G3.gmesh(M4.t(hd, 0, 0.02 * s, hw), SPX, hw, hw * 0.55, hw * 0.5, C3('#ff2a1a'), 0.8);
  if (L.ant) { G3.mesh(M4.t(hd, -hw * 0.4, hw * 1.2, 0), CYX, 0.018, hw * 0.5, 0.018, dk, 0); ell(hd, -hw * 0.4, hw * 1.75, 0, 0.06, 0.06, 0.06, C3(pal ? '#5dff9a' : '#ff5a36'), 1, SPX); }
  if (L.coil) { G3.mesh(M4.t(hd, 0, hw * 1.3, 0), CYX, 0.035 * s, hw * 0.6, 0.035 * s, C3('#cfd8e6'), MT); for (let i = 0; i < 3; i++) G3.mesh(M4.t(hd, 0, hw * (1.0 + i * 0.3), 0), CYX, (0.16 - i * 0.03) * s, 0.02 * s, (0.16 - i * 0.03) * s, C3('#cfd8e6'), MT); ell(hd, 0, hw * 2, 0, 0.11 * s, 0.11 * s, 0.11 * s, C3('#7df9ff'), 1, SPX); if (hot) G3.gmesh(M4.t(hd, 0, hw * 2, 0), SPX, 0.4 * s, 0.4 * s, 0.4 * s, C3('#7df9ff'), 0.9); }
  if (L.horn) for (const sd of [-1, 1]) G3.mesh(M4.rz(M4.t(hd, sd * hw * 1.0, hw * 0.9, 0), -sd * 0.6), CONE, 0.09 * s, hw * 0.8, 0.09 * s, C3('#f3e9d2'), -0.4);
  if (L.crown) for (let i = -2; i <= 2; i++) G3.mesh(M4.t(hd, i * hw * 0.34, hw * 1.0, Math.abs(i) === 2 ? -hw * 0.3 : 0), CONE, hw * 0.13, hw * 0.3, hw * 0.13, C3('#ffd23f'), 0.5);
  const ah = L.arm * 0.5 * s, aw = L.aw * s;
  for (const sd of [-1, 1]) {
    const j = jnt(up, sd * (bw + aw * 0.8), bh * 1.75, 0, sd < 0 ? aF : aB, sd * 0.08);
    ell(j, 0, 0, 0, aw * 1.7, aw * 1.7, aw * 1.7, lt, MT, SPX); G3.mesh(M4.t(j, 0, -ah, 0), CYX, aw, ah, aw, sd < 0 ? col : dk, MT); ell(j, 0, -ah * 2, 0, aw * 1.8, aw * 1.8, aw * 1.8, lt, MT, SPX);
    if (hot && !f && (sd < 0 || e.boss)) G3.gmesh(M4.t(j, 0, -ah * 2, 0), SPX, aw * 3, aw * 3, aw * 3, C3('#ff3322'), 0.7);
  }
}
function roller3(e) {
  const f = e.flash > 0, pal = e.pal, hot = !pal && (e.state === 'wind' || e.state === 'roll'), g1 = f ? WHITE : pal ? C3('#eef4ff') : C3('#2fa37a'), g2 = f ? WHITE : pal ? C3('#3a78d8') : C3('#14523d');
  const sh = e.state === 'wind' ? Math.sin(e.t * 60) * 0.03 : 0, m = M4.ry(M4.t(ID4, e.x + sh, e.y + 0.72, e.z), e.yaw), w = M4.rx(m, e.spin || 0), ec = C3(hot ? '#ff2a1a' : pal ? '#5dff9a' : '#ffe14d');
  G3.mesh(m, SPH, 0.7, 0.7, 0.7, g1, f ? 0 : -0.7); G3.mesh(M4.rz(m, HPI), CYL, 0.73, 0.13, 0.73, g2, f ? 0 : -0.5);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; if (e.state === 'roll') G3.mesh(M4.rx(M4.t(w, 0, Math.cos(a) * 0.74, Math.sin(a) * 0.74), a), CONE, 0.09, 0.2, 0.09, C3('#e8edf5'), -0.6); else ell(w, 0, Math.cos(a) * 0.73, Math.sin(a) * 0.73, 0.14, 0.05, 0.05, ec, 0.8, SPX); }
  for (const s of [-1, 1]) ell(m, s * 0.66, 0, 0, 0.08, 0.24, 0.24, ec, 1, SPX);
  ell(m, 0, 0.8, 0, 0.24, 0.16, 0.24, f ? WHITE : pal ? C3('#eef4ff') : C3('#9be7c4'), -0.6); ell(m, 0, 0.82, 0.18, 0.15, 0.055, 0.08, ec, 1, SPX);
  if (hot && !f) G3.gmesh(m, SPX, 1, 1, 1, C3('#ff2a1a'), 0.25);
}
function drone3(e, big) {
  const f = e.flash > 0, pal = e.pal, s = big ? 2.5 : 1, hot = !pal && (e.state === 'wind' || e.state === 'charge' || e.state === 'cast'), dz = e.state === 'dizzy';
  const c = f ? WHITE : pal ? C3('#eef4ff') : C3(big ? '#4a80c0' : '#98a2b6'), d = f ? WHITE : pal ? C3('#3a78d8') : C3('#2b3242'), MT = f ? 0 : -0.7;
  let m = M4.ry(M4.t(ID4, e.x, e.y + 0.35 * s + (dz ? 0 : Math.sin(e.t * 4) * 0.06), e.z), e.yaw);
  if (e.state === 'charge') m = M4.rx(m, 0.4); if (dz) m = M4.rz(m, Math.sin(e.t * 5) * 0.15);
  G3.mesh(m, SPL, 0.64 * s, 0.2 * s, 0.64 * s, c, MT); ell(m, 0, 0.16 * s, 0, 0.32 * s, 0.2 * s, 0.32 * s, d, MT);
  const ec = C3(hot ? '#ff2a1a' : pal ? '#5dff9a' : big ? '#ffe14d' : '#ff5a36');
  ell(m, 0, 0.03 * s, 0.56 * s, 0.2 * s, 0.07 * s, 0.1 * s, ec, 1, SPX); ell(m, 0, -0.17 * s, 0, 0.13 * s, 0.05 * s, 0.13 * s, C3(hot ? '#ff2a1a' : '#39d0ff'), 1, SPX);
  if (hot && !f) G3.gmesh(M4.t(m, 0, -0.3 * s, 0), SPX, 0.4 * s, 0.25 * s, 0.4 * s, C3('#ff2a1a'), 0.8);
  for (let i = 0; i < 4; i++) { const rx = (i & 1 ? 1 : -1) * 0.62 * s, rz = (i & 2 ? 1 : -1) * 0.62 * s; G3.mesh(M4.t(m, rx, 0.14 * s, rz), CYX, 0.04 * s, 0.1 * s, 0.04 * s, d, MT); if (!dz) G3.mesh(M4.t(m, rx, 0.26 * s, rz), CYX, 0.34 * s, 0.012, 0.34 * s, C3('#dfe6f0'), 0.25); }
  if (big) { for (const sd of [-1, 1]) G3.box(M4.rz(M4.t(m, sd * 1.0 * s, 0.05 * s, -0.1 * s), sd * 0.25), 0.5 * s, 0.04 * s, 0.3 * s, C3('#2c4f7a'), MT); G3.mesh(M4.rx(M4.t(m, 0, -0.02 * s, 0.85 * s), HPI), CONE, 0.1 * s, 0.25 * s, 0.1 * s, C3('#ffd23f'), -0.6); }
}
function enemy3(e) {
  if (e.kind === 'roller') roller3(e); else if (e.kind === 'drone') drone3(e, false); else if (e.look === 'warden') drone3(e, true); else bot3(e, LOOK3[e.look || e.kind]);
}
/* a friendly citizen (they come back when a district is saved) */
function citizen3(c, t) {
  const w = c.moving ? Math.sin(t * 9 + c.ph) * 0.7 : 0, m = M4.ry(M4.t(ID4, c.x, 0, c.z), c.yaw), s = c.s;
  for (const sd of [-1, 1]) { const j = jnt(m, sd * 0.09 * s, 0.86 * s, 0, sd * w, 0); G3.mesh(M4.t(j, 0, -0.42 * s, 0), SPX, 0.085 * s, 0.45 * s, 0.085 * s, c.c2, 0); }
  G3.mesh(M4.t(m, 0, 1.15 * s, 0), SPX, 0.19 * s, 0.32 * s, 0.13 * s, c.c1, -0.1); G3.mesh(M4.t(m, 0, 1.6 * s, 0), SPX, 0.115 * s, 0.13 * s, 0.12 * s, c.skin, 0); G3.mesh(M4.t(m, 0, 1.65 * s, -0.025 * s), SPX, 0.122 * s, 0.1 * s, 0.128 * s, c.hair, 0);
  for (const sd of [-1, 1]) { const j = jnt(m, sd * 0.24 * s, 1.38 * s, 0, c.cheer ? 2.8 + Math.sin(t * 10 + c.ph) * 0.3 : -sd * w, sd * 0.08); G3.mesh(M4.t(j, 0, -0.27 * s, 0), SPX, 0.055 * s, 0.29 * s, 0.055 * s, c.c1, 0); }
}
/* BOLT the helper drone */
function bolt3(x, y, z, t, yaw) {
  const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 2.4) * 0.12, z), yaw);
  G3.mesh(m, SPL, 0.27, 0.25, 0.27, C3('#f4f8ff'), -0.8); ell(m, 0, 0.02, 0.2, 0.2, 0.12, 0.09, C3('#1d2a3a'), -0.9, SPX);
  const bl = (t % 3.5) < 0.12 ? 0.008 : 0.045; for (const s of [-1, 1]) { ell(m, s * 0.08, 0.03, 0.275, 0.035, bl, 0.02, C3('#7df9ff'), 1, SPX); ell(m, s * 0.27, 0, 0, 0.04, 0.07, 0.07, C3('#9fb4cc'), -0.6, SPX); }
  G3.mesh(M4.t(m, 0, 0.33, 0), CYX, 0.012, 0.1, 0.012, C3('#9fb4cc'), 0); ell(m, 0, 0.45, 0, 0.05, 0.05, 0.05, C3('#ffd23f'), 1, SPX);
  G3.gmesh(M4.t(m, 0, -0.4, 0), SPX, 0.16, 0.16, 0.16, C3('#39d0ff'), 0.8);
}

/* ---------------- small objects ---------------- */
function crate3(p) { // a coin barrel
  const m = M4.rz(M4.ry(M4.t(ID4, p.x, (p.y || 0) + 0.62, p.z), p.rot || 0), Math.sin(p.hitT * 40) * p.hitT * 0.5), g = p.gold;
  G3.mesh(m, CYL, 0.52, 0.62, 0.52, C3(g ? '#f2c230' : '#a36f3a'), g ? 0.25 : -0.15);
  for (const y of [-0.38, 0.38]) G3.mesh(M4.t(m, 0, y, 0), CYL, 0.545, 0.05, 0.545, C3(g ? '#fff3b0' : '#5a5f6b'), g ? 0.6 : -0.6);
  ell(m, 0, 0.63, 0, 0.3, 0.03, 0.3, C3('#ffd23f'), 0.8, SPX);
  if (g) G3.gmesh(m, SPX, 0.95, 0.95, 0.95, C3('#ffd23f'), 0.22);
}
function coin3(x, y, z, t) { G3.mesh(M4.rx(M4.ry(M4.t(ID4, x, y, z), t * 6), HPI), CYX, 0.2, 0.035, 0.2, C3('#ffd23f'), 0.75); }
function heart3(x, y, z, t) { const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 5) * 0.08, z), t * 3), c = C3('#ff4d6d'); ell(m, -0.1, 0.07, 0, 0.13, 0.13, 0.08, c, 0.7, SPX); ell(m, 0.1, 0.07, 0, 0.13, 0.13, 0.08, c, 0.7, SPX); G3.mesh(M4.rx(M4.t(m, 0, -0.1, 0), Math.PI), CONE, 0.2, 0.16, 0.08, c, 0.7); }
function core3(x, y, z, t) { const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 4) * 0.08, z), t * 4); ell(m, 0, 0, 0, 0.16, 0.16, 0.16, C3('#5dff9a'), 0.9, SPX); G3.mesh(M4.rz(m, 0.5), CYX, 0.26, 0.02, 0.26, C3('#eef4ff'), 0.6); G3.gmesh(m, SPX, 0.4, 0.4, 0.4, C3('#5dff9a'), 0.5); }
function crystal3(x, y, z, t) {
  const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 3) * 0.2, z), t * 2), c = C3('#7df9ff');
  G3.mesh(M4.t(m, 0, 0.42, 0), CONE, 0.36, 0.42, 0.36, c, 0.85); G3.mesh(M4.rx(M4.t(m, 0, -0.42, 0), Math.PI), CONE, 0.36, 0.42, 0.36, c, 0.7);
  G3.gmesh(m, SPX, 0.9, 1.1, 0.9, C3('#39d0ff'), 0.45); G3.aglow(x, 6, z, 0.22, 6, 0.22, C3('#39d0ff'), 0.5);
}
/* glowing ring on the ground that marks a place you can use */
function pad3(x, z, r, col, t, active) {
  const n = 16, c = C3(col);
  for (let i = 0; i < n; i++) { const a = i * TAU / n + t * 0.8; G3.amesh(x + Math.cos(a) * r, 0.07, z + Math.sin(a) * r, SPT, 0.2, 0.05, 0.2, c, 1); }
  if (active) G3.agmesh(x, 0.3, z, CYL, r * 0.9, 0.3, r * 0.9, c, 0.2);
}
function tree3(x, z, s, pine) {
  G3.amesh(x, 1.1 * s, z, CYX, 0.17 * s, 1.1 * s, 0.17 * s, C3('#6b4a2b'), 0);
  if (pine) { G3.amesh(x, 3.0 * s, z, CONE, 1.15 * s, 1.3 * s, 1.15 * s, C3('#2f8a4a'), 0); G3.amesh(x, 4.3 * s, z, CONE, 0.8 * s, 1.0 * s, 0.8 * s, C3('#3fa85a'), 0); }
  else { G3.amesh(x, 3.0 * s, z, SPL, 1.25 * s, 1.1 * s, 1.25 * s, C3('#3fa85a'), 0); G3.amesh(x + 0.5 * s, 3.7 * s, z - 0.3 * s, SPX, 0.8 * s, 0.75 * s, 0.8 * s, C3('#58c773'), 0); G3.amesh(x - 0.55 * s, 3.5 * s, z + 0.35 * s, SPX, 0.7 * s, 0.65 * s, 0.7 * s, C3('#4bb865'), 0); }
}

/* ---------------- vehicles ---------------- */
function car3(m, col, spin, lights, lo) {
  const M = lo ? SPX : SPL, glass = C3('#16202e'), tire = C3('#16181d');
  G3.mesh(M4.t(m, 0, 0.56, 0), lo ? SPL : SPH, 0.98, 0.37, 2.2, col, -0.85); G3.mesh(M4.t(m, 0, 0.98, -0.2), M, 0.78, 0.36, 1.05, glass, -0.95);
  G3.mesh(M4.t(m, 0, 0.42, 0), CYX, 0.9, 0.06, 2.0, mulC(col, 0.5), 0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = M4.rx(M4.rz(M4.t(m, sx * 0.9, 0.36, sz * 1.3), HPI), spin || 0); G3.mesh(w, lo ? CYX : CYL, 0.36, 0.13, 0.36, tire, 0); if (!lo) G3.mesh(w, CYX, 0.18, 0.145, 0.18, C3('#c9ced6'), -0.8); }
  for (const sx of [-1, 1]) { ell(m, sx * 0.56, 0.62, 2.08, 0.17, 0.09, 0.08, C3('#fff6c9'), lights ? 1 : 0.25, SPX); ell(m, sx * 0.6, 0.64, -2.1, 0.16, 0.07, 0.06, C3('#ff3b2f'), lights ? 0.9 : 0.2, SPX); }
  if (!lo) { G3.box(M4.t(m, 0, 1.02, -2.0), 0.82, 0.025, 0.15, mulC(col, 0.7), -0.6); for (const sx of [-1, 1]) G3.box(M4.t(m, sx * 0.6, 0.9, -2.0), 0.03, 0.12, 0.05, mulC(col, 0.7), 0); }
}
function heli3(m, t, on, col) {
  G3.mesh(M4.t(m, 0, 1.55, 0), SPH, 0.98, 1.0, 2.0, col, -0.85); G3.mesh(M4.t(m, 0, 1.68, 1.15), SPL, 0.82, 0.76, 1.0, C3('#16202e'), -0.95);
  G3.mesh(M4.rx(M4.t(m, 0, 1.8, -3.1), -HPI), TAPER, 0.32, 1.6, 0.32, col, -0.85);
  G3.box(M4.t(m, 0, 2.35, -4.5), 0.04, 0.55, 0.32, C3('#f4f8ff'), -0.6); G3.mesh(M4.rz(M4.t(m, 0.12, 2.2, -4.55), HPI), CYX, 0.5, 0.015, 0.5, C3('#dfe6f0'), on ? 0.3 : 0);
  G3.mesh(M4.t(m, 0, 2.75, 0), CYX, 0.09, 0.25, 0.09, C3('#3a3f4d'), -0.6);
  const r = M4.ry(M4.t(m, 0, 3.02, 0), on ? t * 30 : 0.4); G3.box(r, 3.7, 0.025, 0.16, C3('#23262e'), 0); G3.box(M4.ry(r, HPI), 3.7, 0.025, 0.16, C3('#23262e'), 0);
  if (on) G3.gmesh(M4.t(m, 0, 3.03, 0), CYL, 3.7, 0.01, 3.7, C3('#cfe4ff'), 0.07);
  for (const sx of [-1, 1]) { G3.mesh(M4.rx(M4.t(m, sx * 0.82, 0.12, 0.2), HPI), CYX, 0.06, 1.5, 0.06, C3('#3a3f4d'), -0.6); for (const sz of [-0.6, 0.9]) G3.box(M4.rz(M4.t(m, sx * 0.72, 0.42, sz), sx * 0.3), 0.03, 0.34, 0.03, C3('#3a3f4d'), 0); G3.mesh(M4.rx(M4.t(m, sx * 1.05, 1.1, 0.3), HPI), CYX, 0.11, 0.5, 0.11, C3('#5a6272'), -0.7); }
  ell(m, 0, 1.2, 2.0, 0.12, 0.1, 0.06, C3('#fff6c9'), 1, SPX);
}
function jet3(m, t, burn, gear, col) {
  const grey = C3('#aab4c4'), dark = C3('#4a5262');
  G3.mesh(m, SPH, 0.78, 0.66, 4.2, grey, -0.9); G3.mesh(M4.rx(M4.t(m, 0, -0.02, 4.7), HPI), CONE, 0.42, 1.3, 0.36, dark, -0.8);
  G3.mesh(M4.t(m, 0, 0.5, 1.4), SPL, 0.43, 0.42, 1.15, C3('#16202e'), -0.95);
  for (const s of [-1, 1]) {
    G3.box(M4.ry(M4.t(m, s * 2.25, -0.05, -0.7), -s * 0.45), 2.25, 0.06, 0.95, grey, -0.8); G3.box(M4.ry(M4.t(m, s * 4.0, -0.03, -1.65), -s * 0.45), 0.4, 0.07, 0.6, col, -0.8);
    G3.box(M4.t(m, s * 1.15, 0, -3.7), 1.1, 0.05, 0.5, grey, -0.8); G3.box(M4.rz(M4.t(m, s * 0.5, 0.85, -3.5), -s * 0.3), 0.05, 0.8, 0.6, col, -0.8);
    G3.mesh(M4.rx(M4.t(m, s * 0.36, -0.02, -3.95), HPI), CYL, 0.33, 0.5, 0.33, dark, -0.7);
    G3.mesh(M4.rx(M4.t(m, s * 2.3, -0.28, -0.4), HPI), CYX, 0.09, 0.75, 0.09, C3('#f4f8ff'), -0.7); G3.mesh(M4.rx(M4.t(m, s * 2.3, -0.28, 0.5), HPI), CONE, 0.09, 0.18, 0.09, C3('#ff3b2f'), 0.4);
    if (burn > 0) { const fl = 0.8 + burn * 2 + Math.sin(t * 60 + s) * 0.2; G3.gmesh(M4.rx(M4.t(m, s * 0.36, -0.02, -4.45 - fl), -HPI), CONE, 0.26, fl, 0.26, C3('#ffb347'), 1.3); G3.gmesh(M4.rx(M4.t(m, s * 0.36, -0.02, -4.45 - fl * 0.5), -HPI), CONE, 0.16, fl * 0.5, 0.16, C3('#bfe9ff'), 1.2); }
  }
  if (gear) for (const [x, z] of [[0, 2.6], [-1.0, -0.9], [1.0, -0.9]]) { G3.mesh(M4.t(m, x, -0.85, z), CYX, 0.04, 0.38, 0.04, dark, 0); G3.mesh(M4.rz(M4.t(m, x, -1.07, z), HPI), CYX, 0.2, 0.08, 0.2, C3('#16181d'), 0); }
}
/* a robot base: walls, signal tower, turrets and a force field */
function base3(b, t) {
  const x = b.x, z = b.z, dk = C3('#23262f'), md = C3('#3a3f4d'), red = C3('#ff2a1a'), hit = b.flash > 0;
  for (const s of [-1, 1]) { G3.abox(x + s * 12, 1.6, z, 0.6, 1.6, 12.6, dk, -0.3); G3.abox(x, 1.6, z + s * 12, 12.6, 1.6, 0.6, dk, -0.3); G3.abox(x + s * 12, 3.3, z, 0.65, 0.1, 12.65, red, 0.8); G3.abox(x, 3.3, z + s * 12, 12.65, 0.1, 0.65, red, 0.8); }
  G3.amesh(x, 8, z, TAPER, 2.6, 8, 2.6, hit ? WHITE : md, -0.6); G3.amesh(x, 16.4, z, CYL, 1.9, 0.5, 1.9, dk, -0.6);
  for (let y = 4; y < 16; y += 4) G3.amesh(x, y, z, CYL, 2.75 - y * 0.075, 0.18, 2.75 - y * 0.075, red, 1);
  G3.amesh(x, 19.5, z, CYX, 0.14, 2.7, 0.14, md, 0); G3.amesh(x, 22.4, z, SPX, 0.55, 0.55, 0.55, red, 1); G3.agmesh(x, 22.4, z, SPX, 1.6 + Math.sin(t * 5) * 0.5, 1.6, 1.6, red, 0.6);
  G3.mesh(M4.rx(M4.ry(M4.t(ID4, x, 17.6, z), t * 0.6), 0.9), SPL, 1.7, 0.35, 1.7, C3('#aab4c4'), -0.8);
  for (const u of b.turrets) { G3.amesh(u.x, 3.9, u.z, SPL, 1.1, 0.9, 1.1, md, -0.7); const m = M4.rx(M4.ry(M4.t(ID4, u.x, 4.2, u.z), u.yaw), -u.pitch); G3.mesh(M4.rx(M4.t(m, 0, 0, 1.0), HPI), CYX, 0.2, 1.0, 0.2, dk, -0.7); ell(m, 0, 0, 2.0, 0.2, 0.2, 0.1, red, 1, SPX); }
  G3.agmesh(x, 6, z, SPL, 17.5, 13, 17.5, red, 0.028 + (hit ? 0.16 : 0) + Math.sin(t * 2) * 0.008);
}
