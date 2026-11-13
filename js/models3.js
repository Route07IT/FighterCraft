'use strict';
/* ============================================================
   FIGHTER CRAFT - shaped models. Bodies are "lofts": a skin over
   rings, so people have real shoulders, chests, waists, thighs,
   calves and jaws instead of balls. Robots use rounded-box lofts
   so they look machined. Animals are built from one data table.
   (Loaded after models.js / models2.js and replaces their versions.)
   ============================================================ */
const B2 = (rings, pow) => [mkLoft(rings, 14, pow || 2), mkLoft(rings, 7, pow || 2)]; // [close-up, far away]
const BODY = {
  torso: B2([[-0.10, .10, .09], [-0.04, .165, .115], [0.04, .172, .118], [0.14, .148, .104], [0.26, .165, .112], [0.36, .19, .125, 0, .008], [0.46, .2, .122, 0, .01], [0.53, .19, .1], [0.585, .1, .078], [0.62, .058, .058], [0.69, .054, .056]]),
  hips: B2([[-0.105, .105, .095], [-0.04, .17, .12], [0.04, .177, .123], [0.085, .165, .116]]),
  vest: B2([[0.19, .17, .118], [0.3, .188, .132, 0, .01], [0.4, .208, .138, 0, .013], [0.5, .212, .13, 0, .01], [0.56, .2, .108]]),
  head: B2([[-0.125, .03, .035, 0, .02], [-0.095, .066, .076, 0, .012], [-0.05, .088, .098, 0, .005], [0, .097, .108], [0.05, .098, .112, 0, -.004], [0.095, .086, .1, 0, -.006], [0.125, .056, .07, 0, -.006], [0.14, .02, .03]]),
  hair: B2([[-0.01, .101, .113, 0, -.022], [0.05, .104, .119, 0, -.014], [0.1, .094, .109, 0, -.01], [0.136, .064, .078, 0, -.008], [0.152, .02, .03, 0, -.008]]),
  thigh: B2([[0.03, .08, .09], [-0.05, .092, .1], [-0.2, .08, .088], [-0.36, .062, .068], [-0.45, .056, .06]]),
  calf: B2([[0.03, .054, .057], [-0.1, .064, .07, 0, -.012], [-0.24, .05, .052, 0, -.006], [-0.38, .04, .042], [-0.44, .042, .046]]),
  uarm: B2([[0.035, .05, .055], [-0.03, .062, .066], [-0.14, .052, .056], [-0.26, .042, .045], [-0.3, .04, .042]]),
  farm: B2([[0.025, .041, .043], [-0.07, .047, .05], [-0.2, .036, .037], [-0.27, .03, .032]]),
  foot: B2([[0.01, .045, .05], [-0.03, .05, .09, 0, .035], [-0.075, .052, .125, 0, .05], [-0.1, .05, .125, 0, .05]]),
  hand: B2([[0.005, .028, .03], [-0.04, .042, .024], [-0.09, .04, .02], [-0.125, .022, .014]])
};
/* one person. m = root matrix at the feet, P = joint angles, C = colours, A = armor pieces, lod 0 = close-up */
function human3(m, P, C, A, lod, s) {
  const SH = -0.12, dark = C3('#20242e'), part = (mm, k, col, e, f) => G3.mesh(mm, BODY[k][lod], s * (f || 1), s, s * (f || 1), col, e == null ? SH : e);
  for (const sd of [-1, 1]) {
    const j1 = jnt(m, sd * 0.095 * s, 0.94 * s, 0, sd < 0 ? P.lr : P.ll, sd * 0.03); part(j1, 'thigh', C.pants);
    const j2 = jnt(j1, 0, -0.44 * s, 0, -(sd < 0 ? P.kr : P.kl), 0), j3 = M4.t(j2, 0, -0.43 * s, 0);
    if (A[0]) { part(j2, 'calf', C3('#b8f0ff'), -0.85, 1.32); part(j3, 'foot', C3('#dffaff'), -0.85, 1.25); G3.box(M4.t(j3, 0, -0.105 * s, 0.05 * s), 0.06 * s, 0.012 * s, 0.15 * s, C3('#39d0ff'), 1); }
    else { part(j2, 'calf', C.pants); part(j3, 'foot', C.shoe, -0.35); G3.box(M4.t(j3, 0, -0.1 * s, 0.05 * s), 0.052 * s, 0.012 * s, 0.128 * s, dark, 0); }
  }
  const up = M4.rx(M4.t(m, 0, 0.96 * s, 0), P.lean);
  part(up, 'torso', C.top); part(up, 'hips', C.pants); G3.mesh(M4.t(up, 0, 0.095 * s, 0), lod ? CYX : CYL, 0.16 * s, 0.022 * s, 0.113 * s, dark, -0.4);
  const hd = M4.t(up, 0, 0.815 * s, 0);
  part(hd, 'head', C.skin, -0.05);
  if (!A[4]) {
    part(hd, 'hair', C.hair, -0.25); ell(hd, 0, -0.03 * s, -0.066 * s, 0.09 * s, 0.08 * s, 0.06 * s, C.hair, -0.25, lod ? SPT : SPX);
    if (C.long) ell(hd, 0, -0.12 * s, -0.075 * s, 0.1 * s, 0.14 * s, 0.055 * s, C.hair, -0.25, lod ? SPT : SPX);
    if (!lod) {
      for (const sd of [-1, 1]) { ell(hd, sd * 0.04, 0.012, 0.1, 0.019, 0.012, 0.012, WHITE, 0, SPT); ell(hd, sd * 0.04, 0.012, 0.108, 0.009, 0.01, 0.006, C3('#2a1a12'), 0, SPT); G3.box(M4.rz(M4.t(hd, sd * 0.04, 0.038, 0.107), -sd * 0.12), 0.022, 0.004, 0.004, C.hair, 0); ell(hd, sd * 0.099, 0, -0.005, 0.014, 0.028, 0.02, C.skin, -0.05, SPT); }
      ell(hd, 0, -0.022, 0.112, 0.014, 0.026, 0.02, mulC(C.skin, 0.94), -0.05, SPT); ell(hd, 0, -0.068, 0.097, 0.026, 0.006, 0.008, C3('#a8553c'), 0, SPT);
    }
  }
  const arm = (sd, a, e, z) => {
    const j1 = jnt(up, sd * 0.215 * s, 0.5 * s, 0, a, sd * z); part(j1, 'uarm', C.top);
    const j2 = jnt(j1, 0, -0.28 * s, 0, e, 0), j3 = M4.t(j2, 0, -0.265 * s, 0);
    if (A[1]) { part(j2, 'farm', C3('#ffd23f'), -0.9, 1.45); part(j3, 'hand', C3('#ffe680'), -0.9, 1.5); } else { part(j2, 'farm', C.sleeve || C.top); part(j3, 'hand', C.skin, -0.05); }
    return j2;
  };
  return { up, hd, ra: arm(-1, P.ar, P.er, P.arz), la: arm(1, P.al, P.el, P.alz) };
}

