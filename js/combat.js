'use strict';
/* ============================================================
   FIGHTER CRAFT - 3D fighting: hero moves, weapons, robots,
   bosses, pickups and missions. Extends the World class.
   ============================================================ */
const ATK3 = { atk1: { dur: 0.26, hitAt: 0.09, mult: 1 }, atk2: { dur: 0.26, hitAt: 0.09, mult: 1.15 }, atk3: { dur: 0.44, hitAt: 0.16, mult: 1.9, big: true }, kick: { dur: 0.34, hitAt: 0.07, mult: 1.25 } };
const E3 = { scrapper: { sp: 3.2, range: 2.2, r: 0.7, h: 2.1 }, roller: { sp: 3, r: 0.8, h: 1.7 }, zapper: { sp: 2.6, r: 0.6, h: 2.7 }, drone: { sp: 4.4, r: 0.9, h: 0.9, fly: 3.3 }, brute: { sp: 2.1, range: 3.1, r: 1.3, h: 3.4 } };
const B3 = { crusher: { r: 2.0, h: 5.3 }, viper: { r: 1.4, h: 5.7 }, warden: { r: 2.4, h: 1.9, fly: 4.2 }, furnace: { r: 2.2, h: 5.3 }, corex: { r: 2.0, h: 6.7 } };

