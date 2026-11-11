'use strict';
/* ============================================================
   FIGHTER CRAFT - the 3D open city.
   One scene holds everything: free roaming, walk-in buildings,
   district missions, the camera and the HUD.
   (Fighting code lives in combat.js, which extends this class.)
   ============================================================ */
const CS = 14, GN = 25, GC = 12, WORLD_R = GN * CS / 2;
const cellX = i => (i - GC) * CS;
const ARENAS = [{ i: 12, j: 20 }, { i: 20, j: 12 }, { i: 12, j: 4 }, { i: 4, j: 12 }, { i: 20, j: 4 }], RUMBLE_AT = { i: 4, j: 20 }, ARENA_R = 30;
const DCOL = ['#ffb347', '#ff3df2', '#7dd3ff', '#c8ff5a', '#ff5a5a', '#ffe14d'];
const DPAL = [['#9a6450', '#b07a5c', '#7a5560', '#8a7866'], ['#40347a', '#55307c', '#32437e', '#653278'], ['#86a6cc', '#a0bade', '#7090b8', '#b6cae2'], ['#48664e', '#566844', '#3c5a54', '#666c48'], ['#662c38', '#763434', '#4a2630', '#7c3640'], ['#74809a', '#8890a8', '#66728c', '#949cb0']];
const DH = [[10, 26], [14, 40], [24, 62], [12, 34], [20, 56], [12, 30]];
const ENVS = [
  { amb: [0.30, 0.30, 0.40], sun: [0.30, 0.26, 0.30], fogD: 170, lit: 0.05 }, { amb: [0.38, 0.33, 0.42], sun: [0.58, 0.40, 0.30], fogD: 215, lit: 0.3 },
  { amb: [0.31, 0.30, 0.50], sun: [0.28, 0.30, 0.52], fogD: 245, lit: 0.65 }, { amb: [0.56, 0.60, 0.68], sun: [0.72, 0.70, 0.62], fogD: 330, lit: 0.25 },
  { amb: [0.58, 0.63, 0.66], sun: [0.75, 0.73, 0.62], fogD: 360, lit: 0.3 }, { amb: [0.62, 0.62, 0.60], sun: [0.80, 0.74, 0.56], fogD: 380, lit: 0.5 }];