/* ---------------- the hero ---------------- */
function hero3(o) {
  const A = o.armor || [], su = SUITS[o.suit || 0], c1 = C3(su[0]), c2 = C3(su[1]), gold = C3('#ffd23f'), hair = C3('#3a281d'), t = o.t || 0, p = clamp(o.pt || 0, 0, 1), W = o.melee || 'fist', k = Math.sin(Math.min(1, p * 1.4) * Math.PI);
  const P = { lean: 0, lr: 0.05, ll: -0.05, kr: 0.08, kl: 0.08, ar: 0.1, al: 0.1, er: 0.3, el: 0.3, arz: 0.1, alz: 0.1 }; let twist = 0, bob = Math.sin(t * 3) * 0.008;
  switch (o.pose) {
    case 'run': { const ph = t * 12; P.lr = Math.sin(ph) * 0.85; P.ll = -P.lr; P.kr = 0.25 + 0.95 * Math.max(0, Math.cos(ph)); P.kl = 0.25 + 0.95 * Math.max(0, -Math.cos(ph)); P.ar = -P.lr * 0.75; P.al = P.lr * 0.75; P.er = P.el = 1.25; P.lean = 0.2; bob = Math.abs(Math.cos(ph)) * 0.06; break; }
    case 'wade': { const ph = t * 7; P.lr = Math.sin(ph) * 0.5; P.ll = -P.lr; P.kr = 0.2 + 0.5 * Math.max(0, Math.cos(ph)); P.kl = 0.2 + 0.5 * Math.max(0, -Math.cos(ph)); P.ar = -P.lr * 0.9 + 0.3; P.al = P.lr * 0.9 + 0.3; P.arz = P.alz = 0.45; P.er = P.el = 0.7; P.lean = 0.12; break; }
    case 'back': { const ph = t * 9; P.lr = Math.sin(ph) * 0.45; P.ll = -P.lr; P.kr = P.kl = 0.3; P.lean = -0.08; break; }
    case 'jump': P.lr = 0.75; P.kr = 1.1; P.ll = -0.25; P.kl = 0.5; P.ar = 2.5; P.al = 2.3; break;
    case 'fall': P.lr = 0.3; P.kr = 0.5; P.ll = -0.35; P.kl = 0.6; P.ar = 1.9; P.al = 1.9; P.arz = 0.7; P.alz = 0.7; break;
    case 'hover': P.lr = 0.2; P.ll = -0.2; P.kr = P.kl = 0.4; P.ar = 0.4; P.al = 0.4; P.arz = 0.5; P.alz = 0.5; P.lean = 0.45; break;
    case 'chute': P.lr = 0.15; P.ll = -0.1; P.kr = P.kl = 0.3; P.ar = 2.9; P.al = 2.9; P.arz = 0.35; P.alz = 0.35; P.er = P.el = 0.2; break;
    case 'drive': P.ar = P.al = 1.15; P.er = P.el = 0.55; P.arz = P.alz = 0.05; P.kr = P.kl = 0.3; P.lr = P.ll = 0.14; P.lean = 0.1; break;
    case 'sit': P.lr = P.ll = 1.45; P.kr = P.kl = 1.4; P.ar = 0.9; P.al = 0.9; P.er = P.el = 0.5; break;
    case 'climb': { const ph = t * 6, s = Math.sin(ph); P.ar = 2.4 + s * 0.5; P.al = 2.4 - s * 0.5; P.er = 0.5 - s * 0.3; P.el = 0.5 + s * 0.3; P.lr = 0.75 + s * 0.4; P.ll = 0.75 - s * 0.4; P.kr = 1.1 + s * 0.3; P.kl = 1.1 - s * 0.3; P.lean = 0.12; break; }
    case 'swim': { const ph = t * 4.5; P.ar = -ph; P.al = -ph - Math.PI; P.er = Math.sin(P.ar) < 0 ? 1.0 : 0.15; P.el = Math.sin(P.al) < 0 ? 1.0 : 0.15; P.arz = P.alz = 0.12; const kk = Math.sin(t * 13) * 0.32; P.lr = kk; P.ll = -kk; P.kr = 0.12 + Math.max(0, kk) * 0.4; P.kl = 0.12 + Math.max(0, -kk) * 0.4; twist = 0; break; }
    case 'atk1': if (W === 'hammer') { P.ar = lerp(3.0, 0.5, p); P.er = 0.2; P.lean = 0.3 * p; } else if (W === 'sword') { P.ar = 1.5; P.er = 0.15; twist = lerp(-1.0, 0.8, p); P.lean = 0.12; } else { P.ar = lerp(0.5, 1.6, k); P.er = lerp(1.6, 0.05, k); P.al = 0.5; P.el = 1.6; twist = 0.45 * k; P.lean = 0.14 * k; } P.lr = 0.4; P.ll = -0.4; P.kr = 0.3; break;
    case 'atk2': if (W === 'hammer') { P.ar = lerp(3.0, 0.5, p); P.er = 0.2; P.lean = 0.3 * p; } else if (W === 'sword') { P.ar = 1.5; P.er = 0.15; twist = lerp(0.8, -1.0, p); P.lean = 0.12; } else { P.al = lerp(0.5, 1.6, k); P.el = lerp(1.6, 0.05, k); P.ar = 0.5; P.er = 1.6; twist = -0.45 * k; P.lean = 0.14 * k; } P.lr = -0.4; P.ll = 0.4; P.kl = 0.3; break;
    case 'atk3': if (W === 'hammer') { P.ar = lerp(3.1, 0.3, p); P.al = lerp(3.1, 0.3, p); P.er = P.el = 0.2; P.lean = 0.45 * p; bob = 0.5 * k; } else if (W === 'sword') { P.ar = 1.55; P.er = 0.1; twist = p * TAU; bob = 0.15 * k; } else { P.ar = lerp(0.2, 2.7, k); P.er = lerp(1.4, 0.2, k); P.lean = 0.1; bob = 0.35 * k; } P.lr = 0.5; P.ll = -0.5; P.kr = 0.4; break;
    case 'kick': P.lr = 1.5; P.kr = 0.05; P.ll = -0.6; P.kl = 1.0; P.ar = -0.4; P.al = 0.8; P.lean = -0.25; break;
    case 'blast': P.al = 1.57; P.el = 0.05; P.alz = 0; twist = -0.25; P.lr = 0.3; P.ll = -0.3; break;
    case 'hurt': P.lean = -0.45; P.ar = -0.9; P.al = -0.9; P.lr = 0.4; P.ll = 0.1; P.kr = P.kl = 0.4; break;
    case 'win': { const w = Math.sin(t * 8) * 0.2; P.ar = 2.8 + w; P.al = 2.8 - w; P.arz = 0.3; P.alz = 0.3; P.er = P.el = 0.15; bob = Math.abs(Math.sin(t * 6)) * 0.3; break; }
  }
  let m = M4.ry(M4.t(ID4, o.x, o.y + bob, o.z), o.yaw + twist);
  if (o.pose === 'swim') m = M4.rz(M4.rx(M4.t(m, 0, 0.9 + Math.sin(t * 4.5) * 0.04, -0.75), 1.32), Math.sin(t * 4.5) * 0.28); // flat in the water, rolling with each stroke
  const R = human3(m, P, { top: c1, sleeve: c1, pants: C3('#27324a'), skin: C3('#f0b68a'), hair, shoe: C3('#1d2028') }, A, 0, 1), up = R.up, hd = R.hd, ra = R.ra, la = R.la;
  // jacket details
  G3.box(M4.t(up, 0, 0.33, 0.123), 0.006, 0.2, 0.004, c2, 0); for (const sd of [-1, 1]) G3.box(M4.rz(M4.t(up, sd * 0.045, 0.55, 0.108), sd * 0.5), 0.016, 0.06, 0.006, c2, 0);
  if (A[3]) { // jet wings
    for (const s of [-1, 1]) { G3.mesh(M4.t(up, s * 0.085, 0.36, -0.17), CYL, 0.06, 0.2, 0.06, C3('#6d7890'), -0.8); G3.box(M4.rz(M4.t(up, s * 0.34, 0.5, -0.19), s * 0.5), 0.26, 0.05, 0.02, C3('#ff8c1a'), -0.5); }
    if (o.jet) { const fl = 0.3 + Math.sin(t * 50) * 0.08; for (const s of [-1, 1]) { G3.gmesh(M4.rx(M4.t(up, s * 0.085, 0.14 - fl, -0.17), Math.PI), CONE, 0.065, fl, 0.065, C3('#ffb347'), 1.5); G3.gmesh(M4.rx(M4.t(up, s * 0.085, 0.14 - fl, -0.17), Math.PI), CONE, 0.12, fl * 1.3, 0.12, C3('#ff5a1a'), 0.5); } }
  }
  if (A[2]) { G3.mesh(up, BODY.vest[0], 1.04, 1, 1.06, C3('#c9d6e8'), -0.95); ell(up, 0, 0.4, 0.145, 0.045, 0.045, 0.02, C3('#7df9ff'), 1, SPT); for (const s of [-1, 1]) ell(up, s * 0.225, 0.535, 0, 0.1, 0.07, 0.1, C3('#e4ecf7'), -0.95, SPX); }
  else ell(up, 0, 0.4, 0.125, 0.04, 0.05, 0.01, C3('#ffe14d'), 0.7, SPT);
  if (A[4]) { G3.mesh(M4.t(hd, 0, 0.004, -0.004), BODY.head[0], 1.2, 1.14, 1.16, C3('#8f6be0'), -0.9); ell(hd, 0, 0.012, 0.085, 0.095, 0.036, 0.055, C3('#7df9ff'), 0.9, SPX); G3.box(M4.t(hd, 0, 0.165, -0.03), 0.01, 0.04, 0.11, gold, 0.4); }
  const atk = o.pose && o.pose.startsWith('atk'), hr = M4.t(ra, 0, -0.33, 0);
  if (W === 'sword') { const w = M4.rx(hr, -1.25); G3.box(M4.t(w, 0, -0.76, 0), 0.045, 0.64, 0.012, C3('#e6fbff'), 0.5); G3.mesh(M4.t(w, 0, -1.44, 0), CONE, 0.045, 0.06, 0.012, C3('#e6fbff'), 0.5); G3.mesh(M4.rz(M4.t(w, 0, -0.1, 0), HPI), CYX, 0.026, 0.15, 0.026, gold, -0.9); G3.mesh(M4.t(w, 0, 0.03, 0), CYX, 0.024, 0.1, 0.024, hair, 0); if (atk) G3.glow(M4.t(w, 0, -0.78, 0), 0.11, 0.7, 0.05, C3('#39d0ff'), 0.7); }
  else if (W === 'hammer') { const w = M4.rx(hr, -1.1); G3.mesh(M4.t(w, 0, -0.5, 0), CYX, 0.03, 0.62, 0.03, C3('#6b4a2b'), 0); G3.mesh(M4.rx(M4.t(w, 0, -1.14, 0), HPI), CYL, 0.19, 0.32, 0.19, C3('#9aa4b8'), -0.9); G3.mesh(M4.rx(M4.t(w, 0, -1.14, 0), HPI), CYL, 0.205, 0.07, 0.205, gold, 0.5); if (atk) G3.gmesh(M4.t(w, 0, -1.14, 0), SPX, 0.45, 0.45, 0.55, gold, 0.5); }
  const Rg = o.ranged || 'blaster';
  if (Rg === 'rocket') { G3.mesh(M4.rx(M4.t(up, 0.25, 0.64, 0.05), HPI), CYL, 0.075, 0.4, 0.075, C3('#3f5a3a'), -0.5); G3.mesh(M4.rx(M4.t(up, 0.25, 0.64, 0.46), HPI), CONE, 0.06, 0.07, 0.06, C3('#ff5a36'), 0.8); }
  else { G3.mesh(M4.t(la, Rg === 'tri' ? 0.03 : 0, -0.14, 0.07), CYX, Rg === 'tri' ? 0.065 : 0.038, 0.13, 0.038, C3('#2b3242'), -0.7); ell(la, 0, -0.28, 0.07, Rg === 'tri' ? 0.06 : 0.034, 0.018, 0.034, C3('#7df9ff'), 1, SPT); }
  if (o.pose === 'blast') G3.gmesh(M4.t(la, 0, -0.42, 0.06), SPX, 0.22, 0.22, 0.22, C3('#39d0ff'), 1.2);
  if (o.chute) { // parachute
    G3.mesh(M4.t(m, 0, 4.6, 0), SPH, 2.1, 1.05, 2.1, c1, -0.2); G3.mesh(M4.t(m, 0, 4.25, 0), CYL, 2.12, 0.1, 2.12, WHITE, 0);
    for (const s of [-1, 1]) for (const q of [-1, 1]) { const dx = s * 1.45, dz = q * 1.45, len = Math.hypot(dx, 2.7, dz) / 2; G3.box(M4.rx(M4.rz(M4.t(m, dx / 2 + s * 0.12, 2.85, dz / 2), -Math.atan2(dx, 2.7)), Math.atan2(dz, 2.7)), 0.008, len, 0.008, WHITE, 0); }
  }
}
/* a citizen (far-away detail level, many colours, some with long hair) */
function citizen3(c, t) {
  const w = c.moving ? Math.sin(t * 9 + c.ph) : 0, ch = c.cheer ? Math.sin(t * 10 + c.ph) * 0.3 : 0;
  const P = { lean: c.moving ? 0.08 : 0, lr: w * 0.6, ll: -w * 0.6, kr: 0.15 + Math.max(0, -w) * 0.5, kl: 0.15 + Math.max(0, w) * 0.5, ar: c.cheer ? 2.8 + ch : -w * 0.5, al: c.cheer ? 2.8 - ch : w * 0.5, er: c.cheer ? 0.2 : 0.35, el: c.cheer ? 0.2 : 0.35, arz: 0.1, alz: 0.1 };
  human3(M4.ry(M4.t(ID4, c.x, c.y || 0, c.z), c.yaw), P, { top: c.c1, pants: c.c2, skin: c.skin, hair: c.hair, shoe: C3('#23262e'), long: c.long }, [], 1, c.s || 1);
}