Object.assign(World.prototype, {
  /* ---------------- hero ---------------- */
  upHero(dt) {
    const h = this.h, wet = !h.chute && h.y < 0.7 && this.inWater(h.x, h.z), sp = Calc.speed() / 38 * (wet ? 0.5 : 1) * (h.fSpd > 0 ? 1.2 : 1) * (S.pet === 'bunny' ? 1.05 : 1), m = this.mis, alive = !(this.koT > 0) && !(m && (m.state === 'win' || m.state === 'lose')), ctl = alive && h.hurtT <= 0 && h.superT <= 0;
    const turn = ctl ? (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0) : 0; let fw = ctl ? (Input.held('up') ? 1 : 0) - (Input.held('dn') ? 0.55 : 0) : 0;
    h.swim = wet; h.yaw = wrapA(h.yaw - turn * 2.7 * dt); if (h.atk && h.on) fw *= 0.3; h.mv = fw;
    const k = 1 - Math.exp(-dt * (h.hurtT > 0 ? 3 : 12)); h.vx = lerp(h.vx, Math.sin(h.yaw) * fw * sp, k); h.vz = lerp(h.vz, Math.cos(h.yaw) * fw * sp, k);
    if (ctl && !wet && Input.hit('jump')) {
      if (h.on) { h.vy = 9.4; h.on = false; h.jumps = 1; Snd.play('jump'); }
      else if (S.armor[0] && h.jumps < 2) { h.vy = 8.6; h.jumps = 2; Snd.play('jump'); this.fx.ring(h.x, h.z, '#39d0ff', 1.6, h.y); }
    }
    h.jet = false;
    if (ctl && S.armor[3] && !h.on && !h.climb && !h.chute && Input.held('jump') && h.vy < 3 && h.en > 2 && h.y < 90) { h.vy = Math.min(h.vy + 62 * dt, 6.5); h.en -= 20 * dt; h.jet = true; if (Math.random() < 0.5) this.fx.add({ k: 0, x: h.x - Math.sin(h.yaw) * 0.3, y: h.y + 0.9, z: h.z - Math.cos(h.yaw) * 0.3, vx: rand(-1, 1), vy: -6, vz: rand(-1, 1), life: 0.25, max: 0.25, c: C3('#ffb347'), s: 0.09, g: 0 }); }
    if (wet) { h.vy = 0; h.y = lerp(h.y, -1.15, Math.min(1, dt * 5)); } else { h.vy -= 24 * dt; if (h.chute) h.vy = Math.max(h.vy, -7); h.y += h.vy * dt; } h.x += h.vx * dt; h.z += h.vz * dt;
    const wall = this.collide(h, 0.55); h.climb = false; this.carBump(h, 0.55);
    if (wall && ctl && !wet && Input.held('jump') && fw > 0 && wall.top > h.y + 0.3) { const nx = clamp(h.x, wall.x0, wall.x1), nz = clamp(h.z, wall.z0, wall.z1); h.vy = 4.6; h.climb = true; h.on = false; h.jumps = 0; h.chute = false; h.rope = { x: lerp(nx, h.x, 0.45), z: lerp(nz, h.z, 0.45), top: wall.top }; h.yaw = lerpA(h.yaw, Math.atan2(nx - h.x, nz - h.z), Math.min(1, dt * 12)); } // climb any wall: run into it and hold JUMP
    if (m) { const dx = h.x - m.cx, dz = h.z - m.cz, d = Math.hypot(dx, dz); if (d > m.R - 1) { h.x = m.cx + dx / d * (m.R - 1); h.z = m.cz + dz / d * (m.R - 1); } }
    const f = this.floorAt(h.x, h.z, h.y);
    if (wet) { h.on = true; h.jumps = 0; h.chute = false; } else if (h.y <= f) { if (!h.on && h.vy < -9) this.fx.smoke(h.x, f + 0.1, h.z, 2, '#c8c8d2'); h.y = f; h.vy = 0; h.on = true; h.jumps = 0; h.chute = false; } else if (h.y > f + 0.05) h.on = false;
    // attacks
    if (ctl && !wet && (Input.hit('punch') || Input.mouse.clicked)) { if (!h.atk) this.startAtk(); else if (h.atk.t > h.atk.dur * 0.3) h.buf = true; }
    if (h.atk) {
      const a = h.atk; a.t += dt;
      if (!a.done && a.t >= a.hitAt) { a.done = true; this.heroHit(a); }
      if (a.t >= a.dur || (a.pose === 'kick' && h.on)) { h.atk = null; h.chainT = 0.5; if (h.buf && ctl) this.startAtk(); }
    } else if (h.chainT > 0) h.chainT -= dt;
    if (ctl && Input.hit('blast')) this.fire();
    if (ctl && Input.hit('swapM')) this.swap('m');
    if (ctl && Input.hit('swapR')) this.swap('r');
    if (ctl && Input.hit('super') && h.sup >= 100) { h.sup = 0; h.superT = 1.15; h.supTick = 0; h.atk = null; Snd.play('super'); this.shake = 0.7; this.setBanner(S.armor[4] ? '★ STAR BEAM ★' : 'MEGA BLAST!', '', '#ffe14d', 1.1); if (S.armor[4]) this.fx.ring(h.x, h.z, '#b388ff', 12, h.y + 0.5); }
    if (h.superT > 0) {
      h.superT -= dt; h.supTick -= dt; h.vx = h.vz = 0; this.shake = Math.max(this.shake, 0.25);
      if (h.supTick <= 0) {
        h.supTick = 0.12; const d = Calc.blast() * (S.armor[4] ? 1.3 : 0.8), fx = Math.sin(h.yaw), fz = Math.cos(h.yaw);
        for (const e of this.en) { if (e.dead) continue; const dx = e.x - h.x, dz = e.z - h.z, al = dx * fx + dz * fz, pe = Math.abs(dx * fz - dz * fx); if ((al > -1 && al < 42 && pe < 3 + e.r) || (S.armor[4] && Math.hypot(dx, dz) < 12)) this.damage(e, d, false); }
      }
    }
    if (h.blastT > 0) h.blastT -= dt; if (h.hurtT > 0) h.hurtT -= dt; if (h.inv > 0) h.inv -= dt; if (h.boost > 0) h.boost -= dt;
    h.en = Math.min(h.maxEn, h.en + Calc.regen() * (h.fRegen > 0 ? 2 : 1) * dt);
    h.calm += dt; if (!m && h.calm > 6 && h.hp < h.maxHp) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.05 * dt);
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
    if (this.comboPop > 0) this.comboPop -= dt * 5;
  },
  swap(slot) {
    const list = Object.keys(slot === 'm' ? MELEE : RANGED).filter(k => S.wp.own[k] || k === 'fist' || k === 'blaster'); if (list.length < 2) { this.text(this.h.x, this.h.y + 2.6, this.h.z, 'Buy weapons at the Workshop!', '#ffe14d', 20); return; }
    S.wp[slot] = list[(list.indexOf(S.wp[slot]) + 1) % list.length]; const w = (slot === 'm' ? MELEE : RANGED)[S.wp[slot]]; Snd.play('click'); this.text(this.h.x, this.h.y + 2.6, this.h.z, w.icon + ' ' + w.name, '#fff', 24);
  },
  startAtk() {
    const h = this.h, Wp = MELEE[S.wp.m]; let n;
    if (!h.on) n = 'kick'; else { h.chain = h.chainT > 0 ? h.chain % 3 + 1 : 1; n = 'atk' + h.chain; }
    let best = null, bd = Wp.range + 3; // aim help: turn to the nearest robot in front
    for (const e of this.en) { const d = Math.hypot(e.x - h.x, e.z - h.z) - e.r; if (!e.dead && d < bd && Math.abs(wrapA(Math.atan2(e.x - h.x, e.z - h.z) - h.yaw)) < 1.9) { bd = d; best = e; } }
    if (best) h.yaw = Math.atan2(best.x - h.x, best.z - h.z);
    const A = ATK3[n]; h.atk = { pose: n, t: 0, done: false, dur: A.dur * Wp.dur, hitAt: A.hitAt * Wp.dur, mult: A.mult, big: !!A.big }; h.buf = false; Snd.play('punch');
    if (h.on && best && bd > Wp.range * 0.6) { h.vx += Math.sin(h.yaw) * 5; h.vz += Math.cos(h.yaw) * 5; }
  },
  heroHit(a) {
    const h = this.h, wid = S.wp.m, Wp = MELEE[wid], dm = Calc.punch() * a.mult * Wp.mult, full = a.big && wid === 'sword', slam = a.big && wid === 'hammer' && h.on; let any = false;
    const inArc = (x, z, r) => { const dx = x - h.x, dz = z - h.z, d = Math.hypot(dx, dz) - r; if (slam) return d < 5.5; if (d > Wp.range) return false; return full || d < 0.6 || Math.abs(wrapA(Math.atan2(dx, dz) - h.yaw)) < Wp.arc; };
    for (const e of this.en) { if (e.dead || !inArc(e.x, e.z, e.r) || e.y > h.y + 2.9 || e.y + e.h < h.y - 0.3 || (slam && e.y > 1)) continue; this.damage(e, dm, a.big); any = true; }
    for (const c of this.crates) if (!c.dead && Math.abs(h.y - (c.y || 0)) < 2 && inArc(c.x, c.z, 0.7)) { this.breakCrate(c); any = true; }
    for (const b of this.bases) if (!b.dead && h.y < 4 && Math.max(Math.abs(b.x - h.x), Math.abs(b.z - h.z)) < 12.7 + Wp.range) { this.damageBase(b, dm * 0.5); any = true; }
    if (slam) { this.fx.ring(h.x, h.z, '#ffd23f', 5.5); this.fx.smoke(h.x + Math.sin(h.yaw) * 1.5, 0.2, h.z + Math.cos(h.yaw) * 1.5, 5, '#c8c8d2'); this.shake = Math.max(this.shake, 0.5); Snd.play('bighit'); }
    if (any) { this.hitstop = a.big ? 0.09 : 0.045; this.shake = Math.max(this.shake, a.big ? 0.4 : 0.15); Snd.play(a.big ? 'bighit' : 'hit'); }
    if (a.big && S.armor[1] && !slam) { this.fx.ring(h.x, h.z, '#ffd23f', 4.5, h.y + 0.2); Snd.play('zap'); for (const e of this.en) if (!e.dead && !e.flying && Math.hypot(e.x - h.x, e.z - h.z) - e.r < 4.5 && !inArc(e.x, e.z, e.r)) this.damage(e, Calc.punch() * 0.7, false); }
  },
  fire() {
    const h = this.h, id = S.wp.r, R = RANGED[id];
    if (h.en < R.en) { Snd.play('wrong'); this.text(h.x, h.y + 2.6, h.z, 'Energy low!', '#7df9ff', 22); return; }
    let best = null, bd = 36; for (const e of this.en) { const d = Math.hypot(e.x - h.x, e.z - h.z); if (!e.dead && d < bd && Math.abs(wrapA(Math.atan2(e.x - h.x, e.z - h.z) - h.yaw)) < 1.0) { bd = d; best = e; } }
    if (best) h.yaw = Math.atan2(best.x - h.x, best.z - h.z);
    h.en -= R.en; h.blastT = 0.22; h.atk = null; Snd.play('blast'); const dm = Calc.blast(), y = h.y + 1.3;
    const mk = (ang, k, dmg, spd) => this.shots.push({ k, f: true, x: h.x + Math.sin(h.yaw) * 0.8, y, z: h.z + Math.cos(h.yaw) * 0.8, vx: Math.sin(h.yaw + ang) * spd, vy: 0, vz: Math.cos(h.yaw + ang) * spd, dmg, life: 1.7, tgt: ang === 0 ? best : null });
    if (id === 'tri') { mk(-0.2, 'blast', dm * 0.62, 30); mk(0, 'blast', dm * 0.62, 30); mk(0.2, 'blast', dm * 0.62, 30); } else if (id === 'rocket') mk(0, 'rocket', dm * 2, 21); else mk(0, 'blast', dm, 32);
  },
  gainXp(n) {
    const ups = Calc.addXp(Math.round(n * (this.h.fXp > 0 ? 1.2 : 1) * (S.pet === 'parrot' ? 1.1 : 1)));
    if (ups) { const h = this.h; this.refresh(false); h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.35); this.setBanner('⬆ LEVEL UP!', `You are now Level ${S.level}  •  Power ${Calc.power()}`, '#7df9ff', 2.2); Snd.play('levelup'); this.fx.ring(this.h.x, this.h.z, '#7df9ff', 6, this.h.y + 0.3); Save.save(); }
  },
  breakCrate(c) {
    const cy = c.y || 0; c.dead = true; c.resp = c.roof ? 240 : 80; this.fx.debris(c.x, cy + 0.8, c.z, 9, c.gold ? '#ffd23f' : '#9a6d3a'); this.fx.spark(c.x, cy + 0.8, c.z, 10, '#ffe14d');
    const df = this.mis ? this.mis.diff : Math.min(S.stage, 14) * 0.6; this.dropCoins(c.x, cy + 1, c.z, Math.round((c.roof ? 45 : c.gold ? 26 : 8) * (1 + df * 0.12)), c.gold ? 9 : 5, cy);
    if (c.roof) { S.stats.roofs = (S.stats.roofs || 0) + 1; this.text(c.x, cy + 2.6, c.z, 'ROOFTOP TREASURE!', '#ffe14d', 28); UI.badgeToasts(checkBadges()); }
    if (Math.random() < 0.25) this.picks.push({ k: 'heart', x: c.x, y: cy + 1, z: c.z, vx: rand(-2, 2), vy: 8, vz: rand(-2, 2), t: 0, f: cy });
  },
  dropCoins(x, y, z, total, n, f = 0) {
    total = Math.max(1, Math.round(total * (this.h.boost > 0 ? 2 : 1))); n = Math.min(n, total); const val = Math.floor(total / n); let rem = total - val * n;
    for (let i = 0; i < n; i++) this.picks.push({ k: 'coin', x, y, z, vx: rand(-5, 5), vy: rand(6, 11), vz: rand(-5, 5), val: val + (rem-- > 0 ? 1 : 0), t: rand(0.2), f });
  },
  damage(e, dmg, big, sx, sz) {
    if (e.dead) return; const h = this.h;
    if (e.boss && e.state === 'dizzy') dmg *= 1.5; if (h.boost > 0) dmg *= 1.4;
    e.hp -= dmg; e.flash = 0.1; e.aggro = true;
    const ox = sx == null ? h.x : sx, oz = sz == null ? h.z : sz, dx = e.x - ox, dz = e.z - oz, d = Math.hypot(dx, dz) || 1;
    this.fx.spark(e.x - dx / d * e.r, e.y + e.h * 0.6, e.z - dz / d * e.r, big ? 12 : 6, big ? '#ffd23f' : '#ffffff');
    this.text(e.x + rand(-0.4, 0.4), e.y + e.h + 0.9, e.z, String(Math.round(dmg)), big ? '#ffd23f' : '#ffffff', big ? 34 : 24);
    if (!e.boss) { if ((e.kind !== 'brute' || big) && e.state !== 'roll') { e.state = 'stun'; e.st = big ? 0.5 : 0.2; } const kb = big ? 12 : e.kind === 'brute' ? 1.5 : 3; e.kx = dx / d * kb; e.kz = dz / d * kb; }
    this.combo++; this.comboT = 2.6; this.comboPop = 1; if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    h.sup = Math.min(100, h.sup + (big ? 9 : 6));
    if (e.hp <= 0) this.kill(e);
  },
  kill(e) {
    e.dead = true; const L = LOOK3[e.look || e.kind], col = L ? L.c : e.kind === 'roller' ? '#2fa37a' : '#8d99ae', cy = e.y + e.h / 2, m = this.mis;
    this.fx.debris(e.x, cy, e.z, e.boss ? 40 : 12, col); this.fx.debris(e.x, cy, e.z, e.boss ? 14 : 4, '#30343f'); this.fx.spark(e.x, cy, e.z, e.boss ? 46 : 16, '#ffb347', 13);
    this.fx.smoke(e.x, cy, e.z, e.boss ? 12 : 4); this.fx.ring(e.x, e.z, '#ffd23f', e.boss ? 12 : 4.5, 0.2);
    Snd.play('explode'); this.shake = Math.max(this.shake, e.boss ? 1 : 0.3);
    const xp = Math.round(e.xp * (1 + e.diff * 0.27)); this.text(e.x, e.y + e.h + 1.8, e.z, '+' + xp + ' XP', '#7df9ff', 22);
    S.stats.robots++; S.stats.bestCombo = Math.max(S.stats.bestCombo, this.maxCombo); if (m) { m.got.xp += xp; m.got.robots++; }
    this.dropCoins(e.x, cy, e.z, e.coins * (1 + e.diff * 0.12), e.boss ? 16 : 4);
    const low = this.h.hp < this.h.maxHp * 0.4;
    if (Math.random() < (low ? 0.4 : 0.1) + S.build.hospital * 0.05 + (S.pet === 'cat' ? 0.08 : 0) || e.boss) this.picks.push({ k: 'heart', x: e.x, y: cy, z: e.z, vx: rand(-2, 2), vy: 8, vz: rand(-2, 2), t: 0 });
    if (!e.boss && Math.random() < 0.4) this.picks.push({ k: 'core', kind: e.kind, x: e.x, y: cy, z: e.z, vx: rand(-2, 2), vy: 9, vz: rand(-2, 2), t: 0 }); // a core: enough of them rebuild this robot as a Robo-Pal
    if (e.boss) { this.slow = 1.3; this.boss = null; Music.play('battle'); for (const o of this.en) if (!o.dead && o !== e) { o.hp = 0; this.kill(o); } if (m) m.queue = []; }
    this.gainXp(xp); UI.badgeToasts(checkBadges());
  },
  hurtHero(dmg, fx, fz) {
    const h = this.h, m = this.mis;
    if (h.inv > 0 || h.superT > 0 || this.koT > 0 || (m && m.state !== 'fight' && m.state !== 'between')) return;
    if (S.armor[2]) dmg *= 0.75; if (h.veh) dmg *= 0.5;
    dmg = Math.max(1, Math.round(dmg)); h.hp -= dmg; h.hurtT = 0.28; h.inv = 1.1; h.atk = null; h.buf = false; h.calm = 0;
    const dx = h.x - fx, dz = h.z - fz, d = Math.hypot(dx, dz) || 1; if (!h.veh) { h.vx = dx / d * 10; h.vz = dz / d * 10; if (h.on) { h.vy = 5; h.on = false; } }
    this.combo = 0; if (m) m.got.hits++; this.shake = Math.max(this.shake, 0.4); Snd.play('hurt');
    this.text(h.x, h.y + 2.7, h.z, '-' + dmg, '#ff6b5a', 28); this.fx.spark(h.x, h.y + 1.2, h.z, 8, '#ff6b5a');
    if (h.hp <= 0) { h.hp = 0; hush(); if (h.veh) this.leaveVeh(true); if (m) { m.state = 'lose'; m.stT = 0; } else this.koT = 1.5; }
  },

  /* ---------------- robots ---------------- */
  spawn(kind, x, z, diff, boss) {
    const sc = 1 + diff * 0.24 + diff * diff * 0.02, ds = 1.25 + diff * 0.22 + diff * diff * 0.022, rec = Calc.recPower(diff); let e;
    if (boss) { const B = BOSSES[kind], P = B3[kind]; e = { kind: 'boss', look: B.look, name: B.name, boss: true, B, hp: B.hp * sc, dmg: B.dmg * ds, r: P.r, h: P.h, flying: !!P.fly, fly: P.fly || 0, power: Math.round(rec * 2.2), ai: 0, state: 'idle', st: 2.6, xp: 40, coins: 40 }; }
    else { const R = ROBOTS[kind], P = E3[kind]; e = { kind, name: R.name, hp: R.hp * sc, dmg: R.dmg * ds, r: P.r, h: P.h, flying: !!P.fly, fly: P.fly || 0, power: Math.round(rec * R.pw), state: 'walk', st: 0, xp: R.xp, coins: R.coins, windT: R.wind, sp: P.sp, range: P.range || 0 }; }
    Object.assign(e, { x, z, y: e.fly, yaw: Math.atan2(this.h.x - x, this.h.z - z), maxHp: e.hp, diff, t: rand(10), flash: 0, cd: rand(0.7, 1.7), off: rand(-1, 1), moving: false, spin: 0, kx: 0, kz: 0, aggro: true, wt: 0 });
    this.en.push(e); return e;
  },
  upEnemy(e, dt) {
    e.t += dt; if (e.flash > 0) e.flash -= dt; e.moving = false;
    const h = this.h, dx = h.x - e.x, dz = h.z - e.z, d = Math.hypot(dx, dz) || 0.01, ty = Math.atan2(dx, dz), st = e.state;
    const face = () => { e.yaw = lerpA(e.yaw, ty, Math.min(1, dt * 7)); }, fwd = v => { e.x += Math.sin(e.yaw) * v * dt; e.z += Math.cos(e.yaw) * v * dt; e.moving = true; };
    if (e.kx || e.kz) { e.x += e.kx * dt; e.z += e.kz * dt; const k = Math.pow(0.003, dt); e.kx *= k; e.kz *= k; if (Math.abs(e.kx) + Math.abs(e.kz) < 0.3) e.kx = e.kz = 0; }
    if (st === 'stun') { e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = Math.max(e.cd, 0.35); } }
    else if (this.koT > 0) { /* hero is down: robots wait */ }
    else if (e.boss) this.upBoss(e, dt, d, ty);
    else if (!e.aggro) { // a patrol robot that has not noticed the hero yet
      if (d < 22 && h.y < 7) { e.aggro = true; Snd.play('warn'); }
      else { e.wt -= dt; if (e.wt <= 0) { e.wt = rand(2, 5); e.wy = rand(TAU); e.wm = Math.random() < 0.6; } if (e.wm && e.sp) { e.yaw = lerpA(e.yaw, e.wy, Math.min(1, dt * 3)); fwd(e.sp * 0.4); if (e.kind === 'roller') e.spin += dt * 3; } if (e.flying) e.y = e.fly + Math.sin(e.t * 2) * 0.2; }
    }
    else if (e.kind === 'scrapper' || e.kind === 'brute') {
      const br = e.kind === 'brute';
      if (st === 'walk') { face(); e.cd -= dt; if (d > e.range + e.off * 0.3) fwd(e.sp); else if (e.cd <= 0 && this.en.filter(o => o.state === 'wind').length < (e.diff > 4 ? 3 : 2)) { e.state = 'wind'; e.st = e.windT; } }
      else if (st === 'wind') {
        e.st -= dt; if (!br) face();
        if (e.st <= 0) {
          e.state = 'swing'; e.st = 0.24;
          if (br ? (d < e.range + 2.2 && h.y < 1) : (d < e.range + 2.4 && Math.abs(wrapA(ty - e.yaw)) < 1.2 && h.y < 2.2)) { this.hurtHero(e.dmg, e.x, e.z); if (!br) { e.kx = Math.sin(e.yaw) * 9; e.kz = Math.cos(e.yaw) * 9; } }
          if (br) { this.shake = Math.max(this.shake, 0.35); this.fx.ring(e.x, e.z, '#ffb347', e.range + 2.2); Snd.play('bighit'); }
        }
      } else if (st === 'swing') { e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = rand(0.7, 1.5); } }
    } else if (e.kind === 'roller') {
      if (st === 'walk') { face(); e.cd -= dt; if (d > 15) { fwd(e.sp); e.spin += dt * 5; } if (e.cd <= 0 && d < 28) { e.state = 'wind'; e.st = e.windT; } }
      else if (st === 'wind') { face(); e.st -= dt; if (e.st <= 0) { e.state = 'roll'; e.st = 1.25; e.dir = e.yaw; e.hitOnce = false; } }
      else if (st === 'roll') {
        e.st -= dt; e.dir = lerpA(e.dir, ty, Math.min(1, dt * 1.1)); e.yaw = e.dir; e.x += Math.sin(e.dir) * 16 * dt; e.z += Math.cos(e.dir) * 16 * dt; e.spin += dt * 18; e.moving = true;
        if (!e.hitOnce && d < 1.9 && h.y < 1.3) { this.hurtHero(e.dmg, e.x, e.z); e.hitOnce = true; }
        if (this.blocked(e.x, e.z, e.r * 0.8)) e.st = 0;
        if (e.st <= 0) { e.state = 'walk'; e.cd = rand(1.3, 2.3); }
      }
    } else if (e.kind === 'zapper') {
      if (st === 'walk') { face(); e.cd -= dt; const want = 11 + e.off * 2; if (d > want + 2) fwd(e.sp); else if (d < want - 4) fwd(-e.sp * 0.8); if (e.cd <= 0 && d < 26) { e.state = 'wind'; e.st = e.windT; Snd.play('charge'); } }
      else if (st === 'wind') { face(); e.st -= dt; if (e.st <= 0) { const sx = e.x + Math.sin(e.yaw) * 0.6, sy = e.y + e.h * 0.8, sz = e.z + Math.cos(e.yaw) * 0.6, vx = h.x - sx, vy = h.y + 1 - sy, vz = h.z - sz, l = Math.hypot(vx, vy, vz) || 1; this.shots.push({ k: 'orb', x: sx, y: sy, z: sz, vx: vx / l * 14, vy: vy / l * 14, vz: vz / l * 14, dmg: e.dmg, life: 3.2, home: 0.9 }); Snd.play('zap'); e.state = 'swing'; e.st = 0.3; } }
      else if (st === 'swing') { e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = rand(1.9, 2.9); } }
    } else if (e.kind === 'drone') {
      e.y = e.fly + Math.sin(e.t * 2) * 0.2;
      if (st === 'walk') { face(); const gx = h.x + h.vx * 0.6 + e.off * 1.2 - e.x, gz = h.z + h.vz * 0.6 + e.off * 0.8 - e.z, gd = Math.hypot(gx, gz); if (gd > 0.6) { e.x += gx / gd * e.sp * dt; e.z += gz / gd * e.sp * dt; } e.cd -= dt; if (e.cd <= 0 && d < 4.5) { e.state = 'wind'; e.st = e.windT; } }
      else if (st === 'wind') { e.st -= dt; if (e.st <= 0) { this.shots.push({ k: 'bomb', x: e.x, y: e.y, z: e.z, vy: 0, g: 18, dmg: e.dmg, life: 5 }); e.state = 'swing'; e.st = 0.3; } }
      else if (st === 'swing') { e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = rand(2.0, 3.0); } }
    }
    if (!e.flying && e.state !== 'air') this.collide(e, e.r);
    const m = this.mis; if (m) { const ax = e.x - m.cx, az = e.z - m.cz, ad = Math.hypot(ax, az); if (ad > m.R - 1.2) { e.x = m.cx + ax / ad * (m.R - 1.2); e.z = m.cz + az / ad * (m.R - 1.2); } }
    if (e.hp < e.maxHp * 0.35 && Math.random() < dt * 5) this.fx.smoke(e.x, e.y + e.h * 0.8, e.z, 1, '#3c3c44');
  },
  dizzy(e, d = 1.9) { e.state = 'dizzy'; e.st = d; if (!this.saidDizzy && d > 1.5) { this.saidDizzy = true; say('The boss is dizzy! Attack now!'); } },
  upBoss(e, dt, d, ty) {
    const h = this.h, B = e.B, rage = e.hp < e.maxHp * 0.4, m = this.mis, k5 = Math.min(1, dt * 5);
    switch (e.state) {
      case 'idle':
        e.yaw = lerpA(e.yaw, ty, k5); if (d > 6 + e.r) { const v = e.flying ? 4.5 : 2.8; e.x += Math.sin(e.yaw) * v * dt; e.z += Math.cos(e.yaw) * v * dt; e.moving = true; }
        if (e.flying) e.y = lerp(e.y, e.fly + Math.sin(e.t * 2) * 0.3, Math.min(1, dt * 3));
        e.st -= dt;
        if (e.st <= 0) {
          let a = B.attacks[e.ai % B.attacks.length]; e.ai++; if (a === 'summon' && this.en.length > 3) a = B.attacks[0];
          e.atk = a; e.state = (a === 'charge' || a === 'slam') ? 'wind' : 'cast'; e.st = e.windT = { charge: 0.95, slam: 0.65, missiles: 0.75, laser: 1.15, summon: 0.7 }[a] * (rage ? 0.8 : 1); e.la = ty - 0.7; Snd.play('warn');
        }
        break;
      case 'wind': case 'cast':
        e.st -= dt; e.yaw = lerpA(e.yaw, e.atk === 'laser' ? e.la : ty, Math.min(1, dt * 6));
        if (e.st <= 0) switch (e.atk) {
          case 'charge': e.state = 'charge'; e.dir = e.yaw; e.st = 1.3; e.hitOnce = false; Snd.play('blast'); break;
          case 'slam': { e.state = 'air'; e.at = 0; e.sx = e.x; e.sz = e.z; let tx = h.x, tz = h.z; if (m) { const ax = tx - m.cx, az = tz - m.cz, ad = Math.hypot(ax, az); if (ad > m.R - 4) { tx = m.cx + ax / ad * (m.R - 4); tz = m.cz + az / ad * (m.R - 4); } } e.tx = tx; e.tz = tz; Snd.play('jump'); break; }
          case 'missiles': { const n = 3 + (rage ? 2 : 0) + (e.diff > 8 ? 1 : 0), px = Math.cos(e.yaw), pz = -Math.sin(e.yaw); for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 4.2; this.shots.push({ k: 'bomb', x: h.x + px * o + rand(-1, 1), y: 26 + i * 9, z: h.z + pz * o + rand(-1, 1), vy: -15, g: 0, dmg: e.dmg * 0.8, life: 8 }); } this.fx.smoke(e.x, e.y + e.h, e.z, 6); Snd.play('blast'); this.dizzy(e, 1.3); break; }
          case 'laser': e.state = 'laser'; e.st = 1.3; e.la0 = e.yaw; Snd.play('super'); this.shake = 0.3; break;
          case 'summon': { for (let i = 0; i < 2; i++) { const a = rand(TAU), cx = m ? m.cx : e.x, cz = m ? m.cz : e.z, R = m ? m.R - 2.5 : 12; this.spawn(i ? 'scrapper' : pick(['scrapper', 'roller']), cx + Math.cos(a) * R, cz + Math.sin(a) * R, e.diff); } Snd.play('charge'); this.dizzy(e, 1.3); break; }
        }
        break;
      case 'charge': {
        e.x += Math.sin(e.dir) * 23 * dt; e.z += Math.cos(e.dir) * 23 * dt; e.st -= dt; e.moving = true; if (e.flying) e.y = lerp(e.y, 0, Math.min(1, dt * 8));
        if (Math.random() < 0.6) this.fx.smoke(e.x, 0.3, e.z, 1, '#c8c8d2');
        if (!e.hitOnce && d < e.r + 1.3 && h.y < 1.3) { this.hurtHero(e.dmg, e.x, e.z); e.hitOnce = true; }
        const out = m && Math.hypot(e.x - m.cx, e.z - m.cz) > m.R - 3.5;
        if (out || e.st <= 0 || (!m && this.blocked(e.x, e.z, e.r))) { this.shake = 0.5; Snd.play('bighit'); this.fx.spark(e.x, 2, e.z, 20, '#ffb347', 10); this.dizzy(e); }
        break;
      }
      case 'air': {
        e.at += dt; const k = Math.min(1, e.at / 0.8); e.x = lerp(e.sx, e.tx, k); e.z = lerp(e.sz, e.tz, k); e.y = Math.sin(k * Math.PI) * 9;
        if (k >= 1) { e.y = 0; this.shake = 0.7; Snd.play('bighit'); this.shots.push({ k: 'ring', x: e.x, z: e.z, rad: e.r, dmg: e.dmg * 0.8, max: 24, hit: false, life: 9 }); this.fx.smoke(e.x, 0.3, e.z, 8, '#c8c8d2'); if (d < e.r + 1 && h.y < 1.5) this.hurtHero(e.dmg, e.x, e.z); this.dizzy(e); }
        break;
      }
      case 'laser': {
        e.st -= dt; e.yaw = e.la0 + (1 - e.st / 1.3) * 1.4;
        const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw), dx = h.x - e.x, dz = h.z - e.z, al = dx * fx + dz * fz, pe = Math.abs(dx * fz - dz * fx);
        if (al > 0 && al < 46 && pe < 1.1 && h.y < 0.7) this.hurtHero(e.dmg, e.x, e.z);
        if (e.st <= 0) this.dizzy(e, 1.6);
        break;
      }
      case 'dizzy': if (e.flying) e.y = lerp(e.y, 0, Math.min(1, dt * 6)); e.st -= dt; if (e.st <= 0) { e.state = 'idle'; e.st = rand(1.0, 1.8) * (rage ? 0.55 : 1); } break;
    }
  },
  inSolid(x, y, z) {
    const ci = Math.floor(x / CS + GC + 0.5), cj = Math.floor(z / CS + GC + 0.5);
    if (ci >= 0 && cj >= 0 && ci < GN && cj < GN) { const k = this.cellSolid[ci + cj * GN]; if (k) { const s = this.solids[k - 1]; if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y < s.top) return true; } }
    for (const s of this.props) if (x > s.x0 && x < s.x1 && z > s.z0 && z < s.z1 && y < s.top) return true;
    return false;
  },
  explode(s) {
    const R = s.rad || 5.5, near = Math.hypot(s.x - this.h.x, s.z - this.h.z) < 70;
    this.fx.ring(s.x, s.z, '#ff7b3d', R, Math.max(0.2, s.y)); this.fx.spark(s.x, s.y, s.z, 26, '#ffb347', 14); this.fx.smoke(s.x, s.y, s.z, 6); if (near) { Snd.play('explode'); this.shake = Math.max(this.shake, 0.5); }
    if (!s.dmg) return;
    for (const e of this.en) if (!e.dead && Math.hypot(e.x - s.x, e.z - s.z) - e.r < R && Math.abs(e.y + e.h / 2 - s.y) < R + 1) this.damage(e, s.dmg, true, s.x, s.z);
    for (const c of this.crates) if (!c.dead && Math.hypot(c.x - s.x, c.z - s.z) < R && Math.abs((c.y || 0) - s.y) < R + 2) this.breakCrate(c);
    for (const b of this.bases) if (!b.dead && Math.max(Math.abs(b.x - s.x), Math.abs(b.z - s.z)) < 13 + R && s.y < 24) this.damageBase(b, s.dmg);
  },
  upShots(dt) {
    const h = this.h;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i]; s.life -= dt; let dead = s.life <= 0;
      if (s.f) {
        if (s.tgt && !s.tgt.dead) { const e = s.tgt, dx = e.x - s.x, dy = e.y + e.h * 0.5 - s.y, dz = e.z - s.z, d = Math.hypot(dx, dy, dz) || 1, sp = Math.hypot(s.vx, s.vy, s.vz), k = Math.min(1, dt * (s.k === 'rocket' ? 3 : 9)); s.vx = lerp(s.vx, dx / d * sp, k); s.vy = lerp(s.vy, dy / d * sp, k); s.vz = lerp(s.vz, dz / d * sp, k); }
        s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        if (s.k === 'rocket') { if (Math.random() < 0.8) this.fx.smoke(s.x - s.vx * 0.02, s.y - s.vy * 0.02, s.z - s.vz * 0.02, 1, '#c4c8d0'); } else if (Math.random() < 0.5) this.fx.add({ k: 0, x: s.x, y: s.y, z: s.z, vx: rand(-1, 1), vy: rand(-1, 1), vz: rand(-1, 1), life: 0.14, max: 0.14, c: C3('#7df9ff'), s: 0.035, g: 0 });
        let hit = dead && s.k === 'rocket';
        for (const e of this.en) { if (e.dead || Math.hypot(e.x - s.x, e.z - s.z) > e.r + 0.5 || s.y < e.y - 0.4 || s.y > e.y + e.h + 0.5) continue; hit = true; if (s.k !== 'rocket') { this.damage(e, s.dmg, false, s.x - s.vx, s.z - s.vz); this.fx.ring(s.x, s.z, '#7df9ff', 1.6, s.y); Snd.play('hit'); } break; }
        if (!hit) for (const b of this.bases) if (!b.dead && Math.hypot(b.x - s.x, b.z - s.z) < 3.4 && s.y < 18) { hit = true; if (s.k !== 'rocket') { this.damageBase(b, s.dmg); Snd.play('hit'); } break; }
        if (!hit) for (const c of this.crates) if (!c.dead && Math.abs(s.y - (c.y || 0) - 0.7) < 1.2 && Math.hypot(c.x - s.x, c.z - s.z) < 1) { hit = true; if (s.k !== 'rocket') this.breakCrate(c); break; }
        if (!hit && (s.y < 0.1 || this.inSolid(s.x, s.y, s.z))) hit = true;
        if (hit) { dead = true; if (s.k === 'rocket') this.explode(s); else this.fx.spark(s.x, s.y, s.z, 5, '#7df9ff', 5); }
      } else if (s.k === 'orb') {
        if (s.home > 0) { s.home -= dt; const dx = h.x - s.x, dy = h.y + 1 - s.y, dz = h.z - s.z, dl = Math.hypot(dx, dy, dz) || 1, k = Math.min(1, dt * 2.2), sp = Math.hypot(s.vx, s.vy, s.vz); s.vx = lerp(s.vx, dx / dl * sp, k); s.vy = lerp(s.vy, dy / dl * sp, k); s.vz = lerp(s.vz, dz / dl * sp, k); }
        s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        if (Math.hypot(s.x - h.x, s.y - (h.y + 1), s.z - h.z) < (h.veh ? 2.8 : 1.15)) { this.hurtHero(s.dmg, s.x - s.vx, s.z - s.vz); dead = true; this.fx.spark(s.x, s.y, s.z, 10, '#b388ff'); }
        else if (s.y < 0.1 || this.inSolid(s.x, s.y, s.z)) dead = true;
      } else if (s.k === 'bomb') {
        s.vy -= s.g * dt; s.y += s.vy * dt;
        if (s.y <= 0.25) { dead = true; this.fx.ring(s.x, s.z, '#ff7b3d', 2.9); this.fx.spark(s.x, 0.4, s.z, 14, '#ffb347', 10); this.fx.smoke(s.x, 0.4, s.z, 3); Snd.play('explode'); this.shake = Math.max(this.shake, 0.25); if (Math.hypot(h.x - s.x, h.z - s.z) < 2.9 && h.y < 2.2) this.hurtHero(s.dmg, s.x, s.z); }
      } else if (s.k === 'ring') {
        s.rad += 12 * dt; const d = Math.hypot(h.x - s.x, h.z - s.z);
        if (!s.hit && Math.abs(d - s.rad) < 0.9 && h.y < 0.6) { this.hurtHero(s.dmg, s.x, s.z); s.hit = true; }
        if (s.rad > s.max) dead = true;
      }
      if (dead) this.shots.splice(i, 1);
    }
  },
  upPicks(dt) {
    const h = this.h, m = this.mis, all = m && m.state !== 'fight';
    for (let i = this.picks.length - 1; i >= 0; i--) {
      const p = this.picks[i]; p.t += dt; const dx = h.x - p.x, dy = h.y + 1 - p.y, dz = h.z - p.z, d = Math.hypot(dx, dy, dz) || 0.01;
      if (p.t > 0.55 && (d < (S.pet === 'dog' ? 13 : 7.5) || all)) { const v = 26, k = Math.min(1, dt * 9); p.vx = lerp(p.vx, dx / d * v, k); p.vy = lerp(p.vy, dy / d * v, k); p.vz = lerp(p.vz, dz / d * v, k); }
      else { p.vy -= 26 * dt; p.vx *= 0.99; p.vz *= 0.99; if (p.y < (p.f || 0) + 0.35 && p.vy < 0) { p.y = (p.f || 0) + 0.35; p.vy *= -0.45; p.vx *= 0.7; p.vz *= 0.7; } }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (d < 1.3 && p.t > 0.3) {
        if (p.k === 'coin') { S.coins += p.val; if (m) m.got.coins += p.val; this.coinPulse = 1; Snd.play('coin'); }
        else if (p.k === 'core') { S.cores[p.kind] = (S.cores[p.kind] || 0) + 1; Snd.play('crystal'); this.text(h.x, h.y + 2.7, h.z, '+1 🤖 ' + ROBOTS[p.kind].name + ' core', '#5dff9a', 24); }
        else { const heal = Math.round(h.maxHp * 0.2); h.hp = Math.min(h.maxHp, h.hp + heal); Snd.play('heart'); this.text(h.x, h.y + 2.7, h.z, '+' + heal + ' ♥', '#ff8fa3', 26); }
        this.picks.splice(i, 1);
      } else if (p.t > 40) this.picks.splice(i, 1);
    }
  },
  zoneOf(x, z) { if (Math.max(Math.abs(x), Math.abs(z)) < 42) return -1; let best = -1, bd = 66; ARENAS.forEach((a, d) => { const dd = Math.hypot(x - cellX(a.i), z - cellX(a.j)); if (dd < bd) { bd = dd; best = d; } }); return best; },
  upCombat(dt) {
    const h = this.h, m = this.mis;
    for (const e of this.en) if (!e.dead) this.upEnemy(e, dt);
    for (let i = 0; i < this.en.length; i++) for (let j = i + 1; j < this.en.length; j++) { // robots should not stand inside each other
      const a = this.en[i], b = this.en[j]; if (a.boss || b.boss || a.flying !== b.flying || a.state === 'roll' || b.state === 'roll') continue;
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 0.01, min = a.r + b.r; if (d < min) { const p = (min - d) * 0.5 * Math.min(1, dt * 8); a.x -= dx / d * p; a.z -= dz / d * p; b.x += dx / d * p; b.z += dz / d * p; }
    }
    this.en = this.en.filter(e => !e.dead);
    this.upShots(dt); this.upPicks(dt);
    if (this.koT > 0) { this.koT -= dt; h.vx *= 0.9; h.vz *= 0.9; if (this.koT <= 0) { this.koT = 0; this.en = []; this.shots = []; this.refresh(true); this.teleport(0, 6, 0); Save.save(); this.openPanel('ko'); } return; }
    if (m) { this.upMission(dt); return; }
    // free roaming: patrol robots appear in districts the robots still control
    this.roamT -= dt; this.saveT = (this.saveT || 0) + dt; if (this.saveT > 20) { this.saveT = 0; Save.save(); }
    const zone = this.zoneOf(h.x, h.z);
    if (zone >= 0 && !S.armor[zone] && !S.bases[zone] && this.roamT <= 0 && this.en.length < 3) {
      this.roamT = 3.5;
      for (let n = 0; n < 6; n++) {
        const a = rand(TAU), r = rand(26, 40); let x = h.x + Math.cos(a) * r, z = h.z + Math.sin(a) * r;
        if (Math.random() < 0.5) x = cellX(Math.round((x / CS + GC) / 3) * 3); else z = cellX(Math.round((z / CS + GC) / 3) * 3);
        if (Math.abs(x) > WORLD_R - 6 || Math.abs(z) > WORLD_R - 6 || Math.max(Math.abs(x), Math.abs(z)) < 50 || this.inAirport(x, z) || this.nearBase(x, z, 18) || this.blocked(x, z, 1.4) || Math.hypot(x - h.x, z - h.z) < 22) continue;
        const e = this.spawn(pick(DISTRICTS[zone].pool), x, z, zone * 3 + 0.5); e.roam = true; e.aggro = false; e.yaw = rand(TAU); break;
      }
    }
    for (const e of this.en) if (e.roam && Math.hypot(e.x - h.x, e.z - h.z) > 85) e.dead = true;
  },

  /* ---------------- missions ---------------- */
  startMission(stage, rumble) {
    const d = rumble ? -1 : Math.floor(stage / 3), a = rumble ? RUMBLE_AT : ARENAS[d], h = this.h, cx = cellX(a.i), cz = cellX(a.j);
    if (h.veh) this.leaveVeh(true); h.chute = false;
    this.en = []; this.shots = []; this.boss = null; this.saidDizzy = false; this.combo = 0; this.maxCombo = 0; this.koT = 0;
    this.mis = { stage, d, rumble: !!rumble, cx, cz, R: ARENA_R, waves: rumble ? [] : makeWaves(stage), wi: -1, rw: 0, queue: [], state: 'intro', stT: 0, spawnT: 0, got: { coins: 0, xp: 0, robots: 0, hits: 0, math: 0 }, quizDone: false, crystal: null, saved: S.coins, diff: rumble ? 0 : stage, lv0: S.level, p0: Calc.power() };
    if (rumble || Math.hypot(h.x - cx, h.z - cz) > ARENA_R - 6) this.teleport(cx, cz + (rumble ? 0 : 18), Math.PI);
    this.refresh(true); Music.play('battle'); UI.touch(true);
    if (rumble) { this.setBanner('ROBOT RUMBLE', 'How many waves can you beat?', '#ffe14d'); say('Robot Rumble! How many waves can you beat?'); }
    else { const D = DISTRICTS[d]; this.setBanner(`${D.name}  ${d + 1}-${stage % 3 + 1}`, STAGE_NAMES[stage % 3] + ' mission', '#7df9ff'); say(S.stats.wins ? D.name + '. ' + STAGE_NAMES[stage % 3] + ' mission.' : 'Here they come! Press J to hit the robots!'); }
  },
  spawnBoss(id) {
    const m = this.mis, e = this.spawn(id, m.cx, m.cz - m.R + 8, m.diff, true); if (!m.rumble && S.bases[m.d]) { e.hp *= 0.75; e.maxHp = e.hp; } this.boss = e; Music.play('boss'); Snd.play('warn');
    this.setBanner('⚠ BOSS: ' + e.name + ' ⚠', `Power Level ${e.power}  -  "${e.B.taunt}"`, '#ff6b5a', 3); say('Boss! ' + e.name + '. ' + e.B.taunt);
  },
  nextWave() {
    const m = this.mis; let w;
    if (m.rumble) { m.rw++; m.diff = (m.rw - 1) * 0.9; w = makeRumbleWave(m.rw); if (!w.boss) this.setBanner('WAVE ' + m.rw, '', '#ffe14d', 1.3); }
    else { m.wi++; w = m.waves[m.wi]; if (!w.boss) this.setBanner(`WAVE ${m.wi + 1} / ${m.waves.length}`, '', '#ffffff', 1.3); }
    m.queue = w.list.slice(); m.state = 'fight'; m.stT = 0; m.spawnT = 0.5; if (w.boss) this.spawnBoss(w.boss);
    if (this.crates.filter(c => c.mis && !c.dead).length < 4) for (let k = 0; k < randi(1, 2); k++) this.crates.push({ x: m.cx + rand(-17, 17), z: m.cz + rand(-17, 17), gold: Math.random() < 0.22, hitT: 0, dead: false, mis: true, rot: rand(3), resp: 0 });
  },
  waveCleared() {
    const m = this.mis, h = this.h; Snd.play('correct'); m.stT = 0;
    if (m.rumble) { h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.15); const c = 5 + m.rw * 2; S.coins += c; m.got.coins += c; this.text(h.x, h.y + 3, h.z, 'WAVE CLEAR! +' + c + ' coins', '#ffe14d', 30); S.stats.rumble = Math.max(S.stats.rumble, m.rw); m.state = 'between'; if (m.rw % 3 === 0) m.crystal = { x: m.cx, z: m.cz }; return; }
    if (m.wi >= m.waves.length - 1) { m.state = 'win'; Snd.play('fanfare'); this.setBanner('MISSION COMPLETE!', '', '#ffe14d', 2.6); this.shots = []; return; }
    m.state = 'between';
    if (!m.quizDone && m.wi === Math.max(0, Math.floor(m.waves.length / 2) - 1)) { m.crystal = { x: m.cx, z: m.cz }; if (S.stats.math < 3) say('A power crystal! Touch it for a brain boost.'); }
  },
  upMission(dt) {
    const m = this.mis, h = this.h; m.stT += dt;
    if (m.state === 'intro') { if (m.stT > 1.7) this.nextWave(); }
    else if (m.state === 'fight') {
      m.spawnT -= dt; const active = this.en.filter(e => !e.boss).length, cap = 3 + (m.diff > 2 ? 1 : 0) + (m.diff > 6 ? 1 : 0) + (m.diff > 10 ? 1 : 0);
      if (m.queue.length && active < cap && m.spawnT <= 0) { const a = rand(TAU); this.spawn(m.queue.shift(), m.cx + Math.cos(a) * (m.R - 2.5), m.cz + Math.sin(a) * (m.R - 2.5), m.diff); m.spawnT = 0.75; }
      if (!m.queue.length && !this.en.length) this.waveCleared();
    } else if (m.state === 'between') { if (m.stT > (m.crystal ? 6 : 2.4)) this.nextWave(); }
    else if (m.state === 'win') { h.vx = h.vz = 0; if (m.stT > 2.8) this.finishWin(); }
    else if (m.state === 'lose') { h.vx *= 0.9; h.vz *= 0.9; if (m.stT > 1.5) this.finishLose(); }
    if (this.mis && m.crystal && Math.hypot(h.x - m.crystal.x, h.z - m.crystal.z) < 2.2 && h.y < 3 && m.state !== 'win' && m.state !== 'lose') this.openQuiz();
  },
  openQuiz() {
    const m = this.mis, h = this.h; m.crystal = null; if (!m.rumble) m.quizDone = true; this.panel = 'quiz'; Snd.play('crystal'); UI.touch(false);
    UI.quiz(makeQuestion(S.mathTier), ok => {
      this.panel = null; UI.touch(true); Input.pressed = {}; m.stT = Math.max(m.stT, 4);
      if (ok) { h.boost = 25; h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.3); h.en = h.maxEn; h.sup = Math.min(100, h.sup + 40); m.got.math++; S.stats.math++; this.setBanner('⚡ POWER SURGE! ⚡', 'Stronger hits and double coins for 25 seconds', '#7df9ff', 2.4); Snd.play('levelup'); this.fx.ring(h.x, h.z, '#7df9ff', 8, 0.3); }
      else { h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.1); this.setBanner('Good try!', 'You still get a little health', '#ffffff', 1.8); }
    });
  },
  endMission() { this.mis = null; this.en = []; this.shots = []; this.boss = null; this.crates = this.crates.filter(c => !c.mis); this.refresh(true); },
  finishWin() {
    const m = this.mis, st = m.stage, first = !S.stars[st], stars = m.got.hits === 0 ? 3 : m.got.hits <= 4 ? 2 : 1, bonus = first ? 10 + st * 4 : 3;
    const interest = 0; Calc.addXp(bonus);
    S.stats.wins++; S.stats.bestCombo = Math.max(S.stats.bestCombo, this.maxCombo); if (m.got.hits === 0) S.stats.noHit++;
    S.stars[st] = Math.max(S.stars[st] || 0, stars); if (st >= S.stage) S.stage = st + 1;
    let armor = null; if (st % 3 === 2 && !S.armor[m.d]) { S.armor[m.d] = true; armor = ARMOR[m.d]; S.pendingCity = Calc.cityLevel(); }
    const badges = checkBadges(); Save.save();
    const o = { win: true, title: 'MISSION COMPLETE!', stars, coins: m.got.coins, interest, saved: m.saved, xp: m.got.xp + bonus, ups: S.level - m.lv0, lvBefore: m.lv0, pBefore: m.p0, armor, badges, combo: this.maxCombo, robots: m.got.robots, stage: st, canNext: st % 3 < 2 };
    this.endMission(); this.panel = 'results'; UI.touch(false); UI.results(o);
  },
  finishLose() {
    const m = this.mis, lost = m.rumble ? 0 : Math.floor(m.got.coins / 2); S.coins = Math.max(0, S.coins - lost); S.stats.bestCombo = Math.max(S.stats.bestCombo, this.maxCombo);
    const badges = checkBadges(); Save.save();
    const rec = Calc.recPower(m.stage), weak = !m.rumble && Calc.power() < rec;
    const tip = m.rumble ? `You beat ${m.rw - 1} waves! Train and build to go even further.` : weak ? `This mission needs Power ${rec}. You have ${Calc.power()}. Train in the Dojo to get stronger!` : pick(TIPS);
    const o = { win: false, rumble: m.rumble, title: m.rumble ? `RUMBLE OVER - WAVE ${m.rw}` : 'BOLT RESCUED YOU!', coins: m.got.coins - lost, xp: m.got.xp, ups: S.level - m.lv0, lvBefore: m.lv0, pBefore: m.p0, badges, tip, combo: this.maxCombo, robots: m.got.robots, stage: m.stage };
    this.endMission(); this.panel = 'results'; UI.touch(false); UI.results(o);
  },

  /* ---------------- drawing the fight ---------------- */
  drawCombat(t) {
    const h = this.h, m = this.mis;
    for (const p of this.picks) { if (p.k === 'coin') coin3(p.x, p.y, p.z, p.t + p.x); else if (p.k === 'core') core3(p.x, p.y, p.z, t); else heart3(p.x, p.y, p.z, t); }
    for (const s of this.shots) {
      if (s.k === 'blast') { G3.amesh(s.x, s.y, s.z, SPT, 0.07, 0.07, 0.07, WHITE, 1); G3.agmesh(s.x, s.y, s.z, SPT, 0.2, 0.2, 0.2, C3(s.green ? '#5dff9a' : '#39d0ff'), 0.9); }
      else if (s.k === 'rocket') { rocket3(s, t); }
      else if (s.k === 'orb') { G3.amesh(s.x, s.y, s.z, SPT, 0.11, 0.11, 0.11, C3('#f1e6ff'), 1); G3.agmesh(s.x, s.y, s.z, SPT, 0.28, 0.28, 0.28, C3('#b388ff'), 0.8); }
      else if (s.k === 'bomb') { G3.amesh(s.x, s.y, s.z, SPX, 0.2, 0.2, 0.2, C3('#23272f'), -0.6); G3.amesh(s.x, s.y + 0.19, s.z, SPT, 0.06, 0.06, 0.06, C3('#ff3b2f'), 1); G3.agmesh(s.x, 0.12, s.z, CYL, 2.7, 0.06, 2.7, C3('#ff3b2f'), 0.3 + Math.sin(t * 20) * 0.15); }
      else if (s.k === 'ring') { const n = 30, c = C3('#ff7b3d'); for (let i = 0; i < n; i++) { const a = i * TAU / n; G3.agmesh(s.x + Math.cos(a) * s.rad, 0.35, s.z + Math.sin(a) * s.rad, SPX, 0.5 + s.rad * 0.05, 0.4, 0.5 + s.rad * 0.05, c, 0.9); } }
    }
    for (const e of this.en) if (e.boss) {
      if (e.state === 'wind' && e.atk === 'charge') G3.glow(M4.ry(M4.t(ID4, e.x + Math.sin(e.yaw) * 14, 0.12, e.z + Math.cos(e.yaw) * 14), e.yaw), 1.6, 0.05, 13, C3('#ff3b2f'), 0.3 + Math.sin(t * 24) * 0.15);
      if (e.atk === 'laser' && (e.state === 'cast' || e.state === 'laser')) { const on = e.state === 'laser', bm = M4.ry(M4.t(ID4, e.x + Math.sin(e.yaw) * 24, 0.9, e.z + Math.cos(e.yaw) * 24), e.yaw); const bc = M4.rx(bm, HPI); if (on) { const bw = 0.6 + Math.sin(t * 60) * 0.1; G3.gmesh(bc, CYL, bw, 23, bw, C3('#ff3b2f'), 1.1); G3.gmesh(bc, CYX, 0.18, 23, 0.18, WHITE, 1.4); } else G3.gmesh(bc, CYX, 0.07, 23, 0.07, C3('#ff3b2f'), 0.5 + Math.sin(t * 30) * 0.3); }
    }
    if (h.superT > 0) {
      const w = 0.9 + Math.sin(t * 70) * 0.2, bm = M4.ry(M4.t(ID4, h.x + Math.sin(h.yaw) * 22, h.y + 1.3, h.z + Math.cos(h.yaw) * 22), h.yaw);
      const bc = M4.rx(bm, HPI); G3.gmesh(bc, CYL, w, 21, w, C3(S.armor[4] ? '#b388ff' : '#39d0ff'), 1); G3.gmesh(bc, CYX, w * 0.4, 21, w * 0.4, WHITE, 1.5);
      if (S.armor[4]) G3.agmesh(h.x, h.y + 1, h.z, CYL, 12, 0.3, 12, C3('#b388ff'), 0.25);
    }
    if (m) {
      const c = C3(m.rumble ? '#ff5a5a' : DCOL[m.d]), n = 44, pulse = 0.35 + Math.sin(t * 3) * 0.1;
      for (let i = 0; i < n; i++) { const a = i * TAU / n; G3.agmesh(m.cx + Math.cos(a) * m.R, 2.2, m.cz + Math.sin(a) * m.R, CYX, 0.14, 2.2, 0.14, c, pulse); }
      if (m.crystal) crystal3(m.crystal.x, 1.6, m.crystal.z, t);
    }
  },
  drawMissionHud(g) {
    const m = this.mis, t = this.t; g.textBaseline = 'middle';
    if (!m.rumble && m.wi >= 0) { const n = m.waves.length, x0 = W / 2 - (n - 1) * 17; for (let i = 0; i < n; i++) { g.fillStyle = i < m.wi || (i === m.wi && m.state !== 'fight') ? '#5fd68a' : i === m.wi ? '#ffe14d' : 'rgba(255,255,255,0.3)'; if (m.waves[i].boss) { g.font = '22px Arial'; g.textAlign = 'center'; g.fillText('☠', x0 + i * 34, 30); } else circ(g, x0 + i * 34, 28, 9); } }
    if (m.rumble) { g.fillStyle = '#ffe14d'; g.font = `bold 26px ${FONT}`; g.textAlign = 'center'; g.fillText('WAVE ' + Math.max(1, m.rw), W / 2, 32); }
    if (m.crystal) { const s = this.toScreen(m.crystal.x, 3.4, m.crystal.z); if (s) { g.fillStyle = '#d9fdff'; g.font = `bold 20px ${FONT}`; g.textAlign = 'center'; g.fillText('💎 BRAIN BOOST - touch it!', s[0], s[1]); } }
    if (this.boss) { const b = this.boss; g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, 290, 646, 700, 60, 16); g.fill(); g.fillStyle = '#ff6b5a'; g.font = `bold 20px ${FONT}`; g.textAlign = 'left'; g.fillText('☠ ' + b.name, 310, 664); g.textAlign = 'right'; g.fillStyle = this.pcol(b.power); g.fillText('⚡ ' + b.power, 970, 664); this.bar(g, 310, 680, 660, 16, b.hp / b.maxHp, '#b0283a', '#ff6b5a'); if (b.state === 'dizzy') { g.fillStyle = '#ffe14d'; g.font = `bold 34px ${FONT}`; g.textAlign = 'center'; g.fillText('DIZZY - ATTACK NOW!', W / 2, 616 + Math.sin(t * 14) * 4); } }
  }
});