const SUN_DIR = (() => { const v = [0.42, 0.74, 0.52], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
/* places in the plaza you can walk into */
const SPOTS = [
  { id: 'dojo', x: -14, z: -27, name: 'DOJO', icon: '🥋', col: '#ff8c1a' }, { id: 'armor', x: 14, z: -27, name: 'ARMOR HALL', icon: '🛡️', col: '#b388ff' },
  { id: 'workshop', x: 27, z: -14, name: 'WORKSHOP', icon: '🔧', col: '#ffd23f', b: 1 }, { id: 'bank', x: 27, z: 14, name: 'BANK', icon: '🏦', col: '#ffe14d', b: 1 },
  { id: 'hospital', x: -27, z: 14, name: 'HOSPITAL', icon: '🏥', col: '#ff6b8a', b: 1 }, { id: 'plant', x: -27, z: -14, name: 'POWER PLANT', icon: '🔋', col: '#39d0ff', b: 1 },
  { id: 'park', x: 14, z: 27, name: 'HERO PARK', icon: '🌳', col: '#5fd68a', b: 1 }, { id: 'rumble', x: -14, z: 27, name: 'ROBOT RUMBLE', icon: '🏟️', col: '#ff5a5a' }];
const MELEE = {
  fist: { name: 'Fists', icon: '👊', range: 2.3, arc: 1.15, mult: 1, dur: 1, cost: 0, lv: 0, desc: 'Fast punches. Always with you.' },
  sword: { name: 'Power Sword', icon: '🗡️', range: 3.4, arc: 1.6, mult: 1.35, dur: 1.05, cost: 150, lv: 1, desc: 'Long reach, hits many robots. The 3rd hit spins all around!' },
  hammer: { name: 'Thunder Hammer', icon: '🔨', range: 3.2, arc: 1.25, mult: 1.9, dur: 1.5, cost: 450, lv: 2, desc: 'Slow but HUGE hits. The 3rd hit shakes the ground!' }
};
const RANGED = {
  blaster: { name: 'Hand Blaster', icon: '🔫', cost: 0, lv: 0, en: 25, desc: 'One smart energy shot.' },
  tri: { name: 'Tri-Shot', icon: '🔱', cost: 250, lv: 1, en: 30, desc: 'Three shots at once.' },
  rocket: { name: 'Rocket Launcher', icon: '🚀', cost: 600, lv: 3, en: 45, desc: 'A big explosion that hits a whole group.' }
};
const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
const lerpA = (a, b, t) => a + wrapA(b - a) * t;

/* 3D particles */
class FX3 {
  constructor() { this.p = []; this.rings = []; }
  add(o) { if (this.p.length < 340) this.p.push(o); }
  spark(x, y, z, n, col = '#ffd23f', spd = 9) { const c = C3(col); for (let i = 0; i < n; i++) { const a = rand(TAU), u = rand(-0.4, 1), v = rand(spd * 0.3, spd), q = Math.sqrt(Math.max(0, 1 - u * u)); this.add({ k: 0, x, y, z, vx: Math.cos(a) * q * v, vy: u * v + 2, vz: Math.sin(a) * q * v, life: rand(0.25, 0.55), max: 0.55, c, s: 0.07, g: 16 }); } }
  smoke(x, y, z, n = 1, col = '#6a6a74') { const c = C3(col); for (let i = 0; i < n; i++) this.add({ k: 1, x: x + rand(-0.3, 0.3), y, z: z + rand(-0.3, 0.3), vx: rand(-0.6, 0.6), vy: rand(1, 2.4), vz: rand(-0.6, 0.6), life: rand(0.6, 1.1), max: 1.1, c, s: rand(0.18, 0.34), g: 0 }); }
  debris(x, y, z, n, col) { const c = C3(col); for (let i = 0; i < n; i++) this.add({ k: 2, x, y, z, vx: rand(-7, 7), vy: rand(4, 12), vz: rand(-7, 7), life: rand(0.9, 1.5), max: 1.5, c, s: rand(0.1, 0.28), g: 26, r: rand(TAU) }); }
  ring(x, z, col, r = 4, y = 0.15) { this.rings.push({ x, z, y, r, life: 0.4, max: 0.4, c: C3(col) }); }
  update(dt) {
    for (let i = this.p.length - 1; i >= 0; i--) { const p = this.p[i]; p.life -= dt; if (p.life <= 0) { this.p[i] = this.p[this.p.length - 1]; this.p.pop(); continue; } p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.k === 2 && p.y < 0.1 && p.vy < 0) { p.y = 0.1; p.vy *= -0.35; p.vx *= 0.6; p.vz *= 0.6; } }
    for (let i = this.rings.length - 1; i >= 0; i--) { this.rings[i].life -= dt; if (this.rings[i].life <= 0) this.rings.splice(i, 1); }
  }
  draw() {
    for (const p of this.p) {
      const a = p.life / p.max;
      if (p.k === 0) G3.aglow(p.x, p.y, p.z, p.s, p.s, p.s, p.c, a * 1.6);
      else if (p.k === 1) { const s = p.s * (1.8 - a); G3.abox(p.x, p.y, p.z, s, s, s, p.c, 0.2); }
      else G3.box(M4.ry(M4.rx(M4.t(ID4, p.x, p.y, p.z), p.r + p.life * 9), p.r), p.s, p.s * 0.7, p.s, p.c);
    }
    for (const r of this.rings) { const a = r.life / r.max, rad = r.r * (1 - a) + 0.4, n = 16; for (let i = 0; i < n; i++) { const an = i * TAU / n; G3.glow(M4.ry(M4.t(ID4, r.x + Math.cos(an) * rad, r.y, r.z + Math.sin(an) * rad), -an), 0.1, 0.12, rad * 0.21, r.c, a * 1.4); } }
  }
}

let WORLD = null;
function goWorld() {
  if (!G3.ok) { UI.set('<div class="dim"><div class="panel center"><h2>3D is not available</h2><p class="sub">This browser or device cannot show 3D graphics (WebGL).<br>Try Microsoft Edge or Chrome on a PC or newer tablet.</p></div></div>'); return; }
  if (!WORLD) WORLD = new World(); Game.go(WORLD);
}

class World {
  constructor() {
    this.t = 0; this.fx = new FX3(); this.texts = []; this.en = []; this.shots = []; this.picks = []; this.crates = []; this.cits = [];
    this.h = { x: 0, y: 0, z: 6, vx: 0, vz: 0, vy: 0, yaw: 0, on: true, jumps: 0, hp: 1, maxHp: 1, en: 1, maxEn: 1, sup: 0, atk: null, chain: 0, chainT: 0, buf: false, hurtT: 0, inv: 0, blastT: 0, superT: 0, supTick: 0, jet: false, boost: 0, calm: 9, mv: 0 };
    this.refresh(true);
    this.camYaw = 0; this.eye = [0, 5, -3]; this.shake = 0; this.hitstop = 0; this.slow = 0; this.flash = 0;
    this.mis = null; this.panel = null; this.padLock = null; this.padT = 0; this.cut = null; this.banner = null; this.preview = -1; this.camFront = false;
    this.combo = 0; this.comboT = 0; this.comboPop = 0; this.maxCombo = 0; this.coinPulse = 0; this.roamT = 2; this.saidDizzy = false; this.hint = 0;
    this.bolt = { x: 1.5, y: 2.2, z: 6 }; this.proj = M4.persp(1.05, W / H, 0.3, 520); this.vp = M4.id();
    this.build();
  }
  refresh(full) { const h = this.h; h.maxHp = Calc.maxHp(); h.maxEn = Calc.maxEnergy(); this.power = Calc.power(); if (full) { h.hp = h.maxHp; h.en = h.maxEn; } else { h.hp = Math.min(h.hp, h.maxHp); h.en = Math.min(h.en, h.maxEn); } }

  /* ---------------- building the city ---------------- */
  isOpen(i, j) {
    if (i < 0 || j < 0 || i >= GN || j >= GN) return false;
    if (i % 3 === 0 || j % 3 === 0) return true;
    if (Math.abs(i - GC) <= 2 && Math.abs(j - GC) <= 2) return true;
    for (const a of ARENAS) if (Math.abs(i - a.i) <= 2 && Math.abs(j - a.j) <= 2) return true;
    return Math.abs(i - RUMBLE_AT.i) <= 2 && Math.abs(j - RUMBLE_AT.j) <= 2;
  }
  districtOf(i, j) { // 0-4 = districts, 5 = city centre
    let best = 5, bd = Math.hypot(i - GC, j - GC) * 0.8;
    ARENAS.forEach((a, d) => { const dd = Math.hypot(i - a.i, j - a.j); if (dd < bd) { bd = dd; best = d; } });
    return best;
  }
  envFor(L, armor) {
    const E = ENVS[L], K = CITY_LOOK[L], top = C3(K.sky[0]), mid = C3(K.sky[1]), hor = C3(K.sky[2]);
    const lit = d => d === 5 ? E.lit : armor[d] ? (L <= 2 ? Math.max(E.lit, 0.55) : E.lit + 0.12) : 0.03;
    return { top, hor, fog: mixC(mid, hor, 0.7), amb: E.amb, sunCol: E.sun, sun: SUN_DIR, fogD: E.fogD, litA: [lit(0), lit(1), lit(2)], litB: [lit(3), lit(4), lit(5)], sunDisc: L === 0 ? [0, 0, 0] : L === 2 ? [0.5, 0.5, 0.6] : [1, 0.9, 0.7], sunScr: [0, 0, 0] };
  }
  build() {
    const L = this.L = Calc.cityLevel(), A = S.armor; this.env = this.envFor(L, A);
    this.solids = []; this.props = []; this.lamps = []; this.cellSolid = new Uint16Array(GN * GN);
    G3.staticBegin(5600);
    const gold = L >= 5, dayRoad = L >= 3;
    G3.abox(0, -0.5, 0, WORLD_R + 120, 0.5, WORLD_R + 120, C3(dayRoad ? '#4a4f5a' : '#33353e'));
    // plaza + arenas
    G3.abox(0, 0.03, 0, 2.5 * CS, 0.04, 2.5 * CS, C3(gold ? '#e8d59a' : L >= 3 ? '#b9c2d2' : L >= 1 ? '#7d8496' : '#5a5d68'));
    for (let k = 0; k < 4; k++) G3.box(M4.ry(M4.t(ID4, 0, 0.08, 0), k * 0.785), 4.6, 0.02, 0.22, C3(gold ? '#ffd23f' : '#39d0ff'), L >= 1 ? 0.5 : 0.2);
    ARENAS.forEach((a, d) => G3.abox(cellX(a.i), 0.03, cellX(a.j), 2.5 * CS, 0.04, 2.5 * CS, mixC(C3(DPAL[d][0]), C3('#50545e'), A[d] ? 0.3 : 0.7)));
    G3.abox(cellX(RUMBLE_AT.i), 0.03, cellX(RUMBLE_AT.j), 2.5 * CS, 0.04, 2.5 * CS, C3('#6a4a4a'));
    // road markings
    const lane = C3(dayRoad ? '#e8ecf2' : '#a89860');
    for (let k = 0; k < GN; k += 3) for (let q = 0; q < GN; q++) { if (q % 3 === 0) continue; if (!this.isBlockRoad(k, q)) continue; G3.abox(cellX(k), 0.02, cellX(q), 0.14, 0.02, 2.4, lane); G3.abox(cellX(q), 0.02, cellX(k), 2.4, 0.02, 0.14, lane); }
    // buildings
    for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
      if (this.isOpen(i, j)) continue;
      const d = this.districtOf(i, j), ruin = d === 5 ? L === 0 : !A[d], r = rng(i * 131 + j * 977 + 5), pal = DPAL[d], hr = DH[d];
      let h = hr[0] + r() * (hr[1] - hr[0]); const low = r() < 0.2; if (low) h = 5 + r() * 4;
      let col = C3(pal[Math.floor(r() * 4)]); if (ruin) { col = mulC(mixC(col, [0.36, 0.34, 0.38], 0.6), 0.85); h *= 0.55 + r() * 0.3; } else if (gold && d === 5) col = mixC(col, C3('#e8d59a'), 0.35);
      const half = CS / 2 - 1 - r() * 0.8, x = cellX(i), z = cellX(j);
      G3.abox(x, 0.1, z, CS / 2 - 0.25, 0.1, CS / 2 - 0.25, C3(dayRoad ? '#aab2c0' : '#5b5e6a'));
      const E = CS / 2, x0 = x - (this.isOpen(i - 1, j) ? half : E), x1 = x + (this.isOpen(i + 1, j) ? half : E), z0 = z - (this.isOpen(i, j - 1) ? half : E), z1 = z + (this.isOpen(i, j + 1) ? half : E);
      G3.abox((x0 + x1) / 2, h / 2, (z0 + z1) / 2, (x1 - x0) / 2, h / 2, (z1 - z0) / 2, col, 2 + d);
      this.solids.push({ x0, x1, z0, z1, top: h }); this.cellSolid[i + j * GN] = this.solids.length;
      if (ruin) { const n = 2 + Math.floor(r() * 2); for (let q = 0; q < n; q++) { const bh = 1 + r() * 5, bs = half * (0.25 + r() * 0.3); G3.abox(x + (r() - 0.5) * half, h + bh / 2, z + (r() - 0.5) * half, bs, bh / 2, bs, col, 2 + d); } }
      else {
        if (r() < 0.5) G3.abox(x + (r() - 0.5) * half, h + 0.6, z + (r() - 0.5) * half, 1.2, 0.6, 1, C3('#8a909c'));
        if (r() < 0.3) { G3.abox(x + half * 0.5, h + 3, z - half * 0.5, 0.1, 3, 0.1, C3('#555a66')); G3.abox(x + half * 0.5, h + 6.1, z - half * 0.5, 0.18, 0.18, 0.18, C3('#ff4433'), 1); }
        if (L >= 4 && r() < 0.6) { G3.abox(x, h + 0.2, z, half * 0.8, 0.2, half * 0.8, C3('#4fbf6b')); G3.abox(x - half * 0.4, h + 1.4, z + half * 0.3, 0.9, 1, 0.9, C3('#3fa85a')); }
        if (gold && h > 24 && r() < 0.5) G3.abox(x, h + 5, z, 1.1, 5, 1.1, C3('#ffd86b'), 0.45);
        if (low) G3.abox(x, 3.5, z, half + 0.7, 0.14, half + 0.7, C3(['#ff6b6b', '#ffd23f', '#5fd68a', '#4da6ff'][Math.floor(r() * 4)]));
      }
      if (d === 1 && r() < 0.7) G3.abox(x + (r() < 0.5 ? 1 : -1) * (half + 0.16), 6 + r() * 6, z + (r() - 0.5) * 5, 0.12, 1.2 + r() * 2, 2.2, C3(r() < 0.5 ? '#ff3df2' : '#3df2ff'), ruin ? 0.12 : 1);
    }
    // street lamps + trees + parked cars at crossings
    for (let j = 0; j < GN; j += 3) for (let i = 0; i < GN; i += 3) {
      if (Math.abs(i - GC) <= 2 && Math.abs(j - GC) <= 2) continue;
      const d = this.districtOf(i, j), ok = d === 5 ? L >= 1 : A[d], x = cellX(i) + CS / 2 - 0.9, z = cellX(j) + CS / 2 - 0.9, r = rng(i * 17 + j * 71);
      G3.abox(x, 3, z, 0.11, 3, 0.11, C3('#3a3d48')); G3.abox(x - 0.5, 6, z, 0.6, 0.1, 0.22, C3(DCOL[d]), ok ? 1 : 0.08); if (ok) this.lamps.push([x - 0.5, z, C3(DCOL[d])]);
      if (ok && L >= 3 && r() < 0.8) { const tx = cellX(i) - CS / 2 + 0.9, tz = cellX(j) - CS / 2 + 0.9; G3.abox(tx, 1.2, tz, 0.18, 1.2, 0.18, C3('#6b4a2b')); G3.abox(tx, 3.2, tz, 1.1, 1.1, 1.1, C3('#3fa85a')); G3.abox(tx, 4.4, tz, 0.7, 0.6, 0.7, C3('#58c773')); }
      if (r() < 0.45 && !this.inArena(cellX(i), cellX(j), 40)) { const cx = cellX(i) + (r() < 0.5 ? -1 : 1) * (CS / 2 - 1.6), cz = cellX(j) + (r() - 0.5) * 4 + (r() < 0.5 ? 16 : -16), cc = ok ? C3(['#e5383b', '#2f7df6', '#ffd23f', '#f4f8ff', '#2fbf71'][Math.floor(r() * 5)]) : C3('#2c2c33'); if (!this.inArena(cx, cz, 38) && Math.hypot(cx, cz) > 48) { G3.abox(cx, 0.55, cz, 0.95, 0.45, 2.1, cc); G3.abox(cx, 1.2, cz - 0.2, 0.8, 0.3, 1.1, ok ? C3('#bfe3ff') : C3('#1c1c22')); this.props.push({ x0: cx - 0.95, x1: cx + 0.95, z0: cz - 2.1, z1: cz + 2.1, top: 1.5 }); } }
    }
    this.buildLandmarks(L, A); this.buildSpots(L);
    G3.staticEnd();
    this.makeMap();
    // crates scattered around the streets, and friendly citizens in saved districts
    if (!this.crates.length) { const r = rng(99); for (let n = 0; n < 46; n++) { const k = Math.floor(r() * 9) * 3, q = r() * (GN - 1), vert = r() < 0.5, x = vert ? cellX(k) + (r() - 0.5) * 8 : cellX(q), z = vert ? cellX(q) : cellX(k) + (r() - 0.5) * 8; if (Math.hypot(x, z) < 20 || this.inArena(x, z, 12) || this.blocked(x, z, 1.2)) continue; this.crates.push({ x, z, gold: r() < 0.18, hitT: 0, dead: false, resp: 0, rot: r() * 3 }); } }
    this.cits = []; const cr = rng(7 + L);
    const addCit = (hx, hz, rad) => { const pal = ['#e5383b', '#2f7df6', '#ffd23f', '#2fbf71', '#9b5de5', '#ff8c1a', '#f4f8ff']; this.cits.push({ x: hx + (cr() - 0.5) * rad, z: hz + (cr() - 0.5) * rad, hx, hz, rad, tx: hx, tz: hz, yaw: cr() * TAU, wait: cr() * 3, moving: false, ph: cr() * 9, s: 0.8 + cr() * 0.25, c1: C3(pal[Math.floor(cr() * 7)]), c2: C3(['#2a2e39', '#3a4a6a', '#5a4030'][Math.floor(cr() * 3)]), skin: C3(['#f2b98a', '#d99a6c', '#a86a44'][Math.floor(cr() * 3)]), hair: C3(['#3b2a20', '#1c1c22', '#c98f3c'][Math.floor(cr() * 3)]) }); };
    for (let n = 0; n < L * 2; n++) addCit(0, 0, 50);
    ARENAS.forEach((a, d) => { if (A[d]) for (let n = 0; n < 4; n++) addCit(cellX(a.i), cellX(a.j), 54); });
  }
  isBlockRoad(k, q) { // a road line cell that is not inside the plaza or an arena
    if (Math.abs(k - GC) <= 2 && Math.abs(q - GC) <= 2) return false;
    for (const a of ARENAS.concat([RUMBLE_AT])) if ((Math.abs(k - a.i) <= 2 && Math.abs(q - a.j) <= 2) || (Math.abs(q - a.i) <= 2 && Math.abs(k - a.j) <= 2)) return false;
    return true;
  }
  inArena(x, z, r) { for (const a of ARENAS.concat([RUMBLE_AT])) if (Math.hypot(x - cellX(a.i), z - cellX(a.j)) < r) return true; return false; }
  solid(x0, x1, z0, z1, top) { this.props.push({ x0, x1, z0, z1, top }); }
  buildLandmarks(L, A) {
    // Rusty Harbor: sea, cranes, containers
    const hz = cellX(ARENAS[0].j);
    G3.abox(0, -0.3, WORLD_R + 70, WORLD_R + 120, 0.32, 60, C3(A[0] ? '#2f7fd6' : '#2a3a4a'), 0.15);
    for (let k = -1; k <= 1; k++) { const x = k * 52 + 10, z = WORLD_R - 4, c = C3(A[0] ? '#ffb347' : '#5a4038'); G3.abox(x, 14, z, 0.7, 14, 0.7, c); G3.abox(x + 6, 27, z, 9, 0.6, 0.6, c); G3.abox(x + 13, 22, z, 0.12, 5, 0.12, C3('#22242a')); }
    const cc = ['#8a3b2c', '#2c5d8a', '#7a6a2c', '#3a7a4a'];
    for (let k = 0; k < 4; k++) { const x = (k < 2 ? -1 : 1) * 31, z = hz + (k % 2 ? -1 : 1) * 31; for (let q = 0; q < 2; q++) G3.abox(x, 1.3 + q * 2.6, z, 3, 1.3, 1.4, C3(cc[(k + q) % 4])); this.solid(x - 3, x + 3, z - 1.4, z + 1.4, 5.2); }
    // Sky Bridge: elevated highway
    const sx = cellX(ARENAS[2].i), sz = cellX(ARENAS[2].j);
    for (const dz of [-38, 38]) { G3.abox(sx, 15, sz + dz, 62, 0.6, 3.2, C3(A[2] ? '#dfe9f5' : '#6a7080')); for (let k = -2; k <= 2; k++) G3.abox(sx + k * 26 + 7, 7.2, sz + dz, 0.9, 7.2, 0.9, C3('#8a93a6')); G3.abox(sx, 16, sz + dz, 62, 0.15, 0.2, C3('#7dd3ff'), A[2] ? 1 : 0.1); }
    // Furnace Works: smokestacks
    const fx = cellX(ARENAS[3].i), fz = cellX(ARENAS[3].j);
    for (let k = 0; k < 4; k++) { const x = fx - 39, z = fz + (k - 1.5) * 16; G3.abox(x, 16, z, 1.9, 16, 1.9, C3('#4a4f48')); G3.abox(x, 32.3, z, 2.1, 0.5, 2.1, C3(A[3] ? '#5fd68a' : '#ff7b00'), 1); this.solid(x - 1.9, x + 1.9, z - 1.9, z + 1.9, 33); }
    // Core Tower
    const tx = cellX(ARENAS[4].i) + 40, tz = cellX(ARENAS[4].j) - 40, tc = A[4] ? '#ffd86b' : '#ff2244';
    G3.abox(tx, 55, tz, 8, 55, 8, C3(A[4] ? '#dfe9f5' : '#1a1c26'), 2 + 4); G3.abox(tx, 118, tz, 3, 8, 3, C3(tc), 0.9);
    for (let y = 18; y < 110; y += 18) G3.abox(tx, y, tz, 8.3, 0.5, 8.3, C3(tc), 1);
    this.solid(tx - 8, tx + 8, tz - 8, tz + 8, 110);
    // Rumble stadium ring
    const rx = cellX(RUMBLE_AT.i), rz = cellX(RUMBLE_AT.j);
    for (let k = 0; k < 20; k++) { const a = k * TAU / 20; G3.box(M4.ry(M4.t(ID4, rx + Math.cos(a) * 34, 2.5, rz + Math.sin(a) * 34), -a + Math.PI / 2), 5.2, 2.5, 0.8, C3(k % 2 ? '#8a3a3a' : '#a04848')); }
  }
  buildSpots(L) {
    this.pads = [];
    for (const s of SPOTS) {
      const ax = Math.abs(s.x) > Math.abs(s.z), dx = ax ? -sign(s.x) : 0, dz = ax ? 0 : -sign(s.z), lv = s.b ? S.build[s.id] : 1, col = C3(s.col);
      const fr = (ox, oy, oz, hx, hy, hz, c, e) => G3.abox(s.x + dx * oz + (dx ? 0 : ox), oy, s.z + dz * oz + (dz ? 0 : ox), dx ? hz : hx, hy, dz ? hz : hx, c, e || 0); // "front-relative" box
      let top = 0, solid = true;
      if (s.b && !lv) { // empty building lot
        solid = false; for (const a of [-1, 1]) for (const b of [-1, 1]) G3.abox(s.x + a * 4, 0.8, s.z + b * 4, 0.12, 0.8, 0.12, C3('#d98e2b'));
        for (const a of [-1, 1]) { G3.abox(s.x + a * 4, 1.1, s.z, 0.06, 0.12, 4, C3('#ffd23f')); G3.abox(s.x, 1.1, s.z + a * 4, 4, 0.12, 0.06, C3('#ffd23f')); }
        G3.abox(s.x, 0.1, s.z, 4, 0.06, 4, C3('#6a5a48')); fr(0, 2.2, 4, 1.3, 0.8, 0.08, C3('#2b3242')); fr(0, 2.2, 4.1, 0.35, 0.45, 0.02, col, 1);
      } else if (s.id === 'dojo') { top = 5; G3.abox(s.x, 2.5, s.z, 4.4, 2.5, 4.4, C3('#b5533c')); G3.abox(s.x, 5.3, s.z, 5.4, 0.35, 5.4, C3('#7a1f1f')); G3.abox(s.x, 6.5, s.z, 2.8, 0.9, 2.8, C3('#c9684e')); G3.abox(s.x, 7.6, s.z, 3.6, 0.3, 3.6, C3('#7a1f1f')); fr(0, 1.6, 4.45, 1.2, 1.6, 0.05, C3('#2a1d14')); fr(0, 3.9, 4.5, 2.2, 0.45, 0.06, col, 1); }
      else if (s.id === 'armor') { top = 7; G3.abox(s.x, 3.5, s.z, 4.4, 3.5, 4.4, C3('#e9e2f5')); G3.abox(s.x, 7.3, s.z, 5, 0.35, 5, C3('#9d7be0')); for (const a of [-1, 1]) fr(a * 3, 3, 4.6, 0.45, 3, 0.45, C3('#fbf7ff')); fr(0, 1.7, 4.45, 1.3, 1.7, 0.05, C3('#3a2a5a')); fr(0, 5.2, 4.5, 1.6, 0.5, 0.06, col, 1); G3.abox(s.x, 9, s.z, 0.8, 0.8, 0.8, col, 0.9); }
      else if (s.id === 'rumble') { solid = false; const on = S.stage >= 3; for (const a of [-1, 1]) { G3.abox(s.x + (dz ? a * 3 : 0), 3, s.z + (dx ? a * 3 : 0), 0.6, 3, 0.6, C3('#5a2a2a')); this.solid(s.x + (dz ? a * 3 : 0) - 0.6, s.x + (dz ? a * 3 : 0) + 0.6, s.z + (dx ? a * 3 : 0) - 0.6, s.z + (dx ? a * 3 : 0) + 0.6, 6); } G3.abox(s.x, 6.4, s.z, dz ? 3.8 : 0.7, 0.5, dx ? 3.8 : 0.7, col, on ? 1 : 0.1); }
      else if (s.id === 'workshop') { top = 4 + lv; G3.abox(s.x, top / 2, s.z, 4.4, top / 2, 4.4, C3('#a8503a')); G3.abox(s.x, top + 0.2, s.z, 4.7, 0.2, 4.7, C3('#3d4654')); G3.abox(s.x + 2.5, top + 1.6, s.z - 2.5, 0.6, 1.6, 0.6, C3('#566')); fr(-1.4, 1.5, 4.45, 1.5, 1.5, 0.05, C3('#2a303b')); fr(-1.4, 1.5, 4.5, 1.4, 0.08, 0.05, col, 1); fr(2, 2.6, 4.45, 1, 0.7, 0.05, C3('#ffe9a8'), 0.9); for (let q = 1; q < lv; q++) fr(0, 4.2 + q * 0.9 - 0.5, 4.45, 3, 0.25, 0.05, C3('#ffe9a8'), 0.8); }
      else if (s.id === 'bank') { top = 4 + lv * 0.8; G3.abox(s.x, top / 2, s.z, 4.4, top / 2, 4.4, C3('#e9e2d0')); G3.abox(s.x, top + 0.5, s.z, 4.9, 0.5, 4.9, C3('#cfc6ae')); for (let q = -1; q <= 1; q += lv >= 2 ? 0.5 : 1) fr(q * 3.4, top / 2, 4.7, 0.35, top / 2, 0.35, C3('#fbf7ea')); fr(0, 1.5, 4.45, 1.1, 1.5, 0.05, C3('#5a4a2a')); G3.abox(s.x, top + 2, s.z, 0.9, 0.9, 0.2, col, 1); }
      else if (s.id === 'hospital') { top = 4 + lv * 1.6; G3.abox(s.x, top / 2, s.z, 4.4, top / 2, 4.4, C3('#f4f8ff'), 2 + 2); fr(0, top - 1.2, 4.46, 0.3, 1, 0.05, C3('#e63946'), 1); fr(0, top - 1.2, 4.47, 1, 0.3, 0.05, C3('#e63946'), 1); fr(0, 1.4, 4.45, 1.2, 1.4, 0.05, C3('#7dd3ff'), 0.5); G3.abox(s.x, top + 0.9, s.z, 0.25, 0.9, 0.9, C3('#e63946'), 1); G3.abox(s.x, top + 0.9, s.z, 0.9, 0.9, 0.25, C3('#e63946'), 1); }
      else if (s.id === 'plant') { top = 7; for (let q = 0; q < lv; q++) { const px = s.x + (dx ? 0 : (q - (lv - 1) / 2) * 3.1), pz = s.z + (dz ? 0 : (q - (lv - 1) / 2) * 3.1); G3.abox(px, 2, pz, 1.5, 2, 1.5, C3('#c9ced6')); G3.abox(px, 5.5, pz, 1.15, 1.5, 1.15, C3('#aeb5c0')); G3.abox(px, 7.1, pz, 1.25, 0.15, 1.25, col, 1); } G3.abox(s.x, 0.6, s.z, 4.4, 0.6, 4.4, C3('#59616f')); }
      else if (s.id === 'park') { solid = false; G3.abox(s.x, 0.12, s.z, 5.5, 0.08, 5.5, C3('#4fbf6b')); const r = rng(31); for (let q = 0; q < 1 + lv * 2; q++) { const tx = s.x + (r() - 0.5) * 9, tz = s.z + (r() - 0.5) * 9; G3.abox(tx, 1.1, tz, 0.2, 1.1, 0.2, C3('#6b4a2b')); G3.abox(tx, 3, tz, 1.2, 1, 1.2, C3('#3fa85a')); G3.abox(tx, 4.2, tz, 0.75, 0.6, 0.75, C3('#58c773')); } if (lv >= 2) { G3.abox(s.x, 0.4, s.z, 1.4, 0.4, 1.4, C3('#b8c4d4')); G3.abox(s.x, 1.4, s.z, 0.15, 1, 0.15, C3('#7dd3ff'), 0.9); } if (lv >= 3) { G3.abox(s.x + 3.4, 0.5, s.z + 3.4, 0.7, 0.5, 0.7, C3('#b8a977')); G3.abox(s.x + 3.4, 2, s.z + 3.4, 0.35, 1, 0.25, C3('#ffd86b'), 0.5); G3.abox(s.x + 3.4, 3.25, s.z + 3.4, 0.22, 0.22, 0.22, C3('#ffd86b'), 0.5); } }
      if (solid) this.solid(s.x - 4.4, s.x + 4.4, s.z - 4.4, s.z + 4.4, top);
      this.pads.push({ id: s.id, x: s.x + dx * 8, z: s.z + dz * 8, r: 2.3, col: s.col, label: s.icon + ' ' + s.name, lx: s.x, lz: s.z, ly: Math.max(top, 3) + 3.4 });
    }
    ARENAS.forEach((a, d) => this.pads.push({ id: 'd' + d, x: cellX(a.i), z: cellX(a.j), r: 3.2, col: DCOL[d], label: DISTRICTS[d].icon + ' ' + DISTRICTS[d].name, lx: cellX(a.i), lz: cellX(a.j), ly: 9, d }));
  }
  makeMap() { // little top-down map for the corner of the screen
    this.map = mk(GN * 6, GN * 6, g => {
      for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { g.fillStyle = this.isOpen(i, j) ? '#5a6078' : '#1c2030'; g.fillRect(i * 6, j * 6, 6, 6); }
      g.fillStyle = '#9aa4c0'; g.fillRect((GC - 2) * 6, (GC - 2) * 6, 30, 30);
      ARENAS.forEach((a, d) => { g.fillStyle = DCOL[d]; g.globalAlpha = S.armor[d] ? 0.55 : 0.3; g.fillRect((a.i - 2) * 6, (a.j - 2) * 6, 30, 30); }); g.globalAlpha = 1;
    });
  }

  /* ---------------- collision ---------------- */
  pushOut(o, r, s) {
    if (o.y >= s.top - 0.25) return;
    const nx = clamp(o.x, s.x0, s.x1), nz = clamp(o.z, s.z0, s.z1), dx = o.x - nx, dz = o.z - nz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) return;
    if (d2 > 1e-6) { const d = Math.sqrt(d2); o.x = nx + dx / d * r; o.z = nz + dz / d * r; }
    else { const l = o.x - s.x0, rr = s.x1 - o.x, t = o.z - s.z0, b = s.z1 - o.z, m = Math.min(l, rr, t, b); if (m === l) o.x = s.x0 - r; else if (m === rr) o.x = s.x1 + r; else if (m === t) o.z = s.z0 - r; else o.z = s.z1 + r; }
  }
  collide(o, r) {
    o.x = clamp(o.x, -WORLD_R + 1.5, WORLD_R - 1.5); o.z = clamp(o.z, -WORLD_R + 1.5, WORLD_R - 1.5);
    const ci = Math.floor(o.x / CS + GC + 0.5), cj = Math.floor(o.z / CS + GC + 0.5);
    for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) { if (i < 0 || j < 0 || i >= GN || j >= GN) continue; const s = this.cellSolid[i + j * GN]; if (s) this.pushOut(o, r, this.solids[s - 1]); }
    for (const s of this.props) if (o.x > s.x0 - r && o.x < s.x1 + r && o.z > s.z0 - r && o.z < s.z1 + r) this.pushOut(o, r, s);
  }
  floorAt(x, z, y) { // the highest roof/ground under this point
    let f = 0; const ci = Math.floor(x / CS + GC + 0.5), cj = Math.floor(z / CS + GC + 0.5);
    if (ci >= 0 && cj >= 0 && ci < GN && cj < GN) { const k = this.cellSolid[ci + cj * GN]; if (k) { const s = this.solids[k - 1]; if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && s.top <= y + 0.3) f = s.top; } }
    for (const s of this.props) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && s.top <= y + 0.3 && s.top > f) f = s.top;
    return f;
  }
  blocked(x, z, r) { const o = { x, z, y: 0 }; this.collide(o, r); return Math.abs(o.x - x) + Math.abs(o.z - z) > 0.01; }
  rayHit(ax, ay, az, bx, by, bz, s) { // how far along a->b (0..1) the line first enters box s
    let t0 = 0, t1 = 1; const d = [bx - ax, by - ay, bz - az], o = [ax, ay, az], lo = [s.x0 - 0.4, -1, s.z0 - 0.4], hi = [s.x1 + 0.4, s.top + 0.3, s.z1 + 0.4];
    for (let k = 0; k < 3; k++) { if (Math.abs(d[k]) < 1e-6) { if (o[k] < lo[k] || o[k] > hi[k]) return 1; continue; } let a = (lo[k] - o[k]) / d[k], b = (hi[k] - o[k]) / d[k]; if (a > b) { const q = a; a = b; b = q; } if (a > t0) t0 = a; if (b < t1) t1 = b; if (t0 > t1) return 1; }
    return t0;
  }

  /* ---------------- scene ---------------- */
  enter() {
    UI.clear(); this.panel = null; Music.play(this.mis ? (this.boss ? 'boss' : 'battle') : 'hub'); this.refresh(false); UI.touch(true);
    if (S.pendingCity > 0) this.startCut();
    else if (!this.mis && this.hint < 1) { this.hint = 1; const tip = this.makeTip(); this.say(tip, 6); }
  }
  exit() { UI.touch(false); hush(); }
  say(text, dur = 5) { this.boltMsg = { text, t: 0, dur }; say(text); }
  setBanner(text, sub, col, dur = 2.2) { this.banner = { text, sub, col, t: 0, dur }; }
  text(x, y, z, str, col = '#fff', size = 24) { this.texts.push({ x, y, z, str, col, size, life: 0.9 }); }
  nextDistrict() { return S.stage > 14 ? -1 : Math.floor(S.stage / 3); }
  makeTip() {
    const p = Calc.power(), nd = this.nextDistrict();
    if (nd < 0) return 'You saved Nova City! Try Robot Rumble and collect every badge.';
    const rec = Calc.recPower(S.stage);
    if (!S.stats.wins) return 'Run to the glowing orange beacon to start your first mission in Rusty Harbor!';
    if (p < rec) return `The next mission needs Power ${rec}. You have ${p}. Walk into the Dojo to train!`;
    if (S.wp && Object.keys(S.wp.own).length < 3 && S.build.workshop && S.coins >= 150) return 'You have coins for a new weapon! Visit the Workshop.';
    const b = BUILDINGS.find(x => this.canBuild(x) === true && S.coins >= x.cost[S.build[x.id]]);
    if (b) return `You have enough coins to build the ${b.name}! Walk to its spot in the plaza.`;
    return pick(TIPS);
  }
  canBuild(b) { const lv = S.build[b.id]; if (lv >= 3) return 'max'; const cap = clamp(this.L - b.city + 1, 0, 3); return cap <= 0 ? 'city' : lv >= cap ? 'cap' : true; }
  teleport(x, z, yaw) { const h = this.h; h.x = x; h.z = z; h.y = 0; h.vx = h.vz = h.vy = 0; h.on = true; if (yaw != null) { h.yaw = yaw; this.camYaw = yaw; } }

  update(dt) {
    if (this.panel) { this.t += dt * 0.2; return; }
    if (Input.hit('pause') && !this.cut) { this.openPanel('pause'); return; }
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    if (this.slow > 0) { this.slow -= dt; dt *= 0.35; }
    this.t += dt;
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
    if (this.boltMsg) { this.boltMsg.t += dt; if (this.boltMsg.t > this.boltMsg.dur) this.boltMsg = null; }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.4);
    if (this.flash > 0) this.flash -= dt * 1.5;
    if (this.coinPulse > 0) this.coinPulse -= dt * 4;
    this.fx.update(dt);
    for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.life -= dt; t.y += 1.4 * dt; if (t.life <= 0) this.texts.splice(i, 1); }
    for (const c of this.crates) { if (c.hitT > 0) c.hitT -= dt; if (c.dead && !c.mis) { c.resp -= dt; if (c.resp <= 0 && Math.hypot(c.x - this.h.x, c.z - this.h.z) > 30) c.dead = false; } }
    this.upCitizens(dt);
    if (this.cut) { this.upCut(dt); this.upCamera(dt); return; }
    this.upHero(dt);
    this.upCombat(dt);
    this.upPads(dt);
    this.upCamera(dt);
    const b = this.bolt, h = this.h, bx = h.x + Math.cos(h.yaw) * -1.3 - Math.sin(h.yaw) * 0.4, bz = h.z - Math.sin(h.yaw) * -1.3 - Math.cos(h.yaw) * 0.4, k = Math.min(1, dt * 4);
    b.x = lerp(b.x, bx, k); b.z = lerp(b.z, bz, k); b.y = lerp(b.y, h.y + 2.3, k);
  }
  upCitizens(dt) {
    const h = this.h;
    for (const c of this.cits) {
      c.cheer = Math.hypot(c.x - h.x, c.z - h.z) < 6; c.moving = false;
      if (c.cheer) { c.yaw = lerpA(c.yaw, Math.atan2(h.x - c.x, h.z - c.z), Math.min(1, dt * 6)); continue; }
      if (c.wait > 0) { c.wait -= dt; if (c.wait <= 0) { c.tx = c.hx + rand(-c.rad, c.rad) / 2; c.tz = c.hz + rand(-c.rad, c.rad) / 2; c.walk = rand(4, 9); } continue; }
      const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz); c.walk -= dt;
      if (d < 0.6 || c.walk <= 0) { c.wait = rand(1, 4); continue; }
      c.yaw = lerpA(c.yaw, Math.atan2(dx, dz), Math.min(1, dt * 5)); c.x += Math.sin(c.yaw) * 1.7 * dt; c.z += Math.cos(c.yaw) * 1.7 * dt; c.y = 0; c.moving = true; this.collide(c, 0.4);
    }
  }
  upPads(dt) {
    const h = this.h;
    if (this.padLock) { const p = this.pads.find(q => q.id === this.padLock); if (!p || Math.hypot(h.x - p.x, h.z - p.z) > p.r + 1.6) this.padLock = null; }
    if (this.mis || !h.on || h.y > 0.5) { this.padT = 0; return; }
    let on = null; for (const p of this.pads) if (p.id !== this.padLock && Math.hypot(h.x - p.x, h.z - p.z) < p.r) on = p;
    this.onPad = on;
    if (on && this.en.every(e => Math.hypot(e.x - h.x, e.z - h.z) > 14)) { this.padT += dt; if (this.padT > 0.35) { this.padT = 0; this.padLock = on.id; this.openPanel(on.id); } } else this.padT = 0;
  }
  upCamera(dt) {
    const h = this.h, c = this.cut;
    let ex, ey, ez, tx, ty, tz;
    if (c) { const a = c.t * 0.45 + h.yaw + Math.PI, rad = c.t < 3.2 ? 7 + c.t : 14 + (c.t - 3.2) * 5, hh = c.t < 3.2 ? 3 + c.t * 0.5 : 6 + (c.t - 3.2) * 5; ex = h.x + Math.sin(a) * rad; ez = h.z + Math.cos(a) * rad; ey = h.y + hh; tx = h.x; ty = h.y + 1.6 + (c.t > 3.2 ? (c.t - 3.2) * 1.6 : 0); tz = h.z; }
    else if (this.camFront) { const f = [Math.sin(h.yaw), Math.cos(h.yaw)]; ex = h.x + f[0] * 4.6; ez = h.z + f[1] * 4.6; ey = h.y + 1.7; tx = h.x + f[1] * 1.5; tz = h.z - f[0] * 1.5; ty = h.y + 1.15; this.camYaw = h.yaw; }
    else {
      this.camYaw = lerpA(this.camYaw, h.yaw, Math.min(1, dt * 7));
      const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw), big = this.boss ? 2.5 : 0, hx = h.x, hy = h.y + 1.9, hz = h.z;
      ex = h.x - fx * (7.4 + big); ez = h.z - fz * (7.4 + big); ey = h.y + 4.0 + big * 0.6; tx = h.x + fx * 4; tz = h.z + fz * 4; ty = h.y + 1.7;
      let t = 1; const ci = Math.floor(ex / CS + GC + 0.5), cj = Math.floor(ez / CS + GC + 0.5), hi = Math.floor(hx / CS + GC + 0.5), hj = Math.floor(hz / CS + GC + 0.5);
      for (let j = Math.min(cj, hj) - 1; j <= Math.max(cj, hj) + 1; j++) for (let i = Math.min(ci, hi) - 1; i <= Math.max(ci, hi) + 1; i++) { if (i < 0 || j < 0 || i >= GN || j >= GN) continue; const k = this.cellSolid[i + j * GN]; if (k) t = Math.min(t, this.rayHit(hx, hy, hz, ex, ey, ez, this.solids[k - 1])); }
      for (const s of this.props) if (Math.abs((s.x0 + s.x1) / 2 - hx) < 16 && Math.abs((s.z0 + s.z1) / 2 - hz) < 16) t = Math.min(t, this.rayHit(hx, hy, hz, ex, ey, ez, s));
      if (t < 1) { t = Math.max(0.05, t * 0.92); ex = hx + (ex - hx) * t; ey = hy + (ey - hy) * t + (1 - t) * 5.5; ez = hz + (ez - hz) * t; tx = h.x + fx * 4 * t; tz = h.z + fz * 4 * t; } // wall behind the hero: lift the camera above him instead of pushing it into the wall
    }
    const k = c || this.camFront ? 1 : Math.min(1, dt * 14), e = this.eye; e[0] = lerp(e[0], ex, k); e[1] = lerp(e[1], ey, k); e[2] = lerp(e[2], ez, k);
    const sh = this.shake, g = this.tg || (this.tg = [tx, ty, tz]); g[0] = lerp(g[0], tx, k); g[1] = lerp(g[1], ty, k); g[2] = lerp(g[2], tz, k); this.tgt = [g[0] + (sh ? rand(-sh, sh) : 0), g[1] + (sh ? rand(-sh, sh) : 0), g[2]];
  }

  /* ---------------- armor + city upgrade cutscene ---------------- */
  startCut() {
    const L = S.pendingCity, A = S.armor.slice(); A[L - 1] = false;
    this.cut = { t: 0, L, armor: ARMOR[L - 1], step: 0 }; this.envNew = this.env; this.env = this.envFor(L - 1, A);
    S.pendingCity = -1; Save.save(); UI.touch(false); Music.play('hub'); Snd.play('fanfare'); say(`You earned the ${this.cut.armor.name}! ${this.cut.armor.power}`);
  }
  upCut(dt) {
    const c = this.cut, h = this.h; c.t += dt; h.vx = h.vz = 0; if (h.y > 0 && !h.on) { h.vy -= 24 * dt; h.y = Math.max(this.floorAt(h.x, h.z, h.y), h.y + h.vy * dt); }
    if (c.step === 0 && c.t > 3.2) { c.step = 1; this.build(); this.flash = 1; Snd.play('levelup'); say(`City level up! Nova City is now level ${c.L}. ${CITY_NAMES[c.L]}`); }
    if (c.step === 1 && Math.random() < dt * 10) this.fx.spark(h.x + rand(-16, 16), h.y + rand(6, 16), h.z + rand(-16, 16), 16, pick(['#ffd23f', '#7df9ff', '#ff6b9d', '#5fd68a']), 7);
    if (c.t > 9 || (c.t > 4.4 && (Input.hit('ok') || Input.hit('jump') || Input.hit('punch') || Input.mouse.clicked))) { this.cut = null; this.refresh(true); UI.touch(true); if (c.L === 5) UI.toast('👑 You saved Nova City! You are a LEGEND!'); else this.say(this.makeTip(), 6); }
  }

  /* ---------------- drawing ---------------- */
  toScreen(x, y, z) { const m = this.vp, w = m[3] * x + m[7] * y + m[11] * z + m[15]; if (w < 0.2) return null; return [(m[0] * x + m[4] * y + m[8] * z + m[12]) / w * W / 2 + W / 2, H / 2 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w * H / 2, w]; }
  draw(g) {
    const h = this.h, t = this.t, e = this.eye, tg = this.tgt || [h.x, h.y + 1.6, h.z], env = this.env;
    this.vp = M4.mul(this.proj, M4.look(e[0], e[1], e[2], tg[0], tg[1], tg[2]));
    const sp = this.toScreen(e[0] + SUN_DIR[0] * 400, e[1] + SUN_DIR[1] * 400, e[2] + SUN_DIR[2] * 400); env.sunScr = sp ? [(sp[0] - W / 2) / (W / 2), (H / 2 - sp[1]) / (H / 2), 1] : [0, 0, 0];
    G3.begin();
    const nd = this.nextDistrict();
    for (const p of this.pads) {
      if (Math.hypot(p.x - h.x, p.z - h.z) < 90 && !this.mis) pad3(p.x, p.z, p.r, p.col, t, this.onPad === p);
      if (p.d != null && !this.mis) G3.aglow(p.x, 45, p.z, 0.7, 45, 0.7, C3(p.col), p.d === nd ? 0.75 + Math.sin(t * 4) * 0.2 : 0.22);
    }
    for (const l of this.lamps) if (Math.abs(l[0] - e[0]) < 80 && Math.abs(l[1] - e[2]) < 80) G3.aglow(l[0], 5.8, l[1], 0.9, 0.35, 0.6, l[2], 0.5);
    for (const c of this.cits) if (Math.abs(c.x - h.x) < 90 && Math.abs(c.z - h.z) < 90) citizen3(c, t);
    for (const c of this.crates) if (!c.dead && Math.abs(c.x - h.x) < 100 && Math.abs(c.z - h.z) < 100) crate3(c);
    const sh = [0.04, 0.04, 0.06];
    { const f = this.floorAt(h.x, h.z, h.y), k = clamp(1 - (h.y - f) / 12, 0.3, 1); G3.abox(h.x, f + 0.035, h.z, 0.5 * k, 0.02, 0.5 * k, sh); }
    for (const en of this.en) { const k = clamp(1 - en.y / 12, 0.4, 1); G3.abox(en.x, 0.035, en.z, en.r * k, 0.02, en.r * k, sh); enemy3(en); }
    this.drawCombat(t);
    let pose = 'idle', pt = 0;
    if (this.cut || (this.mis && this.mis.state === 'win')) pose = 'win'; else if (h.hurtT > 0 || (this.mis && this.mis.state === 'lose')) pose = 'hurt'; else if (h.superT > 0 || h.blastT > 0) pose = 'blast';
    else if (h.atk) { pose = h.atk.pose; pt = h.atk.t / h.atk.dur; } else if (!h.on) pose = h.jet ? 'hover' : h.vy > 0 ? 'jump' : 'fall'; else if (h.mv > 0.1) pose = 'run'; else if (h.mv < -0.1) pose = 'back';
    const arm = S.armor.slice(); if (this.preview >= 0) arm[this.preview] = true;
    if (!(h.inv > 0 && Math.floor(t * 18) % 2)) hero3({ x: h.x, y: h.y, z: h.z, yaw: h.yaw, t, pose, pt, armor: arm, suit: S.suit, melee: S.wp.m, ranged: S.wp.r, jet: h.jet });
    if (h.boost > 0) G3.aglow(h.x, h.y + 1, h.z, 0.9, 1.2, 0.9, C3('#39d0ff'), 0.25 + Math.sin(t * 10) * 0.08);
    if (h.sup >= 100) G3.aglow(h.x, h.y + 1, h.z, 0.8, 1.1, 0.8, C3('#ffd23f'), 0.16 + Math.sin(t * 8) * 0.06);
    bolt3(this.bolt.x, this.bolt.y, this.bolt.z, t, h.yaw);
    this.fx.draw();
    G3.render(this.vp, e, env);
    g.clearRect(0, 0, W, H);
    this.drawHud(g);
  }
  bar(g, x, y, w, hh, f, c1, c2) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; rr(g, x - 2, y - 2, w + 4, hh + 4, hh / 2 + 2); g.fill();
    if (f > 0.01) { const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; rr(g, x, y, Math.max(hh, w * clamp(f, 0, 1)), hh, hh / 2); g.fill(); }
  }
  pcol(p) { const r = p / this.power; return r < 0.8 ? '#5fd68a' : r < 1.15 ? '#ffe14d' : '#ff6b5a'; }
  drawHud(g) {
    const h = this.h, t = this.t, m = this.mis, c = this.cut; g.textBaseline = 'middle';
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${clamp(this.flash, 0, 1)})`; g.fillRect(0, 0, W, H); }
    if (c) {
      g.textAlign = 'center'; const first = c.t < 3.2, a = clamp(first ? c.t * 3 : (c.t - 3.2) * 3, 0, 1);
      g.globalAlpha = a; g.fillStyle = 'rgba(8,10,20,0.78)'; g.fillRect(0, 60, W, 150); g.fillStyle = first ? c.armor.color : '#ffe14d'; g.fillRect(0, 60, W, 5); g.fillRect(0, 205, W, 5);
      g.font = `bold 60px ${FONT}`; g.fillText(first ? `NEW ARMOR: ${c.armor.name.toUpperCase()}!` : `🏙️ CITY LEVEL ${c.L}: ${CITY_NAMES[c.L].toUpperCase()}`, W / 2, 112);
      g.fillStyle = '#fff'; g.font = `26px ${FONT}`; g.fillText(first ? c.armor.power : 'Your new armor brought power back to Nova City!', W / 2, 172); g.globalAlpha = 1;
      if (c.t > 4.6) { g.font = `22px ${FONT}`; g.globalAlpha = 0.6 + Math.sin(t * 5) * 0.4; g.fillText(UI.isTouch ? 'Tap to continue' : 'Press ENTER or click to continue', W / 2, 690); g.globalAlpha = 1; }
      return;
    }
    // labels over buildings and beacons
    if (!m) for (const p of this.pads) {
      const d = Math.hypot(p.lx - h.x, p.lz - h.z); if (d > (p.d != null ? 400 : 75)) continue; const s = this.toScreen(p.lx, p.ly, p.lz); if (!s) continue;
      const sc = clamp(26 / s[2], 0.55, 1.15), far = p.d != null ? ' • ' + Math.round(d) + ' m' : ''; g.font = `bold ${Math.round(20 * sc)}px ${FONT}`; g.textAlign = 'center'; const tw = g.measureText(p.label + far).width + 22 * sc;
      g.fillStyle = 'rgba(8,10,20,0.72)'; rr(g, s[0] - tw / 2, s[1] - 15 * sc, tw, 30 * sc, 15 * sc); g.fill(); g.fillStyle = p.col; g.fillText(p.label + far, s[0], s[1] + 1);
    }
    // robot tags
    for (const e of this.en) {
      const s = this.toScreen(e.x, e.y + e.h + 0.7, e.z); if (!s || s[2] > 60) continue; const sc = clamp(13 / s[2], 0.6, 1.25), col = this.pcol(e.power);
      if (e.state === 'wind' || e.state === 'cast') { g.fillStyle = '#ff3b2f'; g.font = `bold ${Math.round((e.boss ? 60 : 40) * sc)}px ${FONT}`; g.textAlign = 'center'; g.fillText('!', s[0], s[1] - 30 * sc + Math.sin(t * 30) * 3); }
      if (e.state === 'dizzy') { g.fillStyle = '#ffe14d'; g.font = `${Math.round(28 * sc)}px Arial`; g.textAlign = 'center'; for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3; g.fillText('★', s[0] + Math.cos(a) * 40 * sc, s[1] + Math.sin(a) * 10 * sc); } }
      if (!e.boss) { g.font = `bold ${Math.round(15 * sc)}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = 'rgba(8,10,18,0.75)'; rr(g, s[0] - 28 * sc, s[1] - 11 * sc, 56 * sc, 21 * sc, 10 * sc); g.fill(); g.fillStyle = col; g.fillText('⚡' + e.power, s[0], s[1]); if (e.hp < e.maxHp) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(s[0] - 26 * sc, s[1] + 12 * sc, 52 * sc, 5 * sc); g.fillStyle = col; g.fillRect(s[0] - 26 * sc, s[1] + 12 * sc, 52 * sc * clamp(e.hp / e.maxHp, 0, 1), 5 * sc); } }
    }
    g.textAlign = 'center';
    for (const x of this.texts) { const s = this.toScreen(x.x, x.y, x.z); if (!s) continue; const sc = clamp(12 / s[2], 0.5, 1.3); g.globalAlpha = clamp(x.life * 2.5, 0, 1); g.font = `bold ${Math.round(x.size * sc)}px ${FONT}`; g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(x.str, s[0], s[1]); g.fillStyle = x.col; g.fillText(x.str, s[0], s[1]); }
    g.globalAlpha = 1;
    if (h.hp < h.maxHp * 0.3) { g.fillStyle = `rgba(255,30,30,${0.1 + Math.sin(t * 6) * 0.06})`; g.fillRect(0, 0, W, H); }
    // hero panel
    g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, 14, 12, 400, 104, 18); g.fill();
    g.fillStyle = SUITS[S.suit][0]; circ(g, 60, 62, 34); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `bold 13px ${FONT}`; g.fillText('LEVEL', 60, 46); g.font = `bold 32px ${FONT}`; g.fillText(S.level, 60, 70);
    g.textAlign = 'left'; g.font = `bold 17px ${FONT}`; g.fillText(S.name, 108, 28); g.fillStyle = '#ffe14d'; g.textAlign = 'right'; g.fillText('⚡ POWER ' + this.power, 400, 28);
    const hpF = h.hp / h.maxHp; this.bar(g, 108, 42, 290, 22, hpF, hpF < 0.3 ? '#ff3b2f' : '#2fbf71', hpF < 0.3 ? '#ff7b54' : '#9be36a');
    g.fillStyle = '#fff'; g.font = `bold 14px ${FONT}`; g.textAlign = 'center'; g.fillText(`♥ ${Math.ceil(h.hp)} / ${h.maxHp}`, 253, 54);
    this.bar(g, 108, 72, 290, 11, h.en / h.maxEn, '#1b6fd6', '#7df9ff');
    const full = h.sup >= 100; this.bar(g, 108, 91, 290, 11, h.sup / 100, '#ff8c1a', full && Math.sin(t * 12) > 0 ? '#ffffff' : '#ffe14d');
    // weapons
    g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, 14, 122, 250, 40, 14); g.fill(); g.font = `bold 16px ${FONT}`; g.textAlign = 'left'; g.fillStyle = '#fff';
    g.fillText(`${MELEE[S.wp.m].icon} ${MELEE[S.wp.m].name}`, 26, 143); g.fillStyle = '#7df9ff'; g.fillText(RANGED[S.wp.r].icon, 222, 143);
    let ly = 184; g.font = `bold 20px ${FONT}`;
    if (full) { g.fillStyle = '#ffe14d'; g.fillText(UI.isTouch ? 'SUPER READY! ⭐' : 'SUPER READY!  Press L', 24, ly); ly += 26; }
    if (h.boost > 0) { g.fillStyle = '#7df9ff'; g.fillText('⚡ POWER SURGE ' + Math.ceil(h.boost) + 's', 24, ly); }
    // coins + map
    const cs = 1 + Math.max(0, this.coinPulse) * 0.15, got = m ? m.got.coins : 0;
    g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W - 214, 12, 200, 50, 25); g.fill(); drawCoin(g, W - 184, 37, 15, t);
    g.fillStyle = '#ffe14d'; g.font = `bold ${Math.round(28 * cs)}px ${FONT}`; g.textAlign = 'left'; g.fillText(S.coins + got, W - 160, 38);
    if (!m) {
      const mx = W - 164, my = 72; g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, mx - 6, my - 6, 162, 162, 12); g.fill(); g.globalAlpha = 0.9; g.drawImage(this.map, mx, my); g.globalAlpha = 1;
      const mp = (x, z) => [mx + (x / CS + GC + 0.5) * 6, my + (z / CS + GC + 0.5) * 6], nd = this.nextDistrict();
      for (const e of this.en) { const p = mp(e.x, e.z); g.fillStyle = '#ff5a5a'; g.fillRect(p[0] - 2, p[1] - 2, 4, 4); }
      if (nd >= 0) { const p = mp(cellX(ARENAS[nd].i), cellX(ARENAS[nd].j)); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], 7 + Math.sin(t * 5) * 2, 0, TAU); g.stroke(); }
      const p = mp(h.x, h.z); g.save(); g.translate(p[0], p[1]); g.rotate(Math.PI - h.yaw); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -8); g.lineTo(6, 6); g.lineTo(0, 3); g.lineTo(-6, 6); g.closePath(); g.fill(); g.restore();
      // where to go next
      if (nd >= 0) {
        const ax = cellX(ARENAS[nd].i) - h.x, az = cellX(ARENAS[nd].j) - h.z, dist = Math.hypot(ax, az), rel = wrapA(Math.atan2(ax, az) - this.camYaw);
        if (dist > 12) { g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W / 2 - 210, 12, 420, 46, 23); g.fill(); g.save(); g.translate(W / 2 - 180, 35); g.rotate(-rel); g.fillStyle = DCOL[nd]; g.beginPath(); g.moveTo(0, -14); g.lineTo(10, 10); g.lineTo(0, 4); g.lineTo(-10, 10); g.closePath(); g.fill(); g.restore(); g.fillStyle = '#fff'; g.font = `bold 18px ${FONT}`; g.textAlign = 'left'; g.fillText(`Next mission: ${DISTRICTS[nd].name} ${nd + 1}-${S.stage % 3 + 1}  •  ${Math.round(dist)} m`, W / 2 - 156, 36); }
      }
    } else this.drawMissionHud(g);
    // combo
    if (this.combo > 1) { const s = 1 + Math.max(0, this.comboPop) * 0.35, col = this.combo >= 25 ? '#ff5a5a' : this.combo >= 10 ? '#ffb347' : '#ffe14d'; g.save(); g.translate(W - 120, m ? 170 : 300); g.rotate(-0.08); g.scale(s, s); g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.font = `bold 78px ${FONT}`; g.strokeText(this.combo, 0, 0); g.fillStyle = col; g.fillText(this.combo, 0, 0); g.font = `bold 26px ${FONT}`; g.strokeText('HITS!', 0, 52); g.fillText('HITS!', 0, 52); g.restore(); }
    // BOLT speech
    if (this.boltMsg && !this.banner) { const b = this.boltMsg, a = clamp(Math.min(b.t * 4, (b.dur - b.t) * 3), 0, 1); g.globalAlpha = a; g.font = `19px ${FONT}`; const lines = wrapText(g, b.text, 560), bh = 34 + lines.length * 24; g.fillStyle = 'rgba(255,255,255,0.95)'; rr(g, W / 2 - 300, 68, 600, bh, 16); g.fill(); g.fillStyle = '#1b6fd6'; g.textAlign = 'left'; g.font = `bold 15px ${FONT}`; g.fillText('BOLT', W / 2 - 284, 84); g.fillStyle = '#14182a'; g.font = `19px ${FONT}`; lines.forEach((l, i) => g.fillText(l, W / 2 - 284, 108 + i * 24)); g.globalAlpha = 1; }
    if (this.banner) { const b = this.banner, a = clamp(Math.min(b.t * 5, (b.dur - b.t) * 3), 0, 1); g.globalAlpha = a; g.fillStyle = 'rgba(8,10,20,0.72)'; g.fillRect(0, 232, W, b.sub ? 124 : 96); g.fillStyle = b.col; g.fillRect(0, 232, W, 4); g.fillRect(0, (b.sub ? 356 : 328) - 4, W, 4); g.textAlign = 'center'; g.font = `bold 56px ${FONT}`; g.fillText(b.text, W / 2 + (1 - a) * 80, 280); if (b.sub) { g.fillStyle = '#fff'; g.font = `24px ${FONT}`; g.fillText(b.sub, W / 2, 328); } g.globalAlpha = 1; }
    // controls help for brand-new players
    if (!UI.isTouch && S.stats.wins < 2 && !this.boss) {
      const keys = [['↑', 'Run'], ['← →', 'Turn'], ['SPACE', 'Jump'], ['J', 'Hit'], ['K', 'Blast'], ['L', 'Super']]; let x = 262; g.font = `bold 17px ${FONT}`;
      g.fillStyle = 'rgba(10,14,26,0.66)'; rr(g, 246, 668, 788, 40, 14); g.fill();
      for (const [k, v] of keys) { const kw = g.measureText(k).width + 18; g.fillStyle = '#ffe14d'; rr(g, x, 675, kw, 26, 6); g.fill(); g.fillStyle = '#14182a'; g.textAlign = 'center'; g.fillText(k, x + kw / 2, 689); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(v, x + kw + 8, 689); x += kw + 14 + g.measureText(v).width + 22; }
    }
  }
}
function wrapText(g, text, maxW) { const out = []; let line = ''; for (const w of String(text).split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