/* ---------------- robots: machined shapes ---------------- */
const RB = {
  torso: mkLoft([[0, .55, .62], [0.12, .64, .72], [0.5, .92, .95], [0.82, 1, 1], [0.95, .86, .86], [1.0, .5, .55]], 10, 4),
  head: mkLoft([[0, .6, .64], [0.2, 1, 1], [0.72, 1, 1], [0.94, .76, .8], [1, .4, .45]], 10, 4),
  limb: mkLoft([[0, .9, .9], [-0.12, 1.12, 1.12], [-0.8, .9, .9], [-1, .7, .7]], 8, 3),
  foot: mkLoft([[0, .8, 1.0, 0, .2], [-0.6, 1.1, 1.7, 0, .5], [-1, 1.15, 1.8, 0, .55]], 8, 4),
  pad: mkLoft([[0, 1, 1], [0.5, .95, .95], [1, .5, .56]], 8, 4)
};
function bot3(e, L) {
  const s = L.s, f = e.flash > 0, pal = e.pal, base = pal ? C3('#eef4ff') : C3(L.c), col = f ? WHITE : base, dk = f ? WHITE : pal ? C3('#3a78d8') : C3(L.d), lt = f ? WHITE : mixC(base, WHITE, 0.3), jt = f ? WHITE : C3('#23262e'), t = e.t, MT = f ? 0 : -0.7;
  const walk = e.moving ? Math.sin(t * 8) : 0, st = e.state;
  let aF = walk * 0.5, aB = -walk * 0.5, lean = 0, elb = 0.3;
  if (st === 'wind') { const q = clamp(1 - e.st / (e.windT || 1), 0, 1); aF = 2.9 * q; aB = e.boss ? 2.9 * q : aB; lean = -0.15 * q; elb = 0.9; }
  else if (st === 'swing') { aF = 0.9; aB = e.boss ? 0.9 : aB; lean = 0.35; elb = 0.1; }
  else if (st === 'stun' || st === 'dizzy') { lean = -0.2 + Math.sin(t * 5) * 0.08; aF = -0.3; aB = -0.2; }
  else if (st === 'charge') { lean = 0.45; aF = 1.4; aB = 1.4; elb = 0.1; }
  else if (st === 'air') { aF = 2.9; aB = 2.9; }
  else if (st === 'cast' || st === 'laser') { aF = 1.57; aB = 1.57; lean = -0.05; elb = 0.05; }
  else if (st === 'cheer') { aF = 2.8 + Math.sin(t * 10) * 0.3; aB = 2.8 - Math.sin(t * 10) * 0.3; }
  const hot = !pal && (st === 'wind' || st === 'charge' || st === 'cast' || st === 'laser'), eye = f ? WHITE : C3(hot ? '#ff2a1a' : pal ? '#5dff9a' : L.eye);
  const m = M4.ry(M4.t(ID4, e.x, e.y, e.z), e.yaw), ll = L.leg * s, hip = ll * 2, lr = L.aw * 1.2 * s;
  for (const sd of [-1, 1]) {
    const sw = sd * walk * 0.5, j1 = jnt(m, sd * L.bw * 0.5 * s, hip, 0, sw, 0); G3.mesh(j1, RB.limb, lr * 1.1, ll, lr * 1.1, col, MT); ell(j1, 0, 0, 0, lr * 1.2, lr * 1.2, lr * 1.2, jt, MT, SPX);
    const j2 = jnt(j1, 0, -ll, 0, -Math.max(0, -sw) * 1.2 - 0.08, 0); G3.mesh(j2, RB.limb, lr, ll * 0.9, lr, dk, MT); ell(j2, 0, 0, 0, lr * 1.15, lr * 1.15, lr * 1.15, jt, MT, SPX);
    G3.mesh(M4.t(j2, 0, -ll * 0.86, 0), RB.foot, lr * 1.15, ll * 0.16, lr * 1.2, lt, MT); G3.mesh(M4.t(j2, 0, -ll * 0.45, -lr * 1.1), CYX, lr * 0.22, ll * 0.4, lr * 0.22, C3('#9aa4b8'), -0.9);
  }
  const up = M4.rx(M4.t(m, 0, hip, 0), lean), bw = L.bw * s, bh = L.bh * s, bd = L.bw * 0.72 * s;
  G3.mesh(M4.t(up, 0, -0.04 * s, 0), CYX, bw * 0.5, bh * 0.16, bd * 0.6, jt, MT); G3.mesh(up, RB.torso, bw, bh * 2, bd, col, MT);
  G3.mesh(M4.t(up, 0, bh * 0.9, bd * 0.88), RB.pad, bw * 0.62, bh * 0.75, bd * 0.16, lt, MT); G3.box(M4.t(up, 0, bh * 1.1, -bd * 0.95), bw * 0.55, bh * 0.55, bd * 0.14, dk, MT);
  if (!f) {
    const cc = C3(pal ? '#5dff9a' : L.core || L.eye);
    G3.mesh(M4.rx(M4.t(up, 0, bh * 1.3, bd * 1.03), HPI), CYX, bw * 0.2, 0.02 * s, bw * 0.2, cc, 1);
    if (L.core || pal) G3.gmesh(M4.t(up, 0, bh * 1.3, bd * 1.1), SPT, bw * 0.45, bw * 0.45, bw * 0.3, cc, 0.4 + Math.sin(t * 6) * 0.18);
    for (let i = -1; i <= 1; i++) G3.box(M4.t(up, i * bw * 0.22, bh * 0.45, bd * 0.86), bw * 0.07, bh * 0.07, 0.012, jt, 0);
    if (pal) G3.mesh(M4.t(up, 0, bh * 2 + 0.02 * s, 0), CYX, L.hw * s * 0.75, 0.05 * s, L.hw * s * 0.75, C3(SUITS[S.suit][0]), -0.2);
  }
  if (L.stack) for (const sd of [-1, 1]) { G3.mesh(M4.t(up, sd * bw * 0.6, bh * 2 + 0.3 * s, -bd * 0.3), CYX, 0.13 * s, 0.4 * s, 0.13 * s, jt, MT); G3.mesh(M4.t(up, sd * bw * 0.6, bh * 2 + 0.7 * s, -bd * 0.3), CYX, 0.15 * s, 0.03 * s, 0.15 * s, C3('#ff7b00'), 1); }
  const hw = L.hw * s, hd = M4.t(up, 0, bh * 2 + 0.06 * s, 0);
  G3.mesh(M4.t(up, 0, bh * 2, 0), CYX, hw * 0.4, 0.08 * s, hw * 0.4, jt, MT); G3.mesh(hd, RB.head, hw, hw * 1.55, hw, lt, MT);
  G3.box(M4.t(hd, 0, hw * 0.82, hw * 0.98), hw * 0.74, hw * 0.2, 0.02 * s, jt, 0); G3.box(M4.t(hd, 0, hw * 0.82, hw * 1.0), hw * 0.66, hw * 0.12, 0.02 * s, eye, 1);
  for (const sd of [-1, 1]) G3.mesh(M4.rz(M4.t(hd, sd * hw * 1.02, hw * 0.75, 0), HPI), CYX, hw * 0.22, 0.03 * s, hw * 0.22, dk, MT);
  if (hot && !f) G3.gmesh(M4.t(hd, 0, hw * 0.82, hw * 1.1), SPT, hw, hw * 0.5, hw * 0.5, C3('#ff2a1a'), 0.8);
  if (L.ant) { G3.mesh(M4.t(hd, -hw * 0.4, hw * 1.95, 0), CYX, 0.015, hw * 0.45, 0.015, jt, 0); ell(hd, -hw * 0.4, hw * 2.45, 0, 0.05, 0.05, 0.05, C3(pal ? '#5dff9a' : '#ff5a36'), 1, SPT); }
  if (L.coil) { G3.mesh(M4.t(hd, 0, hw * 2.0, 0), CYX, 0.03 * s, hw * 0.55, 0.03 * s, C3('#cfd8e6'), MT); for (let i = 0; i < 3; i++) G3.mesh(M4.t(hd, 0, hw * (1.75 + i * 0.28), 0), CYX, (0.16 - i * 0.03) * s, 0.018 * s, (0.16 - i * 0.03) * s, C3('#cfd8e6'), MT); ell(hd, 0, hw * 2.65, 0, 0.1 * s, 0.1 * s, 0.1 * s, C3('#7df9ff'), 1, SPX); if (hot) G3.gmesh(M4.t(hd, 0, hw * 2.65, 0), SPT, 0.4 * s, 0.4 * s, 0.4 * s, C3('#7df9ff'), 0.9); }
  if (L.horn) for (const sd of [-1, 1]) G3.mesh(M4.rz(M4.t(hd, sd * hw * 0.95, hw * 1.55, 0), -sd * 0.7), CONE, 0.08 * s, hw * 0.8, 0.08 * s, C3('#f3e9d2'), -0.4);
  if (L.crown) for (let i = -2; i <= 2; i++) G3.mesh(M4.t(hd, i * hw * 0.34, hw * 1.75, Math.abs(i) === 2 ? -hw * 0.3 : 0), CONE, hw * 0.12, hw * 0.3, hw * 0.12, C3('#ffd23f'), 0.5);
  const ah = L.arm * 0.5 * s, aw = L.aw * s;
  for (const sd of [-1, 1]) {
    const a = sd < 0 ? aF : aB, j1 = jnt(up, sd * (bw * 0.95 + aw), bh * 1.72, 0, a, sd * 0.1);
    G3.mesh(M4.t(j1, 0, -aw * 0.6, 0), RB.pad, aw * 2.0, aw * 2.2, aw * 2.0, col, MT); G3.mesh(j1, RB.limb, aw, ah, aw, sd < 0 ? col : dk, MT);
    const j2 = jnt(j1, 0, -ah, 0, elb, 0); ell(j2, 0, 0, 0, aw * 1.15, aw * 1.15, aw * 1.15, jt, MT, SPX); G3.mesh(j2, RB.limb, aw * 1.05, ah, aw * 1.05, lt, MT);
    G3.mesh(M4.t(j2, 0, -ah * 1.02, 0), RB.head, aw * 1.5, -aw * 2.6, aw * 1.5, dk, MT);
    if (hot && !f && (sd < 0 || e.boss)) G3.gmesh(M4.t(j2, 0, -ah * 1.3, 0), SPT, aw * 3, aw * 3, aw * 3, C3('#ff3322'), 0.7);
  }
}

