'use strict';
/* ============================================================
   FIGHTER CRAFT - the 3D open city.
   One scene holds everything: free roaming, walk-in buildings,
   the airport, robot bases, district missions, camera and HUD.
   (combat.js, vehicles.js and panels.js extend this class.)
   ============================================================ */
const CS = 14, GN = 25, GC = 12, WORLD_R = GN * CS / 2, FLY_R = 430;
const cellX = i => (i - GC) * CS;
const ARENAS = [{ i: 12, j: 20 }, { i: 20, j: 12 }, { i: 12, j: 4 }, { i: 4, j: 12 }, { i: 20, j: 4 }], RUMBLE_AT = { i: 4, j: 20 }, ARENA_R = 30;
const BASE_AT = [{ i: 7.5, j: 22.5 }, { i: 22.5, j: 7.5 }, { i: 7.5, j: 1.5 }, { i: 1.5, j: 7.5 }, { i: 16.5, j: 1.5 }]; // one robot base per district
const AIR = { x0: cellX(17) - CS / 2, z0: cellX(17) - CS / 2, rx: cellX(22), heli: [88, 92], jet: [cellX(22), 78], office: [86, 132] };
const DCOL = ['#ffb347', '#ff3df2', '#7dd3ff', '#c8ff5a', '#ff5a5a', '#ffe14d'];
const DPAL = [['#a87058', '#bd8866', '#8a6470', '#9a8672'], ['#4a3e88', '#613a8a', '#3c4f8c', '#733c86'], ['#90aed2', '#a8c0e2', '#7a98be', '#bccee6'], ['#527058', '#62744e', '#46665e', '#727852'], ['#723442', '#823c3c', '#562e3a', '#883e48'], ['#7e8aa4', '#929ab2', '#707c96', '#9ea6ba']];
const DH = [[10, 26], [14, 40], [24, 62], [12, 34], [20, 56], [12, 30]];
const ENVS = [
  { amb: [0.34, 0.34, 0.44], sun: [0.32, 0.28, 0.32], fogD: 190, lit: 0.05, cl: [0.16, 0.14, 0.18], ca: 0.9 }, { amb: [0.42, 0.37, 0.45], sun: [0.62, 0.44, 0.33], fogD: 240, lit: 0.3, cl: [0.9, 0.62, 0.5], ca: 0.6 },
  { amb: [0.34, 0.33, 0.54], sun: [0.3, 0.32, 0.55], fogD: 270, lit: 0.65, cl: [0.36, 0.3, 0.55], ca: 0.5 }, { amb: [0.58, 0.62, 0.7], sun: [0.75, 0.72, 0.64], fogD: 380, lit: 0.25, cl: [1, 1, 1], ca: 0.8 },
  { amb: [0.6, 0.65, 0.68], sun: [0.78, 0.75, 0.64], fogD: 420, lit: 0.3, cl: [1, 1, 1], ca: 0.7 }, { amb: [0.64, 0.64, 0.62], sun: [0.82, 0.76, 0.58], fogD: 440, lit: 0.5, cl: [1, 0.97, 0.88], ca: 0.6 }];
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
  add(o) { if (this.p.length < 300) this.p.push(o); }
  spark(x, y, z, n, col = '#ffd23f', spd = 9) { const c = C3(col); for (let i = 0; i < n; i++) { const a = rand(TAU), u = rand(-0.4, 1), v = rand(spd * 0.3, spd), q = Math.sqrt(Math.max(0, 1 - u * u)); this.add({ k: 0, x, y, z, vx: Math.cos(a) * q * v, vy: u * v + 2, vz: Math.sin(a) * q * v, life: rand(0.25, 0.55), max: 0.55, c, s: 0.06, g: 16 }); } }
  smoke(x, y, z, n = 1, col = '#6a6a74') { const c = C3(col); for (let i = 0; i < n; i++) this.add({ k: 1, x: x + rand(-0.3, 0.3), y, z: z + rand(-0.3, 0.3), vx: rand(-0.6, 0.6), vy: rand(1, 2.4), vz: rand(-0.6, 0.6), life: rand(0.5, 0.9), max: 0.9, c, s: rand(0.1, 0.2), g: 0 }); }
  debris(x, y, z, n, col) { const c = C3(col); for (let i = 0; i < n; i++) this.add({ k: 2, x, y, z, vx: rand(-7, 7), vy: rand(4, 12), vz: rand(-7, 7), life: rand(0.9, 1.5), max: 1.5, c, s: rand(0.08, 0.2), g: 26, r: rand(TAU) }); }
  ring(x, z, col, r = 4, y = 0.15) { this.rings.push({ x, z, y, r, life: 0.4, max: 0.4, c: C3(col) }); }
  update(dt) {
    for (let i = this.p.length - 1; i >= 0; i--) { const p = this.p[i]; p.life -= dt; if (p.life <= 0) { this.p[i] = this.p[this.p.length - 1]; this.p.pop(); continue; } p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.k === 2 && p.y < 0.1 && p.vy < 0) { p.y = 0.1; p.vy *= -0.35; p.vx *= 0.6; p.vz *= 0.6; } }
    for (let i = this.rings.length - 1; i >= 0; i--) { this.rings[i].life -= dt; if (this.rings[i].life <= 0) this.rings.splice(i, 1); }
  }
  draw() {
    for (const p of this.p) {
      const a = p.life / p.max;
      if (p.k === 0) G3.aglow(p.x, p.y, p.z, p.s, p.s, p.s, p.c, a * 1.6);
      else if (p.k === 1) { const s = p.s * (1.9 - a); G3.amesh(p.x, p.y, p.z, SPT, s, s, s, p.c, 0); }
      else G3.box(M4.ry(M4.rx(M4.t(ID4, p.x, p.y, p.z), p.r + p.life * 9), p.r), p.s, p.s * 0.5, p.s * 1.4, p.c, -0.5);
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
    this.h = { x: 0, y: 0, z: 6, vx: 0, vz: 0, vy: 0, yaw: 0, on: true, jumps: 0, hp: 1, maxHp: 1, en: 1, maxEn: 1, sup: 0, atk: null, chain: 0, chainT: 0, buf: false, hurtT: 0, inv: 0, blastT: 0, superT: 0, supTick: 0, jet: false, boost: 0, calm: 9, mv: 0, veh: null, chute: false, climb: false };
    this.refresh(true);
    this.camYaw = 0; this.eye = [0, 5, -3]; this.shake = 0; this.hitstop = 0; this.slow = 0; this.flash = 0;
    this.mis = null; this.panel = null; this.padLock = null; this.padT = 0; this.cut = null; this.banner = null; this.preview = -1; this.camFront = false;
    this.combo = 0; this.comboT = 0; this.comboPop = 0; this.maxCombo = 0; this.coinPulse = 0; this.roamT = 2; this.saidDizzy = false; this.hint = 0;
    this.bolt = { x: 1.5, y: 2.2, z: 6 }; this.proj = M4.persp(1.05, W / H, 0.3, 950); this.vp = M4.id();
    this.vehs = [{ type: 'car', x: 7, y: 0, z: 13, yaw: 0, speed: 0, spin: 0, away: 0 }, { type: 'heli', x: AIR.heli[0], y: 0, z: AIR.heli[1], yaw: 0, speed: 0, away: 0 }, { type: 'jet', x: AIR.jet[0], y: 1.25, z: AIR.jet[1], yaw: 0, speed: 0, away: 0, roll: 0, pitch: 0 }];
    this.pal = null; this.bases = [];
    this.build(); this.initPal();
  }
  refresh(full) { const h = this.h; h.maxHp = Calc.maxHp(); h.maxEn = Calc.maxEnergy(); this.power = Calc.power(); if (full) { h.hp = h.maxHp; h.en = h.maxEn; } else { h.hp = Math.min(h.hp, h.maxHp); h.en = Math.min(h.en, h.maxEn); } }

  /* ---------------- building the city ---------------- */
  isOpen(i, j) {
    if (i < 0 || j < 0 || i >= GN || j >= GN) return false;
    if (i % 3 === 0 || j % 3 === 0) return true;
    if (i >= 17 && j >= 17) return true; // the airport
    if (Math.abs(i - GC) <= 2 && Math.abs(j - GC) <= 2) return true;
    for (const a of ARENAS) if (Math.abs(i - a.i) <= 2 && Math.abs(j - a.j) <= 2) return true;
    for (const b of BASE_AT) if (Math.abs(i - b.i) < 1 && Math.abs(j - b.j) < 1) return true;
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
    return { top, hor, fog: mixC(mid, hor, 0.7), amb: E.amb, sunCol: E.sun, sun: SUN_DIR, fogD: E.fogD, litA: [lit(0), lit(1), lit(2)], litB: [lit(3), lit(4), lit(5)], sunDisc: L === 0 ? [0, 0, 0] : L === 2 ? [0.5, 0.5, 0.6] : [1, 0.9, 0.7], sunScr: [0, 0, 0], cloud: E.cl, cloudA: E.ca, yaw: 0, time: 0 };
  }
  inAirport(x, z) { return x > AIR.x0 && z > AIR.z0; }
  inArena(x, z, r) { for (const a of ARENAS.concat([RUMBLE_AT])) if (Math.hypot(x - cellX(a.i), z - cellX(a.j)) < r) return true; return false; }
  nearBase(x, z, r) { for (const b of BASE_AT) if (Math.hypot(x - cellX(b.i), z - cellX(b.j)) < r) return true; return false; }
  isBlockRoad(k, q) { // a road line cell that is not inside the plaza, an arena or the airport
    if (Math.abs(k - GC) <= 2 && Math.abs(q - GC) <= 2) return false;
    if (k >= 17 && q >= 17) return false;
    for (const a of ARENAS.concat([RUMBLE_AT])) if ((Math.abs(k - a.i) <= 2 && Math.abs(q - a.j) <= 2) || (Math.abs(q - a.i) <= 2 && Math.abs(k - a.j) <= 2)) return false;
    return true;
  }
  solid(x0, x1, z0, z1, top) { this.props.push({ x0, x1, z0, z1, top }); }
  build() {
    const L = this.L = Calc.cityLevel(), A = S.armor; this.env = this.envFor(L, A);
    this.solids = []; this.props = []; this.lamps = []; this.roofs = []; this.cellSolid = new Uint16Array(GN * GN);
    G3.staticBegin(330000);
    const gold = L >= 5, day = L >= 3, pave = C3(day ? '#b4bccb' : '#666a78');
    G3.abox(0, -0.5, 0, 700, 0.5, 700, C3(day ? '#555b68' : '#3a3d47'), 9);
    G3.abox(0, 0.04, 0, 2.5 * CS, 0.04, 2.5 * CS, C3(gold ? '#ecd9a0' : L >= 3 ? '#c2cada' : L >= 1 ? '#868da0' : '#62656f'), 10);
    for (let k = 0; k < 8; k++) G3.box(M4.ry(M4.t(ID4, 0, 0.09, 0), k * 0.3927), 4.4, 0.012, 0.12, C3(gold ? '#ffd23f' : '#39d0ff'), L >= 1 ? 0.5 : 0.2);
    G3.amesh(0, 0.09, 0, CYL, 1.3, 0.02, 1.3, C3(gold ? '#ffd23f' : '#39d0ff'), L >= 1 ? 0.5 : 0.2);
    ARENAS.forEach((a, d) => G3.abox(cellX(a.i), 0.04, cellX(a.j), 2.5 * CS, 0.04, 2.5 * CS, mixC(C3(DPAL[d][0]), C3('#5a5e68'), A[d] ? 0.3 : 0.7), 10));
    G3.abox(cellX(RUMBLE_AT.i), 0.04, cellX(RUMBLE_AT.j), 2.5 * CS, 0.04, 2.5 * CS, C3('#74504e'), 10);
    const lane = C3(day ? '#eef1f6' : '#b3a468');
    for (let k = 0; k < GN; k += 3) for (let q = 0; q < GN; q++) { if (q % 3 === 0 || !this.isBlockRoad(k, q)) continue; G3.abox(cellX(k), 0.02, cellX(q), 0.13, 0.02, 2.4, lane); G3.abox(cellX(q), 0.02, cellX(k), 2.4, 0.02, 0.13, lane); }
    // buildings
    for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
      if (this.isOpen(i, j)) continue;
      const d = this.districtOf(i, j), ruin = d === 5 ? L === 0 : !A[d], r = rng(i * 131 + j * 977 + 5), pal = DPAL[d], hr = DH[d];
      let h = hr[0] + r() * (hr[1] - hr[0]); const low = r() < 0.2; if (low) h = 5 + r() * 4;
      let col = C3(pal[Math.floor(r() * 4)]); if (ruin) { col = mulC(mixC(col, [0.38, 0.36, 0.4], 0.6), 0.85); h *= 0.55 + r() * 0.3; } else if (gold && d === 5) col = mixC(col, C3('#e8d59a'), 0.35);
      const half = CS / 2 - 1 - r() * 0.8, x = cellX(i), z = cellX(j), E = CS / 2;
      const x0 = x - (this.isOpen(i - 1, j) ? half : E), x1 = x + (this.isOpen(i + 1, j) ? half : E), z0 = z - (this.isOpen(i, j - 1) ? half : E), z1 = z + (this.isOpen(i, j + 1) ? half : E), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2;
      G3.abox(x, 0.1, z, CS / 2 - 0.25, 0.1, CS / 2 - 0.25, pave, 10);
      G3.abox(mx, h / 2, mz, hx, h / 2, hz, col, 2 + d);
      this.solids.push({ x0, x1, z0, z1, top: h }); this.cellSolid[i + j * GN] = this.solids.length; this.roofs.push([mx, mz, h, hx, hz]);
      if (ruin) { const n = 2 + Math.floor(r() * 2); for (let q = 0; q < n; q++) { const bh = 1 + r() * 5, bs = half * (0.25 + r() * 0.3); G3.box(M4.ry(M4.t(ID4, x + (r() - 0.5) * half, h + bh / 2, z + (r() - 0.5) * half), r()), bs, bh / 2, bs * 0.7, col, 2 + d); } }
      else {
        G3.abox(mx, h + 0.22, mz, hx + 0.22, 0.22, hz + 0.22, mulC(col, 0.78)); // cornice
        if (!low && r() < 0.4) { const th = 4 + r() * h * 0.3, ts = 0.55 + r() * 0.2; G3.abox(mx, h + th / 2, mz, hx * ts, th / 2, hz * ts, mixC(col, WHITE, 0.08), 2 + d); G3.abox(mx, h + th + 0.18, mz, hx * ts + 0.18, 0.18, hz * ts + 0.18, mulC(col, 0.78)); if (gold && r() < 0.6) G3.amesh(mx, h + th + 5, mz, CONE, 1.2, 5, 1.2, C3('#ffd86b'), -0.9); }
        else if (r() < 0.45) { const tx = mx + (r() - 0.5) * hx, tz = mz + (r() - 0.5) * hz; G3.amesh(tx, h + 1.5, tz, CYX, 1.0, 1.1, 1.0, C3('#8a6a4a'), 0); G3.amesh(tx, h + 2.9, tz, CONE, 1.1, 0.35, 1.1, C3('#5a4030'), 0); G3.amesh(tx, h + 0.3, tz, CYX, 0.12, 0.4, 0.12, C3('#3a3d48'), 0); }
        if (r() < 0.5) G3.abox(mx + (r() - 0.5) * hx, h + 0.75, mz + (r() - 0.5) * hz, 1.1, 0.5, 0.9, C3('#9aa0ac'), -0.4);
        if (r() < 0.3) { G3.amesh(mx + hx * 0.5, h + 3.2, mz - hz * 0.5, CYX, 0.07, 3, 0.07, C3('#555a66'), 0); G3.amesh(mx + hx * 0.5, h + 6.3, mz - hz * 0.5, SPX, 0.16, 0.16, 0.16, C3('#ff4433'), 1); }
        if (L >= 4 && r() < 0.5) { G3.abox(mx, h + 0.5, mz, hx * 0.7, 0.06, hz * 0.7, C3('#4fbf6b'), 11); G3.amesh(mx - hx * 0.3, h + 1.5, mz + hz * 0.25, SPX, 0.9, 0.9, 0.9, C3('#3fa85a'), 0); }
        if (low) { const ac = C3(['#ff6b6b', '#ffd23f', '#5fd68a', '#4da6ff'][Math.floor(r() * 4)]); G3.abox(mx, 3.65, mz, hx + 0.75, 0.1, hz + 0.75, ac, -0.2); if (r() < 0.6) { G3.amesh(mx, h + 2.2, mz, CYX, 0.1, 1.8, 0.1, C3('#555a66'), 0); G3.abox(mx, h + 4.4, mz, 2.6, 1.1, 0.12, ac, 0.75); } }
      }
      if (d === 1 && r() < 0.7) G3.abox(x + (r() < 0.5 ? 1 : -1) * (half + 0.16), 6 + r() * 6, z + (r() - 0.5) * 5, 0.12, 1.2 + r() * 2, 2.2, C3(r() < 0.5 ? '#ff3df2' : '#3df2ff'), ruin ? 0.12 : 1);
    }
    // street lamps, trees and parked cars at crossings
    for (let j = 0; j < GN; j += 3) for (let i = 0; i < GN; i += 3) {
      if ((Math.abs(i - GC) <= 2 && Math.abs(j - GC) <= 2) || (i >= 17 && j >= 17)) continue;
      const d = this.districtOf(i, j), ok = d === 5 ? L >= 1 : A[d], x = cellX(i) + CS / 2 - 0.9, z = cellX(j) + CS / 2 - 0.9, r = rng(i * 17 + j * 71);
      G3.amesh(x, 3, z, CYX, 0.09, 3, 0.09, C3('#3a3d48'), -0.4); G3.box(M4.t(ID4, x - 0.45, 6, z), 0.55, 0.05, 0.06, C3('#3a3d48')); G3.amesh(x - 0.95, 5.88, z, SPX, 0.3, 0.14, 0.2, C3(DCOL[d]), ok ? 1 : 0.08); if (ok) this.lamps.push([x - 0.95, z, C3(DCOL[d])]);
      if (ok && L >= 3 && r() < 0.8) tree3(cellX(i) - CS / 2 + 0.9, cellX(j) - CS / 2 + 0.9, 0.9 + r() * 0.3, d === 3);
      if (r() < 0.45) { const cx = cellX(i) + (r() < 0.5 ? -1 : 1) * (CS / 2 - 1.6), cz = cellX(j) + (r() - 0.5) * 4 + (r() < 0.5 ? 16 : -16), cc = ok ? C3(['#e5383b', '#2f7df6', '#ffd23f', '#f4f8ff', '#2fbf71'][Math.floor(r() * 5)]) : C3('#34343c'); if (!this.inArena(cx, cz, 38) && Math.hypot(cx, cz) > 48 && !this.inAirport(cx, cz) && !this.nearBase(cx, cz, 18) && Math.abs(cx) < WORLD_R - 4 && Math.abs(cz) < WORLD_R - 4) { car3(M4.t(ID4, cx, 0, cz), cc, 0, false, true); this.solid(cx - 0.95, cx + 0.95, cz - 2.1, cz + 2.1, 1.3); } }
    }
    this.buildLandmarks(L, A); this.buildAirport(L); this.buildSpots(L); this.buildBases();
    G3.staticEnd();
    this.makeMap();
    // coin barrels in the streets and on rooftops, and friendly citizens in saved districts
    if (!this.crates.length) {
      const r = rng(99);
      for (let n = 0; n < 46; n++) { const k = Math.floor(r() * 9) * 3, q = r() * (GN - 1), vert = r() < 0.5, x = vert ? cellX(k) + (r() - 0.5) * 8 : cellX(q), z = vert ? cellX(q) : cellX(k) + (r() - 0.5) * 8; if (Math.hypot(x, z) < 20 || this.inArena(x, z, 12) || this.inAirport(x, z) || this.nearBase(x, z, 20) || this.blocked(x, z, 1.2)) continue; this.crates.push({ x, y: 0, z, gold: r() < 0.18, hitT: 0, dead: false, resp: 0, rot: r() * 3 }); }
      for (let n = 0; n < this.roofs.length; n += 9) { const R = this.roofs[n]; this.crates.push({ x: R[0], y: R[2], z: R[1], gold: true, hitT: 0, dead: false, resp: 0, rot: r() * 3, roof: true }); }
    }
    this.cits = []; const cr = rng(7 + L);
    const addCit = (hx, hz, rad) => { const pal = ['#e5383b', '#2f7df6', '#ffd23f', '#2fbf71', '#9b5de5', '#ff8c1a', '#f4f8ff']; this.cits.push({ x: hx + (cr() - 0.5) * rad, z: hz + (cr() - 0.5) * rad, y: 0, hx, hz, rad, tx: hx, tz: hz, yaw: cr() * TAU, wait: cr() * 3, moving: false, ph: cr() * 9, s: 0.85 + cr() * 0.2, c1: C3(pal[Math.floor(cr() * 7)]), c2: C3(['#2a2e39', '#3a4a6a', '#5a4030'][Math.floor(cr() * 3)]), skin: C3(['#f2b98a', '#d99a6c', '#a86a44'][Math.floor(cr() * 3)]), hair: C3(['#3b2a20', '#1c1c22', '#c98f3c'][Math.floor(cr() * 3)]) }); };
    for (let n = 0; n < L * 2; n++) addCit(0, 0, 50);
    ARENAS.forEach((a, d) => { if (A[d]) for (let n = 0; n < 4; n++) addCit(cellX(a.i), cellX(a.j), 54); });
  }
  buildLandmarks(L, A) {
    // Rusty Harbor: sea, cranes, containers
    const hz = cellX(ARENAS[0].j);
    G3.abox(0, -0.3, WORLD_R + 270, 700, 0.32, 260, C3(A[0] ? '#2f7fd6' : '#2a3a4a'), 12);
    for (let k = -1; k <= 0; k++) { const x = k * 52 + 10, z = WORLD_R - 4, c = C3(A[0] ? '#ffb347' : '#5a4038'); G3.amesh(x, 14, z, CYX, 0.6, 14, 0.6, c, -0.4); G3.abox(x + 6, 27, z, 9, 0.5, 0.5, c, -0.4); G3.abox(x + 13, 22, z, 0.08, 5, 0.08, C3('#22242a')); this.solid(x - 0.6, x + 0.6, z - 0.6, z + 0.6, 28); }
    const cc = ['#8a3b2c', '#2c5d8a', '#7a6a2c', '#3a7a4a'];
    for (let k = 0; k < 4; k++) { const x = (k < 2 ? -1 : 1) * 31, z = hz + (k % 2 ? -1 : 1) * 31; for (let q = 0; q < 2; q++) G3.abox(x, 1.3 + q * 2.6, z, 3, 1.28, 1.4, C3(cc[(k + q) % 4]), -0.3); this.solid(x - 3, x + 3, z - 1.4, z + 1.4, 5.2); }
    // Sky Bridge: elevated highway
    const sx = cellX(ARENAS[2].i), sz = cellX(ARENAS[2].j);
    for (const dz of [-38, 38]) { G3.abox(sx, 15, sz + dz, 62, 0.6, 3.2, C3(A[2] ? '#dfe9f5' : '#6a7080'), 9); for (let k = -2; k <= 2; k++) G3.amesh(sx + k * 26 + 7, 7.2, sz + dz, CYL, 0.9, 7.2, 0.9, C3('#8a93a6'), 0); G3.abox(sx, 16, sz + dz, 62, 0.12, 0.16, C3('#7dd3ff'), A[2] ? 1 : 0.1); }
    // Furnace Works: smokestacks
    const fx = cellX(ARENAS[3].i), fz = cellX(ARENAS[3].j);
    for (let k = 0; k < 4; k++) { const x = fx - 39, z = fz + (k - 1.5) * 16; G3.amesh(x, 16, z, TAPER, 2.3, 16, 2.3, C3('#5a5f58'), 0); G3.amesh(x, 32.2, z, CYL, 1.4, 0.4, 1.4, C3(A[3] ? '#5fd68a' : '#ff7b00'), 1); this.solid(x - 1.9, x + 1.9, z - 1.9, z + 1.9, 33); }
    // Core Tower
    const tx = cellX(ARENAS[4].i) + 40, tz = cellX(ARENAS[4].j) - 40, tc = A[4] ? '#ffd86b' : '#ff2244';
    G3.amesh(tx, 55, tz, TAPER, 9, 55, 9, C3(A[4] ? '#dfe9f5' : '#20222e'), -0.5); G3.amesh(tx, 116, tz, SPL, 4, 5, 4, C3(tc), 0.9);
    for (let y = 14; y < 108; y += 16) { const rr = 9 - y * 0.037; G3.amesh(tx, y, tz, CYL, rr + 0.5, 0.5, rr + 0.5, C3(tc), 1); }
    this.solid(tx - 8, tx + 8, tz - 8, tz + 8, 110);
    // Rumble stadium ring
    const rx = cellX(RUMBLE_AT.i), rz = cellX(RUMBLE_AT.j);
    for (let k = 0; k < 20; k++) { const a = k * TAU / 20; G3.box(M4.rx(M4.ry(M4.t(ID4, rx + Math.cos(a) * 34, 2.5, rz + Math.sin(a) * 34), -a + HPI), 0.3), 5.2, 2.5, 0.5, C3(k % 2 ? '#8a3a3a' : '#a04848'), -0.3); }
  }
  buildAirport(L) {
    const cx = (AIR.x0 + WORLD_R) / 2, cz = (AIR.z0 + WORLD_R) / 2, hw = (WORLD_R - AIR.x0) / 2, white = C3('#eef1f6'), rx = AIR.rx;
    G3.abox(cx, 0.03, cz, hw, 0.03, hw, C3(L >= 3 ? '#7c8492' : '#555a66'), 9);
    G3.abox(rx, 0.05, cz + 2, 8, 0.03, hw - 4, C3('#2c2f38'), 9); // runway
    for (let z = AIR.z0 + 12; z < WORLD_R - 8; z += 9) G3.abox(rx, 0.09, z, 0.3, 0.012, 2.4, white);
    for (const z of [AIR.z0 + 5, WORLD_R - 3]) for (let k = -3; k <= 3; k++) G3.abox(rx + k * 1.9, 0.09, z, 0.5, 0.012, 2.2, white);
    for (const s of [-1, 1]) { G3.abox(rx + s * 8.3, 0.09, cz + 2, 0.12, 0.012, hw - 4, C3('#ffd23f')); for (let z = AIR.z0 + 10; z < WORLD_R; z += 18) G3.amesh(rx + s * 9.2, 0.3, z, SPX, 0.2, 0.2, 0.2, C3(s < 0 ? '#39d0ff' : '#5dff9a'), 1); }
    G3.abox(rx + 19, 0.06, cz, 6, 0.04, hw - 2, C3('#4fa85f'), 11);
    // helipad
    const [hx, hz] = AIR.heli; G3.amesh(hx, 0.07, hz, CYL, 7, 0.03, 7, C3('#3a3f4d'), 9); G3.amesh(hx, 0.1, hz, CYL, 6.6, 0.02, 6.6, C3('#ffd23f')); G3.amesh(hx, 0.12, hz, CYL, 6.1, 0.02, 6.1, C3('#3a3f4d'), 9);
    for (const s of [-1, 1]) G3.abox(hx + s * 1.5, 0.15, hz, 0.35, 0.012, 2.4, white); G3.abox(hx, 0.15, hz, 1.5, 0.012, 0.35, white);
    // hangar with a rounded roof
    const gx = 104, gz = 156; G3.abox(gx, 3, gz, 11, 3, 8, C3('#8f9bb0'), -0.3); G3.mesh(M4.rz(M4.t(ID4, gx, 6, gz), HPI), CYL, 4.2, 11, 8, C3('#c9d2e0'), -0.5); G3.abox(gx, 2.6, gz - 8.05, 8, 2.6, 0.06, C3('#23262e')); this.solid(gx - 11, gx + 11, gz - 8, gz + 8, 10);
    // control tower
    const tx = 118, tz = 112; G3.amesh(tx, 9, tz, TAPER, 2.6, 9, 2.6, C3('#dfe6f0'), -0.3); G3.amesh(tx, 19.5, tz, CYL, 3.6, 1.6, 3.6, C3('#16202e'), -0.95); G3.amesh(tx, 21.3, tz, CYL, 3.9, 0.25, 3.9, C3('#dfe6f0')); G3.amesh(tx, 23.5, tz, CYX, 0.08, 2, 0.08, C3('#555a66')); G3.amesh(tx, 25.6, tz, SPX, 0.25, 0.25, 0.25, C3('#ff4433'), 1); this.solid(tx - 2.4, tx + 2.4, tz - 2.4, tz + 2.4, 22);
    // terminal office
    const [ox, oz] = AIR.office; G3.abox(ox, 2.6, oz, 6, 2.6, 5, C3('#e8eef6'), 2 + 2); G3.abox(ox, 5.4, oz, 6.5, 0.25, 5.5, C3('#39a0ff'), -0.5); G3.abox(ox, 3.9, oz - 5.1, 2.4, 0.5, 0.08, C3('#39d0ff'), 1); this.solid(ox - 6, ox + 6, oz - 5, oz + 5, 5.6);
    for (let k = 0; k < 4; k++) { const px = 70 + k * 5, pz = 164; car3(M4.ry(M4.t(ID4, px, 0, pz), 0), C3(['#e5383b', '#f4f8ff', '#2f7df6', '#ffd23f'][k]), 0, false, true); this.solid(px - 0.95, px + 0.95, pz - 2.1, pz + 2.1, 1.3); }
    for (let k = 0; k < 5; k++) tree3(AIR.x0 + 3, AIR.z0 + 8 + k * 22, 1, true);
  }
  buildSpots(L) {
    this.pads = [];
    for (const s of SPOTS) {
      const ax = Math.abs(s.x) > Math.abs(s.z), dx = ax ? -sign(s.x) : 0, dz = ax ? 0 : -sign(s.z), lv = s.b ? S.build[s.id] : 1, col = C3(s.col);
      const fr = (ox, oy, oz, hx, hy, hz, c, e) => G3.abox(s.x + dx * oz + (dx ? 0 : ox), oy, s.z + dz * oz + (dz ? 0 : ox), dx ? hz : hx, hy, dz ? hz : hx, c, e || 0); // "front-relative" box
      const fm = (ox, oy, oz, M, sx, sy, sz, c, e) => G3.amesh(s.x + dx * oz + (dx ? 0 : ox), oy, s.z + dz * oz + (dz ? 0 : ox), M, sx, sy, sz, c, e || 0);
      let top = 0, solid = true;
      if (s.b && !lv) { // empty building lot
        solid = false; for (const a of [-1, 1]) for (const b of [-1, 1]) G3.amesh(s.x + a * 4, 0.8, s.z + b * 4, CYX, 0.1, 0.8, 0.1, C3('#d98e2b'));
        for (const a of [-1, 1]) { G3.abox(s.x + a * 4, 1.1, s.z, 0.04, 0.1, 4, C3('#ffd23f')); G3.abox(s.x, 1.1, s.z + a * 4, 4, 0.1, 0.04, C3('#ffd23f')); }
        G3.abox(s.x, 0.1, s.z, 4, 0.05, 4, C3('#7a6a55'), 11); fr(0, 2.2, 4, 1.3, 0.8, 0.08, C3('#2b3242')); fm(0, 2.2, 4.12, SPX, 0.4, 0.4, 0.05, col, 1);
      } else if (s.id === 'dojo') { top = 5; G3.abox(s.x, 2.5, s.z, 4.2, 2.5, 4.2, C3('#c9684e'), -0.1); G3.amesh(s.x, 5.6, s.z, CONE, 6.6, 0.9, 6.6, C3('#7a1f1f'), -0.3); G3.amesh(s.x, 6.9, s.z, CYL, 2.4, 0.8, 2.4, C3('#d98060')); G3.amesh(s.x, 8.3, s.z, CONE, 3.9, 0.8, 3.9, C3('#7a1f1f'), -0.3); G3.amesh(s.x, 9.4, s.z, SPX, 0.3, 0.45, 0.3, C3('#ffd23f'), 0.6); for (const a of [-1, 1]) fm(a * 3.4, 2.5, 4.3, CYX, 0.3, 2.5, 0.3, C3('#7a1f1f')); fr(0, 1.6, 4.25, 1.2, 1.6, 0.05, C3('#2a1d14')); fr(0, 3.9, 4.3, 2.2, 0.45, 0.06, col, 1); }
      else if (s.id === 'armor') { top = 7; G3.amesh(s.x, 3.5, s.z, CYL, 4.4, 3.5, 4.4, C3('#ece6f7'), -0.3); G3.amesh(s.x, 7, s.z, SPH, 4.5, 2.6, 4.5, C3('#9d7be0'), -0.7); for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + 0.39; G3.amesh(s.x + Math.cos(a) * 4.5, 3, s.z + Math.sin(a) * 4.5, CYX, 0.35, 3, 0.35, C3('#fbf7ff'), -0.3); } fr(0, 1.7, 4.45, 1.3, 1.7, 0.1, C3('#3a2a5a')); fr(0, 4.2, 4.5, 1.6, 0.45, 0.1, col, 1); G3.amesh(s.x, 10.4, s.z, SPL, 0.7, 0.9, 0.7, col, 0.9); }
      else if (s.id === 'rumble') { solid = false; const on = S.stage >= 3; for (const a of [-1, 1]) { const px = s.x + (dz ? a * 3 : 0), pz = s.z + (dx ? a * 3 : 0); G3.amesh(px, 3, pz, CYL, 0.6, 3, 0.6, C3('#6a3232'), -0.3); this.solid(px - 0.6, px + 0.6, pz - 0.6, pz + 0.6, 6); } G3.abox(s.x, 6.4, s.z, dz ? 3.8 : 0.7, 0.5, dx ? 3.8 : 0.7, col, on ? 1 : 0.1); }
      else if (s.id === 'workshop') { top = 4 + lv; G3.abox(s.x, top / 2, s.z, 4.4, top / 2, 4.4, C3('#b85c44'), 2); G3.abox(s.x, top + 0.2, s.z, 4.7, 0.2, 4.7, C3('#3d4654')); G3.amesh(s.x + 2.5, top + 1.6, s.z - 2.5, CYX, 0.5, 1.6, 0.5, C3('#566472')); fr(-1.4, 1.5, 4.45, 1.5, 1.5, 0.05, C3('#2a303b')); fr(-1.4, 1.5, 4.5, 1.4, 0.08, 0.05, col, 1); G3.mesh(M4.rx(M4.ry(M4.t(ID4, s.x + dx * 4.5 + (dx ? 0 : 2), 3 + lv * 0.5, s.z + dz * 4.5 + (dz ? 0 : 2)), dx ? HPI : 0), HPI), CYL, 0.9, 0.08, 0.9, col, 0.9); }
      else if (s.id === 'bank') { top = 4 + lv * 0.8; G3.abox(s.x, top / 2, s.z, 4.4, top / 2, 4.4, C3('#ece5d3'), -0.1); G3.abox(s.x, top + 0.4, s.z, 4.9, 0.4, 4.9, C3('#d6cdb5')); G3.amesh(s.x, top + 0.8, s.z, SPL, 2.6, 1.9, 2.6, C3('#ffd86b'), -0.9); for (let q = -1; q <= 1; q += lv >= 2 ? 0.5 : 1) fm(q * 3.4, top / 2, 4.75, CYX, 0.36, top / 2, 0.36, C3('#fbf7ea'), -0.2); fr(0, 1.5, 4.45, 1.1, 1.5, 0.05, C3('#5a4a2a')); G3.mesh(M4.rx(M4.ry(M4.t(ID4, s.x, top + 3.6, s.z), dx ? HPI : 0), HPI), CYL, 0.9, 0.12, 0.9, col, 1); }
      else if (s.id === 'hospital') { top = 4 + lv * 1.6; G3.abox(s.x, top / 2, s.z, 4.4, top / 2, 4.4, C3('#f4f8ff'), 2 + 2); G3.abox(s.x, top + 0.2, s.z, 4.6, 0.2, 4.6, C3('#cfd9e6')); fr(0, top - 1.2, 4.46, 0.3, 1, 0.05, C3('#e63946'), 1); fr(0, top - 1.2, 4.47, 1, 0.3, 0.05, C3('#e63946'), 1); fm(0, 1.6, 4.4, CYL, 1.6, 1.6, 0.6, C3('#7dd3ff'), 0.5); G3.abox(s.x, top + 1.1, s.z, 0.25, 0.9, 0.9, C3('#e63946'), 1); G3.abox(s.x, top + 1.1, s.z, 0.9, 0.9, 0.25, C3('#e63946'), 1); }
      else if (s.id === 'plant') { top = 7; for (let q = 0; q < lv; q++) { const px = s.x + (dx ? 0 : (q - (lv - 1) / 2) * 3.1), pz = s.z + (dz ? 0 : (q - (lv - 1) / 2) * 3.1); G3.amesh(px, 3.6, pz, TAPER, 1.7, 3.6, 1.7, C3('#d2d7de'), -0.2); G3.amesh(px, 7.25, pz, CYL, 1.0, 0.12, 1.0, col, 1); } G3.abox(s.x, 0.6, s.z, 4.4, 0.6, 4.4, C3('#59616f')); }
      else if (s.id === 'park') { solid = false; G3.amesh(s.x, 0.12, s.z, CYL, 6, 0.06, 6, C3('#4fbf6b'), 11); const r = rng(31); for (let q = 0; q < 1 + lv * 2; q++) tree3(s.x + (r() - 0.5) * 9, s.z + (r() - 0.5) * 9, 0.9 + r() * 0.3, false); if (lv >= 2) { G3.amesh(s.x, 0.4, s.z, CYL, 1.6, 0.4, 1.6, C3('#c2cddc'), -0.3); G3.amesh(s.x, 0.82, s.z, CYL, 1.4, 0.03, 1.4, C3('#7dd3ff'), 12); G3.amesh(s.x, 1.5, s.z, SPX, 0.3, 0.9, 0.3, C3('#bfe9ff'), 0.7); } if (lv >= 3) { G3.amesh(s.x + 3.4, 0.5, s.z + 3.4, CYL, 0.8, 0.5, 0.8, C3('#b8a977')); G3.amesh(s.x + 3.4, 2, s.z + 3.4, SPL, 0.3, 1.0, 0.24, C3('#ffd86b'), -0.95); G3.amesh(s.x + 3.4, 3.2, s.z + 3.4, SPX, 0.22, 0.24, 0.22, C3('#ffd86b'), -0.95); } }
      if (solid) this.solid(s.x - 4.4, s.x + 4.4, s.z - 4.4, s.z + 4.4, top);
      this.pads.push({ id: s.id, x: s.x + dx * 8, z: s.z + dz * 8, r: 2.3, col: s.col, label: s.icon + ' ' + s.name, lx: s.x, lz: s.z, ly: Math.max(top, 3) + 4.6 });
    }
    // Robo Lab: where beaten robots are rebuilt into Robo-Pals
    G3.amesh(-9, 0.25, -9, CYL, 2.6, 0.25, 2.6, C3('#dfe6f0'), -0.4); G3.amesh(-9, 0.52, -9, CYL, 2.3, 0.03, 2.3, C3('#5dff9a'), 0.7);
    bot3({ x: -9, y: 0.5, z: -9, yaw: 0.8, t: 0, state: 'cheer', pal: true, flash: 0 }, LOOK3.scrapper); this.solid(-10, -8, -10, -8, 3);
    this.pads.push({ id: 'lab', x: -5.6, z: -5.6, r: 1.8, col: '#5dff9a', label: '🤖 ROBO LAB', lx: -9, lz: -9, ly: 4.6 });
    this.pads.push({ id: 'airport', x: AIR.office[0], z: AIR.office[1] - 8, r: 2.3, col: '#39d0ff', label: '✈️ AIRPORT', lx: AIR.office[0], lz: AIR.office[1], ly: 9 });
    ARENAS.forEach((a, d) => this.pads.push({ id: 'd' + d, x: cellX(a.i), z: cellX(a.j), r: 3.2, col: DCOL[d], label: DISTRICTS[d].icon + ' ' + DISTRICTS[d].name, lx: cellX(a.i), lz: cellX(a.j), ly: 9, d }));
  }
  makeMap() { // little top-down map for the corner of the screen
    this.map = mk(GN * 6, GN * 6, g => {
      for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) { g.fillStyle = this.isOpen(i, j) ? '#5a6078' : '#1c2030'; g.fillRect(i * 6, j * 6, 6, 6); }
      g.fillStyle = '#9aa4c0'; g.fillRect((GC - 2) * 6, (GC - 2) * 6, 30, 30); g.fillStyle = '#3f6f9a'; g.fillRect(17 * 6 - 3, 17 * 6 - 3, 51, 51); g.fillStyle = '#20232c'; g.fillRect(22 * 6, 17 * 6, 6, 48);
      ARENAS.forEach((a, d) => { g.fillStyle = DCOL[d]; g.globalAlpha = S.armor[d] ? 0.55 : 0.3; g.fillRect((a.i - 2) * 6, (a.j - 2) * 6, 30, 30); }); g.globalAlpha = 1;
    });
  }

  /* ---------------- collision ---------------- */
  pushOut(o, r, s) {
    if (o.y >= s.top - 0.25) return;
    const nx = clamp(o.x, s.x0, s.x1), nz = clamp(o.z, s.z0, s.z1), dx = o.x - nx, dz = o.z - nz, d2 = dx * dx + dz * dz;
    if (d2 >= r * r) return;
    this._hit = s;
    if (d2 > 1e-6) { const d = Math.sqrt(d2); o.x = nx + dx / d * r; o.z = nz + dz / d * r; }
    else { const l = o.x - s.x0, rr = s.x1 - o.x, t = o.z - s.z0, b = s.z1 - o.z, m = Math.min(l, rr, t, b); if (m === l) o.x = s.x0 - r; else if (m === rr) o.x = s.x1 + r; else if (m === t) o.z = s.z0 - r; else o.z = s.z1 + r; }
  }
  collide(o, r, lim = WORLD_R - 1.5) { // returns the wall that was touched (or null)
    this._hit = null; o.x = clamp(o.x, -lim, lim); o.z = clamp(o.z, -lim, lim);
    const ci = Math.floor(o.x / CS + GC + 0.5), cj = Math.floor(o.z / CS + GC + 0.5);
    for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) { if (i < 0 || j < 0 || i >= GN || j >= GN) continue; const s = this.cellSolid[i + j * GN]; if (s) this.pushOut(o, r, this.solids[s - 1]); }
    for (const s of this.props) if (o.x > s.x0 - r && o.x < s.x1 + r && o.z > s.z0 - r && o.z < s.z1 + r) this.pushOut(o, r, s);
    return this._hit;
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
    else if (!this.mis && this.hint < 1) { this.hint = 1; this.say(this.makeTip(), 6); }
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
    if (!S.stats.wins) return 'Run to the glowing orange beacon for your first mission. Press F near your car to drive there!';
    if (p < rec) return `The next mission needs Power ${rec}. You have ${p}. Walk into the Dojo to train!`;
    if (!S.pal && Object.values(S.cores).some(n => n >= 3)) return 'You have enough robot cores to build a Robo-Pal! Visit the Robo Lab in the plaza.';
    if (!S.veh.heli && S.coins >= 250) return 'You can afford the helicopter! Go to the airport in the south-east corner.';
    if (!S.bases[nd] && (S.veh.jet || S.veh.heli)) return `The robot base in ${DISTRICTS[nd].name} sends out patrol robots. Blow it up from the air!`;
    const b = BUILDINGS.find(x => this.canBuild(x) === true && S.coins >= x.cost[S.build[x.id]]);
    if (b) return `You have enough coins to build the ${b.name}! Walk to its spot in the plaza.`;
    return pick(TIPS);
  }
  canBuild(b) { const lv = S.build[b.id]; if (lv >= 3) return 'max'; const cap = clamp(this.L - b.city + 1, 0, 3); return cap <= 0 ? 'city' : lv >= cap ? 'cap' : true; }
  teleport(x, z, yaw) { const h = this.h; if (h.veh) this.leaveVeh(true); h.x = x; h.z = z; h.y = 0; h.vx = h.vz = h.vy = 0; h.on = true; h.chute = false; if (yaw != null) { h.yaw = yaw; this.camYaw = yaw; } if (this.pal) { this.pal.x = x - 1.5; this.pal.z = z; } }

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
    if (this.h.veh) this.upVehicle(dt); else this.upHero(dt);
    this.upVehs(dt);
    this.upCombat(dt);
    this.upBases(dt);
    this.upPal(dt);
    this.upPads(dt);
    this.upCamera(dt);
    const b = this.bolt, h = this.h, bx = h.x + Math.cos(h.yaw) * -1.3 - Math.sin(h.yaw) * 0.4, bz = h.z - Math.sin(h.yaw) * -1.3 - Math.cos(h.yaw) * 0.4, k = Math.min(1, dt * (h.veh ? 12 : 4));
    b.x = lerp(b.x, bx, k); b.z = lerp(b.z, bz, k); b.y = lerp(b.y, h.y + 2.3, k);
  }
  upCitizens(dt) {
    const h = this.h;
    for (const c of this.cits) {
      if (Math.abs(c.x - h.x) > 110 || Math.abs(c.z - h.z) > 110) continue;
      c.cheer = !h.veh && Math.hypot(c.x - h.x, c.z - h.z) < 6; c.moving = false;
      if (c.cheer) { c.yaw = lerpA(c.yaw, Math.atan2(h.x - c.x, h.z - c.z), Math.min(1, dt * 6)); continue; }
      if (c.wait > 0) { c.wait -= dt; if (c.wait <= 0) { c.tx = c.hx + rand(-c.rad, c.rad) / 2; c.tz = c.hz + rand(-c.rad, c.rad) / 2; c.walk = rand(4, 9); } continue; }
      const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz); c.walk -= dt;
      if (d < 0.6 || c.walk <= 0) { c.wait = rand(1, 4); continue; }
      c.yaw = lerpA(c.yaw, Math.atan2(dx, dz), Math.min(1, dt * 5)); c.x += Math.sin(c.yaw) * 1.7 * dt; c.z += Math.cos(c.yaw) * 1.7 * dt; c.moving = true; this.collide(c, 0.4);
    }
  }
  upPads(dt) {
    const h = this.h;
    if (this.padLock) { const p = this.pads.find(q => q.id === this.padLock); if (!p || Math.hypot(h.x - p.x, h.z - p.z) > p.r + 1.6) this.padLock = null; }
    this.onPad = null;
    if (this.mis || h.veh || !h.on || h.y > 0.5) { this.padT = 0; return; }
    let on = null; for (const p of this.pads) if (p.id !== this.padLock && Math.hypot(h.x - p.x, h.z - p.z) < p.r) on = p;
    this.onPad = on;
    if (on && this.en.every(e => Math.hypot(e.x - h.x, e.z - h.z) > 14)) { this.padT += dt; if (this.padT > 0.35) { this.padT = 0; this.padLock = on.id; this.openPanel(on.id); } } else this.padT = 0;
  }
  upCamera(dt) {
    const h = this.h, c = this.cut, v = h.veh;
    let ex, ey, ez, tx, ty, tz;
    if (c) { const a = c.t * 0.45 + h.yaw + Math.PI, rad = c.t < 3.2 ? 7 + c.t : 14 + (c.t - 3.2) * 5, hh = c.t < 3.2 ? 3 + c.t * 0.5 : 6 + (c.t - 3.2) * 5; ex = h.x + Math.sin(a) * rad; ez = h.z + Math.cos(a) * rad; ey = h.y + hh; tx = h.x; ty = h.y + 1.6 + (c.t > 3.2 ? (c.t - 3.2) * 1.6 : 0); tz = h.z; }
    else if (this.camFront) { const f = [Math.sin(h.yaw), Math.cos(h.yaw)]; ex = h.x + f[0] * 4.6; ez = h.z + f[1] * 4.6; ey = h.y + 1.7; tx = h.x + f[1] * 1.5; tz = h.z - f[0] * 1.5; ty = h.y + 1.15; this.camYaw = h.yaw; }
    else {
      this.camYaw = lerpA(this.camYaw, h.yaw, Math.min(1, dt * (v ? 4.5 : 7)));
      const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw), big = this.boss ? 2.5 : 0, hx = h.x, hy = h.y + 1.9, hz = h.z;
      const P = !v ? [7.4 + big, 4.0 + big * 0.6, 4, 1.7] : v.type === 'car' ? [10.5, 4.8, 6, 1.4] : v.type === 'heli' ? [16, 7.5, 7, 0.5] : [19, 6.5, 16, -3];
      ex = h.x - fx * P[0]; ez = h.z - fz * P[0]; ey = h.y + P[1]; tx = h.x + fx * P[2]; tz = h.z + fz * P[2]; ty = h.y + P[3];
      if (!v || v.type === 'car') {
        let t = 1; const ci = Math.floor(ex / CS + GC + 0.5), cj = Math.floor(ez / CS + GC + 0.5), hi = Math.floor(hx / CS + GC + 0.5), hj = Math.floor(hz / CS + GC + 0.5);
        for (let j = Math.min(cj, hj) - 1; j <= Math.max(cj, hj) + 1; j++) for (let i = Math.min(ci, hi) - 1; i <= Math.max(ci, hi) + 1; i++) { if (i < 0 || j < 0 || i >= GN || j >= GN) continue; const k = this.cellSolid[i + j * GN]; if (k) t = Math.min(t, this.rayHit(hx, hy, hz, ex, ey, ez, this.solids[k - 1])); }
        for (const s of this.props) if (s.top > 2 && Math.abs((s.x0 + s.x1) / 2 - hx) < 20 && Math.abs((s.z0 + s.z1) / 2 - hz) < 20) t = Math.min(t, this.rayHit(hx, hy, hz, ex, ey, ez, s));
        if (t < 1) { t = Math.max(0.05, t * 0.92); ex = hx + (ex - hx) * t; ey = hy + (ey - hy) * t + (1 - t) * 5.5; ez = hz + (ez - hz) * t; tx = h.x + fx * P[2] * t; tz = h.z + fz * P[2] * t; } // wall behind the hero: lift the camera above him
      }
    }
    const k = c || this.camFront ? 1 : Math.min(1, dt * (v && v.type === 'jet' ? 9 : 14)), e = this.eye; e[0] = lerp(e[0], ex, k); e[1] = lerp(e[1], ey, k); e[2] = lerp(e[2], ez, k);
    const sh = this.shake, g = this.tg || (this.tg = [tx, ty, tz]); g[0] = lerp(g[0], tx, k); g[1] = lerp(g[1], ty, k); g[2] = lerp(g[2], tz, k); this.tgt = [g[0] + (sh ? rand(-sh, sh) : 0), g[1] + (sh ? rand(-sh, sh) : 0), g[2]];
  }

  /* ---------------- armor + city upgrade cutscene ---------------- */
  startCut() {
    const L = S.pendingCity, A = S.armor.slice(); A[L - 1] = false; if (this.h.veh) this.leaveVeh(true);
    this.cut = { t: 0, L, armor: ARMOR[L - 1], step: 0 }; this.env = this.envFor(L - 1, A);
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
    env.yaw = Math.atan2(tg[0] - e[0], tg[2] - e[2]); env.time = t;
    G3.begin();
    const nd = this.nextDistrict(), near = (x, z, r) => Math.abs(x - h.x) < r && Math.abs(z - h.z) < r;
    for (const p of this.pads) {
      if (near(p.x, p.z, 90) && !this.mis) pad3(p.x, p.z, p.r, p.col, t, this.onPad === p);
      if (p.d != null && !this.mis) G3.agmesh(p.x, 60, p.z, CYX, 0.8, 60, 0.8, C3(p.col), p.d === nd ? 0.7 + Math.sin(t * 4) * 0.2 : 0.2);
    }
    for (const l of this.lamps) if (Math.abs(l[0] - e[0]) < 70 && Math.abs(l[1] - e[2]) < 70) G3.agmesh(l[0], 5.8, l[1], SPX, 1.1, 0.6, 1.1, l[2], 0.45);
    for (const c of this.cits) if (near(c.x, c.z, 75)) { G3.shadow(c.x, 0.05, c.z, 0.5, 0.35); citizen3(c, t); }
    for (const c of this.crates) if (!c.dead && near(c.x, c.z, 110)) { G3.shadow(c.x, c.y + 0.05, c.z, 0.9, 0.4); crate3(c); }
    for (const en of this.en) { const k = clamp(1 - en.y / 12, 0.4, 1); G3.shadow(en.x, 0.05, en.z, en.r * 1.5 * k, 0.45 * k); enemy3(en); }
    this.drawCombat(t); this.drawVehs(t); this.drawBases(t); this.drawPal(t);
    let pose = 'idle', pt = 0;
    if (this.cut || (this.mis && this.mis.state === 'win')) pose = 'win'; else if (h.hurtT > 0 || this.koT > 0 || (this.mis && this.mis.state === 'lose')) pose = 'hurt'; else if (h.superT > 0 || h.blastT > 0) pose = 'blast';
    else if (h.atk) { pose = h.atk.pose; pt = h.atk.t / h.atk.dur; } else if (h.chute) pose = 'chute'; else if (h.climb) pose = 'climb'; else if (!h.on) pose = h.jet ? 'hover' : h.vy > 0 ? 'jump' : 'fall'; else if (h.mv > 0.1) pose = 'run'; else if (h.mv < -0.1) pose = 'back';
    const arm = S.armor.slice(); if (this.preview >= 0) arm[this.preview] = true;
    const f = this.floorAt(h.x, h.z, h.y), sk = clamp(1 - (h.y - f) / 30, 0.25, 1);
    if (!h.veh) {
      G3.shadow(h.x, f + 0.05, h.z, 0.75 * sk, 0.5 * sk);
      if (!(h.inv > 0 && Math.floor(t * 18) % 2)) hero3({ x: h.x, y: h.y, z: h.z, yaw: h.yaw, t, pose, pt, armor: arm, suit: S.suit, melee: S.wp.m, ranged: S.wp.r, jet: h.jet, chute: h.chute });
      if (h.boost > 0) G3.agmesh(h.x, h.y + 1, h.z, SPX, 1.1, 1.4, 1.1, C3('#39d0ff'), 0.22 + Math.sin(t * 10) * 0.07);
      if (h.sup >= 100) G3.agmesh(h.x, h.y + 1, h.z, SPX, 1.0, 1.3, 1.0, C3('#ffd23f'), 0.14 + Math.sin(t * 8) * 0.05);
    }
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
  pill(g, x, y, text, col, sc = 1) { g.font = `bold ${Math.round(20 * sc)}px ${FONT}`; g.textAlign = 'center'; const tw = g.measureText(text).width + 22 * sc; g.fillStyle = 'rgba(8,10,20,0.72)'; rr(g, x - tw / 2, y - 15 * sc, tw, 30 * sc, 15 * sc); g.fill(); g.fillStyle = col; g.fillText(text, x, y + 1); }
  drawHud(g) {
    const h = this.h, t = this.t, m = this.mis, c = this.cut, v = h.veh; g.textBaseline = 'middle';
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${clamp(this.flash, 0, 1)})`; g.fillRect(0, 0, W, H); }
    if (c) {
      g.textAlign = 'center'; const first = c.t < 3.2, a = clamp(first ? c.t * 3 : (c.t - 3.2) * 3, 0, 1);
      g.globalAlpha = a; g.fillStyle = 'rgba(8,10,20,0.78)'; g.fillRect(0, 60, W, 150); g.fillStyle = first ? c.armor.color : '#ffe14d'; g.fillRect(0, 60, W, 5); g.fillRect(0, 205, W, 5);
      g.font = `bold 60px ${FONT}`; g.fillText(first ? `NEW ARMOR: ${c.armor.name.toUpperCase()}!` : `🏙️ CITY LEVEL ${c.L}: ${CITY_NAMES[c.L].toUpperCase()}`, W / 2, 112);
      g.fillStyle = '#fff'; g.font = `26px ${FONT}`; g.fillText(first ? c.armor.power : 'Your new armor brought power back to Nova City!', W / 2, 172); g.globalAlpha = 1;
      if (c.t > 4.6) { g.font = `22px ${FONT}`; g.globalAlpha = 0.6 + Math.sin(t * 5) * 0.4; g.fillText(UI.isTouch ? 'Tap to continue' : 'Press ENTER or click to continue', W / 2, 690); g.globalAlpha = 1; }
      return;
    }
    // labels over buildings, beacons, bases and vehicles
    if (!m) {
      for (const p of this.pads) { const d = Math.hypot(p.lx - h.x, p.lz - h.z); if (d > (p.d != null || p.id === 'airport' ? 500 : 75)) continue; const s = this.toScreen(p.lx, p.ly, p.lz); if (!s) continue; this.pill(g, s[0], s[1], p.label + (d > 60 ? ' • ' + Math.round(d) + ' m' : ''), p.col, clamp(26 / s[2], 0.55, 1.15)); }
      this.hudVehs(g); this.hudBases(g);
    }
    // robot tags
    for (const e of this.en) {
      const s = this.toScreen(e.x, e.y + e.h + 0.7, e.z); if (!s || s[2] > 70) continue; const sc = clamp(13 / s[2], 0.6, 1.25), col = this.pcol(e.power);
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
    // weapons + pal
    g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, 14, 122, S.pal ? 400 : 250, 40, 14); g.fill(); g.font = `bold 16px ${FONT}`; g.textAlign = 'left'; g.fillStyle = '#fff';
    g.fillText(`${MELEE[S.wp.m].icon} ${MELEE[S.wp.m].name}`, 26, 143); g.fillStyle = '#7df9ff'; g.fillText(RANGED[S.wp.r].icon, 222, 143);
    if (S.pal) { g.fillStyle = '#5dff9a'; g.fillText(`🤖 ${ROBOTS[S.pal].name} Pal Lv ${S.palLv[S.pal] || 1}`, 256, 143); }
    let ly = 184; g.font = `bold 20px ${FONT}`;
    if (full && !v) { g.fillStyle = '#ffe14d'; g.fillText(UI.isTouch ? 'SUPER READY! ⭐' : 'SUPER READY!  Press L', 24, ly); ly += 26; }
    if (h.boost > 0) { g.fillStyle = '#7df9ff'; g.fillText('⚡ POWER SURGE ' + Math.ceil(h.boost) + 's', 24, ly); }
    // coins + map
    const cs = 1 + Math.max(0, this.coinPulse) * 0.15;
    g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W - 214, 12, 200, 50, 25); g.fill(); drawCoin(g, W - 184, 37, 15, t);
    g.fillStyle = '#ffe14d'; g.font = `bold ${Math.round(28 * cs)}px ${FONT}`; g.textAlign = 'left'; g.fillText(S.coins, W - 160, 38);
    if (!m) {
      const mx = W - 164, my = 72; g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, mx - 6, my - 6, 162, 162, 12); g.fill(); g.globalAlpha = 0.9; g.drawImage(this.map, mx, my); g.globalAlpha = 1;
      const mp = (x, z) => [clamp(mx + (x / CS + GC + 0.5) * 6, mx, mx + 150), clamp(my + (z / CS + GC + 0.5) * 6, my, my + 150)], nd = this.nextDistrict();
      for (const b of this.bases) if (!b.dead) { const p = mp(b.x, b.z); g.fillStyle = Math.sin(t * 6) > 0 ? '#ff3b2f' : '#7a1010'; g.fillRect(p[0] - 4, p[1] - 4, 8, 8); }
      for (const e of this.en) { const p = mp(e.x, e.z); g.fillStyle = '#ff5a5a'; g.fillRect(p[0] - 2, p[1] - 2, 4, 4); }
      if (nd >= 0) { const p = mp(cellX(ARENAS[nd].i), cellX(ARENAS[nd].j)); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], 7 + Math.sin(t * 5) * 2, 0, TAU); g.stroke(); }
      const p = mp(h.x, h.z); g.save(); g.translate(p[0], p[1]); g.rotate(Math.PI - h.yaw); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -8); g.lineTo(6, 6); g.lineTo(0, 3); g.lineTo(-6, 6); g.closePath(); g.fill(); g.restore();
      if (nd >= 0) { // where to go next
        const ax = cellX(ARENAS[nd].i) - h.x, az = cellX(ARENAS[nd].j) - h.z, dist = Math.hypot(ax, az), rel = wrapA(Math.atan2(ax, az) - this.camYaw);
        if (dist > 12) { g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W / 2 - 210, 12, 420, 46, 23); g.fill(); g.save(); g.translate(W / 2 - 180, 35); g.rotate(-rel); g.fillStyle = DCOL[nd]; g.beginPath(); g.moveTo(0, -14); g.lineTo(10, 10); g.lineTo(0, 4); g.lineTo(-10, 10); g.closePath(); g.fill(); g.restore(); g.fillStyle = '#fff'; g.font = `bold 18px ${FONT}`; g.textAlign = 'left'; g.fillText(`Next mission: ${DISTRICTS[nd].name} ${nd + 1}-${S.stage % 3 + 1}  •  ${Math.round(dist)} m`, W / 2 - 156, 36); }
      }
    } else this.drawMissionHud(g);
    // combo
    if (this.combo > 1) { const s = 1 + Math.max(0, this.comboPop) * 0.35, col = this.combo >= 25 ? '#ff5a5a' : this.combo >= 10 ? '#ffb347' : '#ffe14d'; g.save(); g.translate(W - 120, m ? 170 : 300); g.rotate(-0.08); g.scale(s, s); g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.font = `bold 78px ${FONT}`; g.strokeText(this.combo, 0, 0); g.fillStyle = col; g.fillText(this.combo, 0, 0); g.font = `bold 26px ${FONT}`; g.strokeText('HITS!', 0, 52); g.fillText('HITS!', 0, 52); g.restore(); }
    // BOLT speech
    if (this.boltMsg && !this.banner) { const b = this.boltMsg, a = clamp(Math.min(b.t * 4, (b.dur - b.t) * 3), 0, 1); g.globalAlpha = a; g.font = `19px ${FONT}`; const lines = wrapText(g, b.text, 560), bh = 34 + lines.length * 24; g.fillStyle = 'rgba(255,255,255,0.95)'; rr(g, W / 2 - 300, 68, 600, bh, 16); g.fill(); g.fillStyle = '#1b6fd6'; g.textAlign = 'left'; g.font = `bold 15px ${FONT}`; g.fillText('BOLT', W / 2 - 284, 84); g.fillStyle = '#14182a'; g.font = `19px ${FONT}`; lines.forEach((l, i) => g.fillText(l, W / 2 - 284, 108 + i * 24)); g.globalAlpha = 1; }
    if (this.banner) { const b = this.banner, a = clamp(Math.min(b.t * 5, (b.dur - b.t) * 3), 0, 1); g.globalAlpha = a; g.fillStyle = 'rgba(8,10,20,0.72)'; g.fillRect(0, 232, W, b.sub ? 124 : 96); g.fillStyle = b.col; g.fillRect(0, 232, W, 4); g.fillRect(0, (b.sub ? 356 : 328) - 4, W, 4); g.textAlign = 'center'; g.font = `bold 56px ${FONT}`; g.fillText(b.text, W / 2 + (1 - a) * 80, 280); if (b.sub) { g.fillStyle = '#fff'; g.font = `24px ${FONT}`; g.fillText(b.sub, W / 2, 328); } g.globalAlpha = 1; }
    // key help: for vehicles always, on foot for brand-new players
    if (!UI.isTouch && !this.boss && (v || S.stats.wins < 2)) {
      const keys = !v ? [['↑', 'Run'], ['← →', 'Turn'], ['SPACE', 'Jump / climb walls'], ['J', 'Hit'], ['K', 'Blast'], ['F', 'Car']]
        : v.type === 'car' ? [['↑ ↓', 'Drive'], ['← →', 'Steer'], ['J', 'Turbo'], ['K', 'Blast'], ['F', 'Get out']]
          : v.type === 'heli' ? [['↑ ↓', 'Fly'], ['← →', 'Turn'], ['SPACE', 'Up'], ['SHIFT', 'Down'], ['K', 'Rockets'], ['F', 'Jump out']]
            : [['↑', v.air ? 'Climb' : 'Take off'], ['↓', 'Dive'], ['← →', 'Turn'], ['J', 'Afterburner'], ['K', 'Missiles'], ['F', 'Eject']];
      g.font = `bold 17px ${FONT}`; let wd = 20; for (const [k, s] of keys) wd += g.measureText(k).width + 18 + 8 + g.measureText(s).width + 22; let x = W / 2 - wd / 2 + 14;
      g.fillStyle = 'rgba(10,14,26,0.66)'; rr(g, W / 2 - wd / 2, 668, wd, 40, 14); g.fill();
      for (const [k, s] of keys) { const kw = g.measureText(k).width + 18; g.fillStyle = '#ffe14d'; rr(g, x, 675, kw, 26, 6); g.fill(); g.fillStyle = '#14182a'; g.textAlign = 'center'; g.fillText(k, x + kw / 2, 689); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(s, x + kw + 8, 689); x += kw + 8 + g.measureText(s).width + 22; }
    }
  }
}
function wrapText(g, text, maxW) { const out = []; let line = ''; for (const w of String(text).split(' ')) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