/* ---------------- animals: one data table, one builder ---------------- */
const ABODY = mkLoft([[-1, .32, .38], [-0.82, .8, .84], [-0.3, 1, .98], [0.3, .96, 1], [0.76, .78, .88], [1, .42, .52]], 10, 2);
const ASNOUT = mkLoft([[-0.55, .7, .76], [-0.12, 1, 1], [0.35, .8, .76], [0.8, .46, .44], [1, .24, .24]], 8, 2);
const ALEG = mkLoft([[0.05, 1, 1.1], [-0.3, 1.1, 1.25], [-0.6, .74, .8], [-0.94, .64, .7], [-1, .9, 1.0]], 7, 2);
const ANIMALS = { // L/W/H = body half-sizes, leg = leg length, hd = head half-sizes [wide, tall, long], hp = head position [up, forward]
  elephant: { name: 'Elephant', L: 1.8, W: 1.1, H: 1.1, leg: 1.4, lr: .33, hd: [.72, .82, .8], hp: [2.8, 2.2], droop: .5, c: '#8d939e', d: '#737986', ears: 'big', trunk: 1, tusk: 1, tail: 'tuft', r: 2.4, top: 4.8 },
  rhino: { name: 'Rhino', L: 1.5, W: .82, H: .82, leg: .75, lr: .24, hd: [.42, .46, .78], hp: [1.5, 1.85], droop: .35, c: '#8a8f96', d: '#6e7379', ears: 'pointy', horn: 1, tail: 'thin', r: 1.9, top: 3 },
  tiger: { name: 'Tiger', L: 1.05, W: .4, H: .42, leg: .7, lr: .1, hd: [.3, .3, .36], hp: [1.3, 1.2], c: '#f08a24', d: '#d9741a', stripes: 5, mark: '#2a1c14', muzzle: '#fff4e0', ears: 'round', tail: 'long', r: 1.3, top: 2.4 },
  lion: { name: 'Lion', L: 1.1, W: .44, H: .45, leg: .74, lr: .11, hd: [.31, .32, .38], hp: [1.4, 1.25], c: '#d9a441', d: '#c08a30', mane: '#8a5a2c', muzzle: '#f3e2c0', ears: 'round', tail: 'tuft', r: 1.4, top: 2.5 },
  zebra: { name: 'Zebra', L: 1.05, W: .4, H: .48, leg: .92, lr: .085, hd: [.19, .22, .42], hp: [2.0, 1.5], neck: 1, droop: .5, c: '#f4f4f6', d: '#e4e4ea', stripes: 7, mark: '#1c1c22', ears: 'long', tail: 'tuft', crest: '#1c1c22', r: 1.3, top: 2.9, fast: 1 },
  giraffe: { name: 'Giraffe', L: 1.15, W: .46, H: .6, leg: 1.75, lr: .1, hd: [.2, .22, .46], hp: [4.9, 2.2], neck: 1, droop: .45, c: '#e8b860', d: '#d9a84e', spots: '#9a6030', ears: 'long', ossi: 1, tail: 'tuft', r: 1.5, top: 5.9 },
  deer: { name: 'Deer', L: .85, W: .33, H: .38, leg: .95, lr: .06, hd: [.15, .16, .3], hp: [2.15, 1.15], neck: 1, droop: .4, c: '#b07a4a', d: '#96643a', antler: 1, ears: 'long', tail: 'white', r: 1, top: 2.9, fast: 1 },
  panda: { name: 'Panda', L: .95, W: .6, H: .58, leg: .5, lr: .17, hd: [.4, .38, .38], hp: [1.3, 1.05], c: '#f6f6f8', d: '#1c1c22', ears: 'round', earC: '#1c1c22', patch: 1, tail: 'white', r: 1.3, top: 2.3 },
  bear: { name: 'Bear', L: .95, W: .58, H: .58, leg: .55, lr: .17, hd: [.36, .36, .42], hp: [1.4, 1.12], c: '#7a5230', d: '#5e3e22', muzzle: '#c9a070', ears: 'round', r: 1.3, top: 2.4 },
  gorilla: { name: 'Gorilla', L: .8, W: .6, H: .62, leg: .62, lr: .17, hd: [.3, .34, .32], hp: [1.75, .7], droop: .3, c: '#2e2e36', d: '#1c1c22', muzzle: '#5a5a66', ears: 'round', r: 1.3, top: 2.6 },
  dog: { name: 'Dog', L: .42, W: .2, H: .2, leg: .36, lr: .05, hd: [.15, .15, .2], hp: [.76, .46], c: '#c98f4e', d: '#b07a3c', muzzle: '#8a5a2c', ears: 'flop', tail: 'wag', r: .5, top: 1.2 },
  cat: { name: 'Cat', L: .33, W: .15, H: .15, leg: .26, lr: .035, hd: [.13, .13, .14], hp: [.57, .35], c: '#8a8f9c', d: '#787d8a', ears: 'pointy', tail: 'up', r: .4, top: 1 }
};
function animal3(a, t) {
  const Q = ANIMALS[a.kind], w = a.moving ? Math.sin(t * ((a.fast || (Q && Q.fast)) ? 13 : 8) + a.ph) : 0, wag = Math.sin(t * 9 + a.ph) * 0.5, hop = a.kind === 'bunny' && a.moving ? Math.abs(Math.sin(t * 9 + a.ph)) * 0.25 : 0, m = M4.ry(M4.t(ID4, a.x, (a.y || 0) + hop, a.z), a.yaw);
  if (Q) {
    const c = C3(Q.c), d = C3(Q.d), by = Q.leg + Q.H * 0.95, mk = Q.mark ? C3(Q.mark) : d, hy = Q.hp[0], hz = Q.hp[1], H = Q.hd, bm = M4.rx(M4.t(m, 0, by, 0), HPI);
    G3.mesh(bm, ABODY, Q.W, Q.L, Q.H, c, 0);
    if (Q.stripes) for (let i = 0; i < Q.stripes; i++) { const u = -0.72 + i * 1.45 / (Q.stripes - 1), f = 1.02 * (1 - u * u * 0.22); G3.mesh(M4.t(bm, 0, u * Q.L, 0), CYX, Q.W * f, Q.L * 0.035, Q.H * f, mk, 0); }
    if (Q.spots) for (let i = 0; i < 14; i++) { const u = -0.7 + (i % 7) * 0.23, sd = i < 7 ? 1 : -1, an = 0.5 + (i % 3) * 0.55; ell(bm, sd * Math.sin(an) * Q.W * 0.97, u * Q.L, -Math.cos(an) * Q.H * 0.9, Q.W * 0.22, Q.L * 0.09, Q.H * 0.2, C3(Q.spots), 0, SPT); }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const j = jnt(m, sx * Q.W * 0.6, by - Q.H * 0.3, sz * Q.L * 0.62, sx * sz * w * 0.6, 0); G3.mesh(j, ALEG, Q.lr, by - Q.H * 0.3, Q.lr, Q.patch ? d : sz > 0 ? c : d, 0); }
    if (Q.neck) { const nx0 = by + Q.H * 0.45, nz0 = Q.L * 0.78, dy = hy - nx0, dz = hz - nz0 - H[2] * 0.3, len = Math.hypot(dy, dz); G3.mesh(M4.rx(M4.t(m, 0, nx0 + dy / 2, nz0 + dz / 2), Math.atan2(dz, dy)), TAPER, Q.W * 0.62, len / 2 + 0.1, Q.H * 0.5, c, 0); if (Q.crest) G3.box(M4.rx(M4.t(m, 0, nx0 + dy / 2, nz0 + dz / 2 - Q.W * 0.5), Math.atan2(dz, dy)), 0.03, len / 2, 0.08, C3(Q.crest), 0); if (Q.spots) for (let i = 0; i < 5; i++) ell(m, (i % 2 ? 1 : -1) * Q.W * 0.4, nx0 + dy * (0.15 + i * 0.17), nz0 + dz * (0.15 + i * 0.17), 0.1, 0.16, 0.14, C3(Q.spots), 0, SPT); }
    const hm = M4.rx(M4.t(m, 0, hy, hz), HPI + (Q.droop == null ? 0.25 : Q.droop));
    if (Q.mane) G3.mesh(M4.t(hm, 0, -H[2] * 0.35, 0), SPL, H[0] * 1.75, H[2] * 0.75, H[1] * 1.8, C3(Q.mane), 0);
    G3.mesh(hm, ASNOUT, H[0], H[2], H[1], Q.patch ? c : c, 0);
    if (Q.muzzle) ell(hm, 0, H[2] * 0.72, H[1] * 0.12, H[0] * 0.5, H[2] * 0.3, H[1] * 0.42, C3(Q.muzzle), 0, SPT);
    ell(hm, 0, H[2] * 0.98, -H[1] * 0.05, H[0] * 0.2, H[2] * 0.06, H[1] * 0.16, C3('#15161a'), 0, SPT);
    for (const sd of [-1, 1]) {
      if (Q.patch) ell(hm, sd * H[0] * 0.55, H[2] * 0.22, -H[1] * 0.38, H[0] * 0.26, H[2] * 0.16, H[1] * 0.26, d, 0, SPT);
      ell(hm, sd * H[0] * 0.66, H[2] * 0.2, -H[1] * 0.45, H[0] * 0.11, H[0] * 0.11, H[0] * 0.11, C3('#15161a'), -0.6, SPT);
      const ec = Q.earC ? C3(Q.earC) : d, ex = sd * H[0] * 0.78, ey = -H[2] * 0.3, ez = -H[1] * 0.85;
      if (Q.ears === 'big') G3.mesh(M4.ry(M4.t(hm, sd * H[0] * 1.2, -H[2] * 0.2, -H[1] * 0.1), sd * (0.5 + Math.sin(t * 2 + a.ph) * 0.15)), SPL, H[0] * 1.0, H[2] * 0.14, H[1] * 1.05, d, 0);
      else if (Q.ears === 'round') ell(hm, ex, ey, ez, H[0] * 0.3, H[0] * 0.14, H[0] * 0.3, ec, 0, SPT);
      else if (Q.ears === 'pointy') G3.mesh(M4.rx(M4.t(hm, ex * 0.8, ey, ez * 1.05), -HPI), CONE, H[0] * 0.24, H[0] * 0.34, H[0] * 0.14, ec, 0);
      else if (Q.ears === 'long') G3.mesh(M4.rz(M4.rx(M4.t(hm, ex * 0.8, ey, ez * 1.25), -HPI), sd * 0.25), SPT, H[0] * 0.2, H[0] * 0.55, H[0] * 0.1, ec, 0);
      else if (Q.ears === 'flop') ell(hm, sd * H[0] * 0.98, -H[2] * 0.05, -H[1] * 0.2, H[0] * 0.18, H[2] * 0.3, H[1] * 0.6, C3(Q.muzzle || Q.d), 0, SPT);
      if (Q.tusk) G3.mesh(M4.rx(M4.t(hm, sd * H[0] * 0.5, H[2] * 0.85, H[1] * 0.5), 0.5), CONE, 0.09, 0.5, 0.09, C3('#f3ead6'), -0.4);
      if (Q.antler) { G3.mesh(M4.rz(M4.rx(M4.t(hm, sd * H[0] * 0.5, -H[2] * 0.1, -H[1] * 1.9), -HPI), -sd * 0.4), CYX, 0.025, 0.34, 0.025, C3('#e8dcc0'), 0); G3.mesh(M4.rz(M4.rx(M4.t(hm, sd * H[0] * 1.1, -H[2] * 0.1, -H[1] * 3.2), -HPI), -sd * 1.0), CONE, 0.022, 0.2, 0.022, C3('#e8dcc0'), 0); }
      if (Q.ossi) { G3.mesh(M4.rx(M4.t(hm, sd * H[0] * 0.4, -H[2] * 0.1, -H[1] * 1.4), -HPI), CYX, 0.035, 0.14, 0.035, d, 0); ell(hm, sd * H[0] * 0.4, -H[2] * 0.1, -H[1] * 2.1, 0.05, 0.05, 0.05, C3('#5a4030'), 0, SPT); }
    }
    if (Q.horn) { G3.mesh(M4.rx(M4.t(hm, 0, H[2] * 0.72, -H[1] * 0.9), -HPI), CONE, 0.13, 0.36, 0.13, C3('#e8dcc0'), -0.3); G3.mesh(M4.rx(M4.t(hm, 0, H[2] * 0.35, -H[1] * 0.95), -HPI), CONE, 0.09, 0.18, 0.09, C3('#e8dcc0'), -0.3); }
    if (Q.trunk) { const tr = Math.sin(t * 1.5 + a.ph) * 0.3; for (let i = 0; i < 6; i++) ell(m, 0, hy - 0.35 - i * 0.36, hz + H[2] * 0.75 + Math.sin(i * 0.5 + tr) * 0.25, 0.25 - i * 0.027, 0.24, 0.25 - i * 0.027, c, 0, SPX); }
    const tz = -Q.L * 0.96, ty = by + Q.H * 0.2;
    if (Q.tail === 'wag') G3.mesh(M4.rz(M4.rx(M4.t(m, 0, ty + 0.1, tz), -0.9), wag), CYX, 0.028, 0.17, 0.028, d, 0);
    else if (Q.tail === 'up') G3.mesh(M4.rx(M4.t(m, 0, ty + 0.2, tz), 0.3 + wag * 0.25), CYX, 0.024, 0.24, 0.024, c, 0);
    else if (Q.tail === 'white') ell(m, 0, ty, tz, Q.W * 0.3, Q.W * 0.3, Q.W * 0.25, C3('#fff4e0'), 0, SPT);
    else if (Q.tail) { const tl = Q.tail === 'long' ? Q.L * 0.9 : Q.leg * 0.55; G3.mesh(M4.rx(M4.t(m, 0, ty - tl * 0.42, tz - tl * 0.22), 0.5 + wag * 0.2), CYX, Q.lr * 0.3, tl / 2, Q.lr * 0.3, Q.tail === 'long' ? c : d, 0); if (Q.tail === 'tuft') ell(m, 0, ty - tl * 0.88, tz - tl * 0.45, Q.lr * 0.6, Q.lr * 0.9, Q.lr * 0.6, C3('#2a1c14'), 0, SPT); }
    return;
  }
  switch (a.kind) {
    case 'croc': { const c = C3('#4a7a3a'), d = C3('#35592a'); G3.mesh(M4.rx(M4.t(m, 0, 0.34, 0), HPI), ABODY, 0.48, 1.35, 0.26, c, 0); legs4(m, 0.52, 0.75, 0.3, 0.3, 0.09, d, w); G3.mesh(M4.rx(M4.t(m, 0, 0.36, 1.25), HPI), ASNOUT, 0.3, 1.0, 0.16, c, 0); G3.mesh(M4.rx(M4.t(m, 0, 0.3, -2.1), -HPI), CONE, 0.27, 1.0, 0.2, d, 0);
      for (let i = 0; i < 6; i++) ell(m, 0, 0.6, -1.0 + i * 0.36, 0.08, 0.07, 0.1, d, 0, SPT); eyes2(m, 0.17, 0.53, 1.0, 0.05); break; }
    case 'monkey': { const c = C3('#7a5230'), f = C3('#e8c9a0'); G3.mesh(M4.t(m, 0, 0.55, 0), SPL, 0.28, 0.36, 0.24, c, 0); G3.mesh(M4.t(m, 0, 1.08, 0.05), SPL, 0.23, 0.23, 0.22, c, 0); ell(m, 0, 1.05, 0.19, 0.16, 0.15, 0.1, f, 0, SPX); eyes2(m, 0.07, 1.1, 0.28, 0.03);
      for (const s of [-1, 1]) { ell(m, s * 0.25, 1.1, 0.02, 0.07, 0.09, 0.04, f, 0, SPT); const j = jnt(m, s * 0.29, 0.8, 0, a.moving ? s * w : 2.6 + wag * 0.4, s * 0.3); G3.mesh(j, ALEG, 0.06, 0.62, 0.06, c, 0); const l = jnt(m, s * 0.16, 0.34, 0.05, -s * w * 0.7 + 0.5, 0); G3.mesh(l, ALEG, 0.07, 0.36, 0.07, c, 0); }
      for (let i = 0; i < 5; i++) ell(m, 0, 0.3 + Math.sin(i * 0.7) * 0.35, -0.3 - i * 0.14, 0.05, 0.05, 0.09, c, 0, SPT); break; }
    case 'parrot': { const c = C3(a.col || '#e5383b'), fl = Math.sin(t * 16 + a.ph) * (a.moving ? 1 : 0.1); G3.mesh(M4.rx(M4.t(m, 0, 0.3, 0), 0.5), SPX, 0.12, 0.2, 0.12, c, -0.2); G3.mesh(M4.t(m, 0, 0.52, 0.1), SPX, 0.1, 0.1, 0.1, c, -0.2); G3.mesh(M4.rx(M4.t(m, 0, 0.5, 0.21), HPI + 0.5), CONE, 0.045, 0.08, 0.035, C3('#ffd23f'), 0); eyes2(m, 0.065, 0.56, 0.16, 0.02);
      for (const s of [-1, 1]) G3.mesh(M4.rz(M4.t(m, s * 0.2, 0.36, -0.02), s * (0.3 + fl)), SPX, 0.22, 0.025, 0.11, C3('#2f7df6'), -0.2); G3.mesh(M4.rx(M4.t(m, 0, 0.2, -0.24), -1.1), SPX, 0.045, 0.2, 0.025, C3('#ffd23f'), 0); break; }
    case 'flamingo': { const c = C3('#ff8fb0'), d = C3('#ff6b96'); for (const s of [-1, 1]) G3.mesh(M4.t(m, s * 0.07, 0.55, 0), CYX, 0.018, 0.55, 0.018, d, 0); G3.mesh(M4.rx(M4.t(m, 0, 1.25, 0), HPI), ABODY, 0.2, 0.34, 0.2, c, 0);
      for (let i = 0; i < 6; i++) { const u = i / 5; ell(m, 0, 1.38 + u * 0.75, 0.28 + Math.sin(u * 3.1) * 0.22, 0.045, 0.09, 0.045, c, 0, SPT); } ell(m, 0, 2.16, 0.34, 0.07, 0.07, 0.09, c, 0, SPT); G3.mesh(M4.rx(M4.t(m, 0, 2.1, 0.47), HPI + 0.6), CONE, 0.03, 0.08, 0.03, C3('#23262e'), 0); eyes2(m, 0.05, 2.18, 0.38, 0.014); break; }
    case 'bat': { const c = C3('#2a2630'), fl = Math.sin(t * 22 + a.ph) * 0.9; ell(m, 0, 0, 0, 0.07, 0.07, 0.1, c, 0, SPT); for (const s of [-1, 1]) G3.mesh(M4.rz(M4.t(m, s * 0.17, 0, 0), s * fl), SPT, 0.17, 0.012, 0.1, c, 0); break; }
    case 'bunny': { const c = C3('#f4f4f6'); G3.mesh(M4.t(m, 0, 0.26, 0), SPX, 0.16, 0.17, 0.22, c, 0); G3.mesh(M4.t(m, 0, 0.46, 0.2), SPX, 0.12, 0.12, 0.12, c, 0);
      for (const s of [-1, 1]) { G3.mesh(M4.rz(M4.t(m, s * 0.05, 0.7, 0.16), -s * 0.15), SPT, 0.035, 0.16, 0.025, c, 0); ell(m, s * 0.1, 0.09, 0.06, 0.05, 0.05, 0.12, c, 0, SPT); } eyes2(m, 0.06, 0.5, 0.3, 0.02); ell(m, 0, 0.45, 0.32, 0.018, 0.014, 0.014, C3('#ff8fa3'), 0, SPT); ell(m, 0, 0.26, -0.22, 0.06, 0.06, 0.06, c, 0, SPT); break; }
  }
}
function legs4(m, bw, bl, hy, len, lr, col, w) { for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const j = jnt(m, sx * bw, hy, sz * bl, sx * sz * w * 0.6, 0); G3.mesh(M4.t(j, 0, -len / 2, 0), CYX, lr, len / 2 + 0.03, lr, col, 0); } }
function eyes2(m, x, y, z, r) { for (const s of [-1, 1]) ell(m, s * x, y, z, r, r, r * 0.6, C3('#15161a'), 0, SPT); }

/* ---------------- extras ---------------- */
function star3(x, y, z, t) { // a golden star to collect
  const m = M4.ry(M4.t(ID4, x, y + Math.sin(t * 2.5 + x) * 0.15, z), t * 1.8), g = C3('#ffd23f');
  for (let i = 0; i < 5; i++) G3.mesh(M4.t(M4.rz(m, i * TAU / 5), 0, 0.3, 0), CONE, 0.12, 0.22, 0.05, g, 0.85); G3.mesh(m, SPT, 0.2, 0.2, 0.07, C3('#fff3b0'), 0.9); G3.gmesh(m, SPT, 0.75, 0.75, 0.75, g, 0.4);
}
const HULL = mkLoft([[-1, .72, .5], [-0.6, .96, .6], [0.2, 1, .62], [0.72, .62, .52], [1, .06, .3]], 10, 3);
function boat3(m, col, t, on) { // a speedboat
  const h = M4.rx(M4.t(m, 0, 0.25, 0), HPI); G3.mesh(h, HULL, 1.15, 3.0, 0.72, C3('#f4f8ff'), -0.85); G3.mesh(M4.t(h, 0, 0, -0.1), HULL, 1.17, 3.02, 0.14, col, -0.85);
  G3.box(M4.t(m, 0, 0.62, -0.5), 0.85, 0.05, 1.5, C3('#8a6a4a'), -0.2); G3.box(M4.rx(M4.t(m, 0, 0.95, 0.85), -0.5), 0.8, 0.3, 0.03, C3('#16202e'), -0.95);
  G3.box(M4.t(m, 0, 0.82, -0.75), 0.6, 0.16, 0.28, col, -0.3); G3.box(M4.t(m, 0, 0.75, -2.95), 0.3, 0.42, 0.22, C3('#23262e'), -0.6); G3.box(M4.t(m, 0, 0.3, -3.05), 0.07, 0.3, 0.07, C3('#8a93a6'), -0.8);
  if (on) G3.gmesh(M4.t(m, 0, 0.1, -3.4), SPT, 0.6, 0.25, 0.9, WHITE, 0.25);
}
