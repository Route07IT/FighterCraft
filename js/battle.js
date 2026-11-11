'use strict';
/* ============================================================
   FIGHTER CRAFT - battle: the hero, robots, bosses, coins and waves
   ============================================================ */
const ATK = {
  punch1: { dur: 0.26, hitAt: 0.08, range: 108, mult: 1 },
  punch2: { dur: 0.26, hitAt: 0.08, range: 110, mult: 1.15 },
  punch3: { dur: 0.42, hitAt: 0.14, range: 126, mult: 1.9, big: true },
  kick: { dur: 0.34, hitAt: 0.06, range: 116, mult: 1.25 }
};
const FONT = 'Bahnschrift, "Segoe UI", Arial';

class Battle {
  constructor(stage, rumble) {
    this.stage = stage; this.rumble = !!rumble;
    this.d = rumble ? 0 : Math.floor(stage / 3);
    this.D = rumble ? null : DISTRICTS[this.d];
    this.back = new Backdrop(rumble ? RUMBLE_THEME : this.D.theme, rumble ? 999 : 100 + this.d * 13);
    this.diff = rumble ? 0 : stage;
    this.waves = rumble ? [] : makeWaves(stage); this.wi = -1; this.rw = 0;
    const mh = Calc.maxHp(), me = Calc.maxEnergy();
    this.h = { x: 220, y: GROUND, vx: 0, vy: 0, face: 1, on: true, jumps: 0, hp: mh, maxHp: mh, en: me, maxEn: me, sup: 0, atk: null, chain: 0, chainT: 0, buf: false, hurtT: 0, inv: 0, blastT: 0, superT: 0, supTick: 0, jet: false, boost: 0 };
    this.en = []; this.shots = []; this.picks = []; this.props = []; this.queue = []; this.fx = new FX();
    this.cam = 0; this.lockL = 0; this.lockR = W; this.shake = 0; this.hitstop = 0; this.slow = 0; this.t = 0; this.spawnT = 0;
    this.state = 'intro'; this.stT = 0; this.combo = 0; this.comboT = 0; this.comboPop = 0; this.maxCombo = 0;
    this.got = { coins: 0, xp: 0, robots: 0, hits: 0, math: 0 };
    this.banner = null; this.crystal = null; this.quizDone = false; this.boss = null; this.paused = false;
    this.power = Calc.power(); this.saidDizzy = false; this.coinPulse = 0;
  }
  enter() {
    UI.clear(); UI.touch(true); Music.play('battle');
    if (this.rumble) { this.setBanner('ROBOT RUMBLE', 'How many waves can you beat?', '#ffe14d'); say('Robot Rumble! How many waves can you beat?'); }
    else {
      this.setBanner(`${this.D.name}  ${this.d + 1}-${this.stage % 3 + 1}`, STAGE_NAMES[this.stage % 3] + ' mission', '#7df9ff');
      if (this.stage === 0 && !S.stats.wins) say('Use the arrow keys to move. Press J to punch the robots!');
      else say(this.D.name + '. ' + STAGE_NAMES[this.stage % 3] + ' mission.');
    }
  }
  exit() { UI.touch(false); hush(); }
  zoneX(i) { return i * 950; }
  setBanner(text, sub, col, dur = 2.2) { this.banner = { text, sub, col, t: 0, dur }; }
  pcol(p) { const r = p / this.power; return r < 0.8 ? '#5fd68a' : r < 1.15 ? '#ffe14d' : '#ff6b5a'; }

  /* ---------- waves ---------- */
  startWave(i) {
    this.wi = i; const w = this.waves[i];
    this.lockL = this.zoneX(i); this.lockR = this.lockL + W; this.queue = w.list.slice(); this.state = 'fight'; this.spawnT = 0.4;
    for (let k = 0; k < (w.boss ? 1 : randi(1, 2)); k++) this.props.push({ x: this.lockL + rand(380, 1050), gold: Math.random() < 0.22, hitT: 0 });
    if (w.boss) this.spawnBoss(w.boss);
    else this.setBanner(`WAVE ${i + 1} / ${this.waves.length}`, '', '#ffffff', 1.3);
  }
  startRumble() {
    this.rw++; this.diff = (this.rw - 1) * 0.9; const w = makeRumbleWave(this.rw);
    this.queue = w.list.slice(); this.state = 'fight'; this.spawnT = 0.5;
    if (this.rw % 2 === 1) this.props.push({ x: rand(250, 1030), gold: Math.random() < 0.3, hitT: 0 });
    if (w.boss) this.spawnBoss(w.boss); else this.setBanner('WAVE ' + this.rw, '', '#ffe14d', 1.3);
  }
  spawnBoss(id) {
    const e = this.spawn(id, this.lockR - 220, true); this.boss = e; Music.play('boss'); Snd.play('warn');
    this.setBanner('⚠ BOSS: ' + e.name + ' ⚠', `Power Level ${e.power}  -  "${e.B.taunt}"`, '#ff6b5a', 3);
    say('Boss! ' + e.name + '. ' + e.B.taunt);
  }
  spawn(kind, x, boss) {
    const df = this.diff, sc = 1 + df * 0.22 + df * df * 0.012, ds = 1 + df * 0.14 + df * df * 0.008, rec = Calc.recPower(this.diff); let e;
    if (boss) { const B = BOSSES[kind]; e = { kind: 'boss', look: B.look, name: B.name, boss: true, B, x, y: B.flying ? GROUND - 170 : GROUND, hp: B.hp * sc, dmg: B.dmg * ds, w: B.w, h: B.h, flying: !!B.flying, power: Math.round(rec * 2.2), ai: 0, state: 'idle', st: 2.4, xp: 40, coins: 40 }; }
    else { const R = ROBOTS[kind]; e = { kind, name: R.name, x, y: R.flying ? GROUND - 200 : GROUND, hp: R.hp * sc, dmg: R.dmg * ds, w: R.w, h: R.h, flying: !!R.flying, power: Math.round(rec * R.pw), state: 'walk', st: 0, xp: R.xp, coins: R.coins, windT: R.wind }; }
    Object.assign(e, { maxHp: e.hp, face: -1, t: rand(10), flash: 0, cd: rand(0.7, 1.7), off: rand(-30, 30), moving: false, spin: 0, kb: 0, entered: false });
    this.en.push(e); return e;
  }
  waveCleared() {
    Snd.play('correct');
    if (this.rumble) {
      this.h.hp = Math.min(this.h.maxHp, this.h.hp + this.h.maxHp * 0.15); this.got.coins += 5 + this.rw * 2; this.fx.text(this.h.x, this.h.y - 150, 'WAVE CLEAR! +' + (5 + this.rw * 2) + ' coins', '#ffe14d', 30);
      S.stats.rumble = Math.max(S.stats.rumble, this.rw);
      this.state = 'go'; this.stT = 0;
      if (this.rw % 3 === 0) this.crystal = { x: 640, y: GROUND - 95 };
      return;
    }
    if (this.wi >= this.waves.length - 1) { this.win(); return; }
    this.state = 'go'; this.lockR = this.zoneX(this.wi + 1) + W;
    if (!this.quizDone && this.wi === Math.max(0, Math.floor(this.waves.length / 2) - 1)) { this.crystal = { x: this.lockL + 1080, y: GROUND - 95 }; if (S.stats.math < 3) say('A power crystal! Touch it for a brain boost.'); }
  }

  /* ---------- hero ---------- */
  startAtk() {
    const h = this.h; let n;
    if (!h.on) n = 'kick'; else { h.chain = h.chainT > 0 ? h.chain % 3 + 1 : 1; n = 'punch' + h.chain; h.vx += h.face * 130; }
    h.atk = Object.assign({ pose: n, t: 0, done: false }, ATK[n]); h.buf = false; Snd.play('punch');
  }
  heroHit(a) {
    const h = this.h, x0 = Math.min(h.x - h.face * 10, h.x + h.face * a.range), x1 = Math.max(h.x - h.face * 10, h.x + h.face * a.range), y0 = h.y - 128, y1 = h.y - 4; let any = false;
    for (const e of this.en) if (!e.dead && e.x + e.w / 2 > x0 && e.x - e.w / 2 < x1 && e.y > y0 && e.y - e.h < y1) { this.damage(e, Calc.punch() * a.mult, h.face, a.big); any = true; }
    for (const p of this.props) if (!p.dead && p.x + 30 > x0 && p.x - 30 < x1 && h.y > GROUND - 70) { this.breakCrate(p); any = true; }
    if (any) { this.hitstop = a.big ? 0.09 : 0.045; this.shake = Math.max(this.shake, a.big ? 12 : 5); Snd.play(a.big ? 'bighit' : 'hit'); }
    if (a.big && S.armor[1] && h.on) { this.shots.push({ k: 'shock', friendly: true, x: h.x + h.face * 70, y: GROUND, vx: h.face * 720, vy: 0, r: 34, dmg: Calc.punch() * 0.8, life: 0.55, hit: [] }); Snd.play('zap'); }
  }
  breakCrate(p) {
    p.dead = true; this.fx.debris(p.x, GROUND - 30, 9, p.gold ? '#ffd23f' : '#9a6d3a'); this.fx.spark(p.x, GROUND - 30, 12, '#ffe14d');
    this.dropCoins(p.x, GROUND - 40, Math.round((p.gold ? 26 : 8) * (1 + this.diff * 0.12)), p.gold ? 9 : 5);
    if (Math.random() < 0.25) this.picks.push({ k: 'heart', x: p.x, y: GROUND - 50, vx: rand(-60, 60), vy: -420, t: 0 });
  }
  dropCoins(x, y, total, n) {
    total = Math.max(1, Math.round(total * (this.h.boost > 0 ? 2 : 1))); n = Math.min(n, total); const val = Math.floor(total / n); let rem = total - val * n;
    for (let i = 0; i < n; i++) this.picks.push({ k: 'coin', x, y, vx: rand(-230, 230), vy: rand(-620, -280), val: val + (rem-- > 0 ? 1 : 0), t: rand(0.2) });
  }
  damage(e, dmg, dir, big) {
    if (e.dead) return;
    if (e.boss && e.state === 'dizzy') dmg *= 1.5;
    if (this.h.boost > 0) dmg *= 1.4;
    e.hp -= dmg; e.flash = 0.1;
    this.fx.spark(e.x - dir * 10, e.y - e.h * 0.6, big ? 14 : 7, big ? '#ffd23f' : '#ffffff');
    this.fx.text(e.x + rand(-16, 16), e.y - e.h - 14, String(Math.round(dmg)), big ? '#ffd23f' : '#ffffff', big ? 34 : 24);
    if (!e.boss) {
      if ((e.kind !== 'brute' || big) && e.state !== 'roll') { e.state = 'stun'; e.st = big ? 0.5 : 0.28; }
      e.kb = dir * (big ? 520 : e.kind === 'brute' ? 60 : 200);
    }
    this.combo++; this.comboT = 2.6; this.comboPop = 1; if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    this.h.sup = Math.min(100, this.h.sup + (big ? 9 : 6));
    if (e.hp <= 0) this.kill(e, dir);
  }
  kill(e, dir) {
    e.dead = true; const L = LOOKS[e.look || e.kind], col = L ? L.c : e.kind === 'roller' ? '#2fa37a' : '#8d99ae', cy = e.y - e.h / 2;
    this.fx.debris(e.x, cy, e.boss ? 40 : 12, col); this.fx.debris(e.x, cy, e.boss ? 14 : 4, '#30343f'); this.fx.spark(e.x, cy, e.boss ? 50 : 18, '#ffb347', 520);
    this.fx.smoke(e.x, cy, e.boss ? 14 : 5); this.fx.ring(e.x, cy, '#ffd23f', e.boss ? 260 : 110);
    Snd.play('explode'); this.shake = Math.max(this.shake, e.boss ? 26 : 9);
    const xp = Math.round(e.xp * (1 + this.diff * 0.27)); this.got.xp += xp; this.got.robots++;
    this.fx.text(e.x, e.y - e.h - 44, '+' + xp + ' XP', '#7df9ff', 22);
    this.dropCoins(e.x, cy, e.coins * (1 + this.diff * 0.12), e.boss ? 16 : 4);
    const low = this.h.hp < this.h.maxHp * 0.4;
    if (Math.random() < (low ? 0.4 : 0.1) + S.build.hospital * 0.05 || e.boss) this.picks.push({ k: 'heart', x: e.x, y: cy, vx: rand(-80, 80), vy: -460, t: 0 });
    if (e.boss) { this.slow = 1.3; this.boss = null; Music.play('battle'); for (const o of this.en) if (!o.dead && o !== e) { o.hp = 0; this.kill(o, 1); } this.queue = []; }
  }
  hurtHero(dmg, fromX) {
    const h = this.h;
    if (h.inv > 0 || h.superT > 0 || (this.state !== 'fight' && this.state !== 'go')) return;
    if (S.armor[2]) dmg *= 0.75;
    dmg = Math.max(1, Math.round(dmg)); h.hp -= dmg; h.hurtT = 0.28; h.inv = 1.1; h.atk = null; h.buf = false;
    h.vx = sign(h.x - fromX) * 380; if (h.on) h.vy = -260, h.on = false;
    this.combo = 0; this.got.hits++; this.shake = Math.max(this.shake, 12); Snd.play('hurt');
    this.fx.text(h.x, h.y - 140, '-' + dmg, '#ff6b5a', 28); this.fx.spark(h.x, h.y - 70, 8, '#ff6b5a');
    if (h.hp <= 0) { h.hp = 0; this.state = 'lose'; this.stT = 0; hush(); }
  }
  upHero(dt) {
    const h = this.h, sp = Calc.speed(), ctl = h.hurtT <= 0 && h.superT <= 0;
    let mv = ctl ? (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0) : 0;
    if (h.atk && h.on) mv *= 0.25;
    if (h.hurtT <= 0) h.vx = lerp(h.vx, mv * sp, 1 - Math.exp(-dt * 14));
    if (mv && !h.atk) h.face = mv;
    if (ctl && Input.hit('jump')) {
      if (h.on) { h.vy = -860; h.on = false; h.jumps = 1; Snd.play('jump'); this.fx.smoke(h.x, GROUND, 2, '200,200,210'); }
      else if (S.armor[0] && h.jumps < 2) { h.vy = -780; h.jumps = 2; Snd.play('jump'); this.fx.ring(h.x, h.y, '#39d0ff', 50); }
    }
    h.jet = false;
    if (ctl && S.armor[3] && !h.on && Input.held('jump') && h.vy > -120 && h.en > 2) { h.vy = Math.max(h.vy - 3300 * dt, -250); h.en -= 26 * dt; h.jet = true; if (Math.random() < 0.5) this.fx.add({ k: 0, x: h.x - h.face * 18, y: h.y - 50, vx: rand(-40, 40), vy: 300, life: 0.25, max: 0.25, col: '#ffb347', g: 0 }); }
    h.vy += 2300 * dt; h.y += h.vy * dt; h.x += h.vx * dt;
    if (h.y >= GROUND) { if (!h.on && h.vy > 500) this.fx.smoke(h.x, GROUND, 2, '200,200,210'); h.y = GROUND; h.vy = 0; h.on = true; h.jumps = 0; }
    h.x = clamp(h.x, this.lockL + 34, this.lockR - 34);
    // attacks
    if (ctl && (Input.hit('punch') || Input.mouse.clicked)) { if (!h.atk) this.startAtk(); else if (h.atk.t > h.atk.dur * 0.3) h.buf = true; }
    if (h.atk) {
      const a = h.atk; a.t += dt;
      if (!a.done && a.t >= a.hitAt) { a.done = true; this.heroHit(a); }
      if (a.t >= a.dur || (a.pose === 'kick' && h.on)) { h.atk = null; h.chainT = 0.45; if (h.buf && ctl) this.startAtk(); }
    } else if (h.chainT > 0) h.chainT -= dt;
    if (ctl && Input.hit('blast')) {
      if (h.en >= 25) { h.en -= 25; h.blastT = 0.22; h.atk = null; Snd.play('blast'); this.shots.push({ k: 'blast', friendly: true, x: h.x + h.face * 52, y: h.y - 78, vx: h.face * 980, vy: 0, r: 15, dmg: Calc.blast(), life: 1.1 }); }
      else { Snd.play('wrong'); this.fx.text(h.x, h.y - 150, 'Energy low!', '#7df9ff', 22); }
    }
    if (ctl && Input.hit('super') && h.sup >= 100) { h.sup = 0; h.superT = 1.15; h.supTick = 0; h.atk = null; Snd.play('super'); this.shake = 20; this.setBanner(S.armor[4] ? '★ STAR BEAM ★' : 'MEGA BLAST!', '', '#ffe14d', 1.1); }
    if (h.superT > 0) {
      h.superT -= dt; h.supTick -= dt; h.vx = 0; this.shake = Math.max(this.shake, 6);
      if (h.supTick <= 0) { h.supTick = 0.12; const d = Calc.blast() * (S.armor[4] ? 1.3 : 0.8); for (const e of this.en) if (!e.dead && Math.abs(e.x - this.cam - W / 2) < W / 2 + 60 && (S.armor[4] || sign(e.x - h.x) === h.face || Math.abs(e.x - h.x) < 70)) this.damage(e, d, sign(e.x - h.x), false); }
    }
    if (h.blastT > 0) h.blastT -= dt;
    if (h.hurtT > 0) h.hurtT -= dt;
    if (h.inv > 0) h.inv -= dt;
    if (h.boost > 0) h.boost -= dt;
    h.en = Math.min(h.maxEn, h.en + Calc.regen() * dt);
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
    if (this.comboPop > 0) this.comboPop -= dt * 5;
  }

  /* ---------- robots ---------- */
  upEnemy(e, dt) {
    e.t += dt; if (e.flash > 0) e.flash -= dt; e.moving = false;
    const h = this.h, dx = h.x - e.x, adx = Math.abs(dx);
    if (e.kb) { e.x += e.kb * dt; e.kb *= Math.pow(0.003, dt); if (Math.abs(e.kb) < 12) e.kb = 0; }
    if (e.state === 'stun') { e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = Math.max(e.cd, 0.35); } }
    else if (e.boss) this.upBoss(e, dt);
    else if (e.kind === 'scrapper' || e.kind === 'brute') {
      const R = ROBOTS[e.kind], range = R.range + e.off * 0.3;
      if (e.state === 'walk') {
        e.face = sign(dx); e.cd -= dt;
        if (adx > range) { e.x += e.face * R.speed * dt; e.moving = true; }
        else if (e.cd <= 0 && this.en.filter(o => o.state === 'wind').length < 2) { e.state = 'wind'; e.st = e.windT; }
      } else if (e.state === 'wind') {
        e.st -= dt;
        if (e.st <= 0) {
          e.state = 'swing'; e.st = 0.24;
          if (Math.abs(h.x - e.x) < R.range + 36 && (sign(h.x - e.x) === e.face || Math.abs(h.x - e.x) < 30) && h.y > GROUND - 110) this.hurtHero(e.dmg, e.x);
          if (e.kind === 'brute') { this.shake = Math.max(this.shake, 10); this.fx.ring(e.x + e.face * 80, GROUND, '#ffb347', 90); Snd.play('bighit'); }
        }
      } else if (e.state === 'swing') { e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = rand(1.0, 1.9); } }
    } else if (e.kind === 'roller') {
      if (e.state === 'walk') { e.face = sign(dx); e.cd -= dt; if (adx > 430) { e.x += e.face * 100 * dt; e.spin += e.face * dt * 4; } if (e.cd <= 0) { e.state = 'wind'; e.st = e.windT; } }
      else if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) { e.state = 'roll'; e.st = 1.1; e.dir = e.face; e.hitOnce = false; } }
      else if (e.state === 'roll') {
        e.st -= dt; e.x += e.dir * 540 * dt; e.spin += e.dir * dt * 18;
        if (!e.hitOnce && adx < 54 && h.y > GROUND - 62) { this.hurtHero(e.dmg, e.x); e.hitOnce = true; }
        if (e.x < this.lockL + 44 || e.x > this.lockR - 44) e.st = 0;
        if (e.st <= 0) { e.state = 'walk'; e.cd = rand(1.3, 2.3); }
      }
    } else if (e.kind === 'zapper') {
      if (e.state === 'walk') {
        e.face = sign(dx); e.cd -= dt; const want = 400 + e.off * 2;
        if (adx > want + 60) { e.x += e.face * 90 * dt; e.moving = true; } else if (adx < want - 130) { e.x -= e.face * 70 * dt; e.moving = true; }
        if (e.cd <= 0 && adx < 720) { e.state = 'wind'; e.st = e.windT; Snd.play('charge'); }
      } else if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) { this.shots.push({ k: 'orb', x: e.x + e.face * 30, y: GROUND - 62, vx: e.face * 400, vy: 0, r: 15, dmg: e.dmg, life: 3 }); Snd.play('zap'); e.state = 'swing'; e.st = 0.3; } }
      else if (e.state === 'swing') { e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = rand(1.9, 2.9); } }
    } else if (e.kind === 'drone') {
      e.y = GROUND - 200 + Math.sin(e.t * 2) * 10; const tx = h.x + e.off * 3, d = tx - e.x;
      if (e.state === 'walk') { e.face = sign(dx); if (Math.abs(d) > 16) e.x += sign(d) * 150 * dt; e.cd -= dt; if (e.cd <= 0 && adx < 170) { e.state = 'wind'; e.st = e.windT; } }
      else if (e.state === 'wind') { e.st -= dt; if (e.st <= 0) { this.shots.push({ k: 'bomb', x: e.x, y: e.y, vx: 0, vy: 80, g: 950, r: 12, dmg: e.dmg, life: 4 }); e.state = 'swing'; e.st = 0.3; } }
      else if (e.state === 'swing') { e.st -= dt; if (e.st <= 0) { e.state = 'walk'; e.cd = rand(2.0, 3.0); } }
    }
    if (!e.entered) { if (e.x > this.lockL + 50 && e.x < this.lockR - 50) e.entered = true; }
    else e.x = clamp(e.x, this.lockL + 40, this.lockR - 40);
    if (e.hp < e.maxHp * 0.35 && Math.random() < dt * 5) this.fx.smoke(e.x + rand(-10, 10), e.y - e.h * 0.8, 1, '60,60,66');
  }
  dizzy(e, d = 1.9) {
    e.state = 'dizzy'; e.st = d;
    if (!this.saidDizzy && d > 1.5) { this.saidDizzy = true; say('The boss is dizzy! Attack now!'); }
  }
  upBoss(e, dt) {
    const h = this.h, dx = h.x - e.x, B = e.B, homeY = e.flying ? GROUND - 170 : GROUND, rage = e.hp < e.maxHp * 0.4;
    switch (e.state) {
      case 'idle':
        e.face = sign(dx); if (Math.abs(dx) > 230) { e.x += e.face * (e.flying ? 150 : 95) * dt; e.moving = true; }
        if (e.flying) e.y = lerp(e.y, homeY + Math.sin(e.t * 2) * 12, Math.min(1, dt * 3));
        e.st -= dt;
        if (e.st <= 0) {
          let a = B.attacks[e.ai % B.attacks.length]; e.ai++;
          if (a === 'summon' && this.en.length > 3) a = B.attacks[0];
          e.atk = a; e.state = (a === 'charge' || a === 'slam') ? 'wind' : 'cast';
          e.st = e.windT = { charge: 0.95, slam: 0.65, missiles: 0.75, laser: 1.15, summon: 0.7 }[a] * (rage ? 0.8 : 1); Snd.play('warn');
        }
        break;
      case 'wind': case 'cast':
        e.st -= dt;
        if (e.st <= 0) switch (e.atk) {
          case 'charge': e.state = 'charge'; e.dir = e.face; e.st = 1.3; e.hitOnce = false; Snd.play('blast'); break;
          case 'slam': e.state = 'air'; e.at = 0; e.sx = e.x; e.tx = clamp(h.x, this.lockL + 130, this.lockR - 130); Snd.play('jump'); break;
          case 'missiles': { const n = 3 + (rage ? 2 : 0) + (this.diff > 8 ? 1 : 0); for (let i = 0; i < n; i++) this.shots.push({ k: 'bomb', x: clamp(h.x + (i - (n - 1) / 2) * 150 + rand(-30, 30), this.lockL + 40, this.lockR - 40), y: -60 - i * 230, vx: 0, vy: 560, g: 0, r: 14, dmg: e.dmg * 0.8, life: 6 }); this.fx.smoke(e.x, e.y - e.h, 6); Snd.play('blast'); this.dizzy(e, 1.3); break; }
          case 'laser': e.state = 'laser'; e.st = 0.45; Snd.play('super'); this.shake = 10; break;
          case 'summon': this.spawn(pick(['scrapper', 'roller']), this.lockL - 60); this.spawn('scrapper', this.lockR + 60); Snd.play('charge'); this.dizzy(e, 1.3); break;
        }
        break;
      case 'charge':
        e.x += e.dir * 880 * dt; e.st -= dt; if (e.flying) e.y = lerp(e.y, GROUND, Math.min(1, dt * 8));
        if (Math.random() < 0.6) this.fx.smoke(e.x - e.dir * 50, GROUND, 1, '200,200,210');
        if (!e.hitOnce && Math.abs(h.x - e.x) < e.w / 2 + 30 && h.y > GROUND - 100) { this.hurtHero(e.dmg, e.x); e.hitOnce = true; }
        if (e.x < this.lockL + 95 || e.x > this.lockR - 95 || e.st <= 0) { e.x = clamp(e.x, this.lockL + 95, this.lockR - 95); this.shake = 14; Snd.play('bighit'); this.fx.spark(e.x + e.dir * 60, e.y - 80, 20, '#ffb347'); this.dizzy(e); }
        break;
      case 'air': {
        e.at += dt; const k = Math.min(1, e.at / 0.8); e.x = lerp(e.sx, e.tx, k); e.y = GROUND - Math.sin(k * Math.PI) * 300;
        if (k >= 1) {
          e.y = GROUND; this.shake = 18; Snd.play('bighit'); this.fx.ring(e.x, GROUND, '#ffb347', 200); this.fx.smoke(e.x, GROUND, 8, '200,200,210');
          for (const s of [-1, 1]) this.shots.push({ k: 'wave', x: e.x + s * 50, y: GROUND, vx: s * 500, vy: 0, r: 26, dmg: e.dmg * 0.8, life: 1.5 });
          if (Math.abs(h.x - e.x) < e.w / 2 + 24 && h.y > GROUND - 60) this.hurtHero(e.dmg, e.x);
          this.dizzy(e);
        }
        break;
      }
      case 'laser':
        e.st -= dt;
        if (h.y > GROUND - 96 && sign(h.x - e.x) === e.face) this.hurtHero(e.dmg, e.x);
        if (e.st <= 0) this.dizzy(e, 1.6);
        break;
      case 'dizzy':
        if (e.flying) e.y = lerp(e.y, GROUND, Math.min(1, dt * 6));
        e.st -= dt; if (e.st <= 0) { e.state = 'idle'; e.st = rand(1.0, 1.8) * (rage ? 0.55 : 1); }
        break;
    }
  }
  upShots(dt) {
    const h = this.h;
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i]; s.life -= dt; let dead = s.life <= 0;
      if (s.k === 'blast') { // smart blast: gently steers toward the nearest robot in front
        let best = null, bd = 760; for (const e of this.en) { const d = (e.x - s.x) * sign(s.vx); if (!e.dead && d > -20 && d < bd) { bd = d; best = e; } }
        s.vy = best ? clamp((best.y - best.h / 2 - s.y) * 7, -560, 560) : 0;
        this.fx.add({ k: 0, x: s.x, y: s.y, vx: -s.vx * 0.1, vy: rand(-30, 30), life: 0.15, max: 0.15, col: '#7df9ff', g: 0 });
      }
      if (s.g) s.vy += s.g * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.friendly) {
        for (const e of this.en) {
          if (e.dead || s.x + s.r < e.x - e.w / 2 || s.x - s.r > e.x + e.w / 2 || s.y - s.r > e.y || s.y + s.r < e.y - e.h - (s.k === 'shock' ? -40 : 0)) continue;
          if (s.k === 'shock') { if (!s.hit.includes(e) && !e.flying) { s.hit.push(e); this.damage(e, s.dmg, sign(s.vx), false); } }
          else { this.damage(e, s.dmg, sign(s.vx), false); this.fx.ring(s.x, s.y, '#7df9ff', 46); Snd.play('hit'); dead = true; break; }
        }
        if (s.k === 'blast' && !dead) for (const p of this.props) if (!p.dead && Math.abs(p.x - s.x) < 40 && s.y > GROUND - 80) { this.breakCrate(p); dead = true; break; }
      } else if (s.k === 'orb') { if (Math.abs(s.x - h.x) < s.r + 22 && s.y > h.y - 122 && s.y < h.y + 6) { this.hurtHero(s.dmg, s.x - s.vx); dead = true; this.fx.spark(s.x, s.y, 10, '#7df9ff'); } }
      else if (s.k === 'bomb') { if (s.y >= GROUND - 8) { dead = true; this.fx.ring(s.x, GROUND - 10, '#ff7b3d', 95); this.fx.spark(s.x, GROUND - 14, 14, '#ffb347', 420); this.fx.smoke(s.x, GROUND - 10, 3); Snd.play('explode'); this.shake = Math.max(this.shake, 7); if (Math.abs(h.x - s.x) < 88 && h.y > GROUND - 92) this.hurtHero(s.dmg, s.x); } }
      else if (s.k === 'wave') { if (Math.abs(s.x - h.x) < 36 && h.y > GROUND - 38) this.hurtHero(s.dmg, s.x - s.vx); }
      if (s.x < this.cam - 260 || s.x > this.cam + W + 260) dead = true;
      if (dead) this.shots.splice(i, 1);
    }
  }
  upPicks(dt) {
    const h = this.h, all = this.state !== 'fight';
    for (let i = this.picks.length - 1; i >= 0; i--) {
      const p = this.picks[i]; p.t += dt; const dx = h.x - p.x, dy = h.y - 60 - p.y, d = Math.hypot(dx, dy);
      if (p.t > 0.55 && (d < 250 || all)) { const v = 950; p.vx = lerp(p.vx, dx / d * v, Math.min(1, dt * 9)); p.vy = lerp(p.vy, dy / d * v, Math.min(1, dt * 9)); }
      else { p.vy += 1700 * dt; if (p.y > GROUND - 14 && p.vy > 0) { p.y = GROUND - 14; p.vy *= -0.45; p.vx *= 0.7; } }
      p.x += p.vx * dt; p.y += p.vy * dt; p.x = clamp(p.x, this.lockL + 20, this.lockR - 20);
      if (d < 46 && p.t > 0.3) {
        if (p.k === 'coin') { this.got.coins += p.val; this.coinPulse = 1; Snd.play('coin'); }
        else { const heal = Math.round(h.maxHp * 0.2); h.hp = Math.min(h.maxHp, h.hp + heal); Snd.play('heart'); this.fx.text(h.x, h.y - 150, '+' + heal + ' ♥', '#ff8fa3', 26); }
        this.picks.splice(i, 1);
      }
    }
  }

  /* ---------- main update ---------- */
  update(dt) {
    if (Input.hit('pause') && !this.paused && (this.state === 'fight' || this.state === 'go' || this.state === 'intro')) { this.paused = true; UI.pause(this); return; }
    if (this.paused || this.state === 'quiz' || this.state === 'done') return;
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    if (this.slow > 0) { this.slow -= dt; dt *= 0.35; }
    this.t += dt; this.stT += dt;
    if (this.banner) { this.banner.t += dt; if (this.banner.t > this.banner.dur) this.banner = null; }
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 40);
    if (this.coinPulse > 0) this.coinPulse -= dt * 4;
    this.fx.update(dt);
    for (const p of this.props) if (p.hitT > 0) p.hitT -= dt;

    if (this.state === 'lose') { this.h.vx *= 0.9; this.h.vy += 2300 * dt; this.h.y = Math.min(GROUND, this.h.y + this.h.vy * dt); if (this.stT > 1.4) this.finishLose(); return; }
    if (this.state === 'win') { const h = this.h; h.vx = 0; h.vy += 2300 * dt; h.y = Math.min(GROUND, h.y + h.vy * dt); this.upPicks(dt); if (this.stT > 2.6) this.finishWin(); return; }
    if (this.state === 'intro') { if (this.stT > 1.7) { if (this.rumble) this.startRumble(); else this.startWave(0); } }

    this.upHero(dt);
    for (const e of this.en) if (!e.dead) this.upEnemy(e, dt);
    for (let i = 0; i < this.en.length; i++) for (let j = i + 1; j < this.en.length; j++) { // keep robots from standing inside each other
      const a = this.en[i], b = this.en[j]; if (a.boss || b.boss || a.flying !== b.flying || a.state === 'roll' || b.state === 'roll') continue;
      const d = b.x - a.x; if (Math.abs(d) < 46) { const p = (d >= 0 ? 1 : -1) * 60 * dt; a.x -= p; b.x += p; }
    }
    this.en = this.en.filter(e => !e.dead); this.props = this.props.filter(p => !p.dead);
    this.upShots(dt); this.upPicks(dt);

    if (this.state === 'fight') {
      this.spawnT -= dt;
      const active = this.en.filter(e => !e.boss).length, cap = 3 + (this.diff > 5 ? 1 : 0);
      if (this.queue.length && active < cap && this.spawnT <= 0) { const k = this.queue.shift(), right = Math.random() < 0.7; this.spawn(k, right ? this.lockR + 70 : this.lockL - 70); this.spawnT = 0.75; }
      if (!this.queue.length && !this.en.length) this.waveCleared();
    } else if (this.state === 'go') {
      if (this.rumble) { if (this.stT > 2 && !this.crystal) this.startRumble(); }
      else if (this.h.x - 520 >= this.zoneX(this.wi + 1)) this.startWave(this.wi + 1);
    }
    if (this.crystal && Math.abs(this.h.x - this.crystal.x) < 62 && this.h.y > GROUND - 190) this.openQuiz();
    const target = clamp(this.h.x - 520, this.lockL, this.lockR - W);
    this.cam = lerp(this.cam, target, 1 - Math.exp(-dt * 6));
  }
  openQuiz() {
    this.crystal = null; this.quizDone = true; const prev = this.state; this.state = 'quiz'; Snd.play('crystal'); UI.touch(false);
    UI.quiz(makeQuestion(S.mathTier), ok => {
      const h = this.h; this.state = prev; this.stT = 0; UI.touch(true);
      if (ok) { h.boost = 25; h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.3); h.en = h.maxEn; h.sup = Math.min(100, h.sup + 40); this.got.math++; this.setBanner('⚡ POWER SURGE! ⚡', 'Stronger hits and double coins for 25 seconds', '#7df9ff', 2.4); Snd.play('levelup'); this.fx.ring(h.x, h.y - 60, '#7df9ff', 220); }
      else { h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.1); this.setBanner('Good try!', 'You still get a little health', '#ffffff', 1.8); }
    });
  }
  win() { this.state = 'win'; this.stT = 0; Snd.play('fanfare'); this.setBanner('MISSION COMPLETE!', '', '#ffe14d', 2.6); this.shots = []; }
  finishWin() {
    this.state = 'done'; const st = this.stage, first = !S.stars[st], stars = this.got.hits === 0 ? 3 : this.got.hits <= 4 ? 2 : 1;
    const bonusXp = first ? 10 + st * 4 : 3, xp = this.got.xp + bonusXp, saved = S.coins;
    const interest = Math.min(150 * S.build.bank, Math.floor(saved * S.build.bank * 0.05));
    const lvBefore = S.level, pBefore = Calc.power();
    S.coins += this.got.coins + interest; const ups = Calc.addXp(xp);
    S.stats.robots += this.got.robots; S.stats.math += this.got.math; S.stats.wins++; S.stats.bestCombo = Math.max(S.stats.bestCombo, this.maxCombo); if (this.got.hits === 0) S.stats.noHit++;
    S.stars[st] = Math.max(S.stars[st] || 0, stars); if (st >= S.stage) S.stage = st + 1;
    let armor = null; if (st % 3 === 2 && !S.armor[this.d]) { S.armor[this.d] = true; armor = ARMOR[this.d]; S.pendingCity = Calc.cityLevel(); }
    const badges = checkBadges(); Save.save();
    UI.results({ win: true, title: 'MISSION COMPLETE!', stars, coins: this.got.coins, interest, saved, xp: Math.round(xp * (1 + S.build.park * 0.1)), ups, lvBefore, pBefore, armor, badges, combo: this.maxCombo, robots: this.got.robots, stage: st });
  }
  finishLose() {
    this.state = 'done'; const keep = this.rumble ? this.got.coins : Math.floor(this.got.coins / 2), lvBefore = S.level, pBefore = Calc.power();
    S.coins += keep; const ups = Calc.addXp(this.got.xp);
    S.stats.robots += this.got.robots; S.stats.math += this.got.math; S.stats.bestCombo = Math.max(S.stats.bestCombo, this.maxCombo);
    const badges = checkBadges(); Save.save();
    const rec = Calc.recPower(this.stage), weak = !this.rumble && Calc.power() < rec;
    const tip = this.rumble ? `You beat ${this.rw - 1} waves! Train and build to go even further.` : weak ? `This mission needs Power ${rec}. You have ${Calc.power()}. Train in the Dojo to get stronger!` : pick(TIPS);
    UI.results({ win: false, rumble: this.rumble, title: this.rumble ? `RUMBLE OVER - WAVE ${this.rw}` : 'BOLT RESCUED YOU!', coins: keep, xp: Math.round(this.got.xp * (1 + S.build.park * 0.1)), ups, lvBefore, pBefore, badges, tip, combo: this.maxCombo, robots: this.got.robots, stage: this.stage });
  }

  /* ---------- drawing ---------- */
  draw(g) {
    const h = this.h, t = this.t, sx = this.shake ? rand(-this.shake, this.shake) : 0, sy = this.shake ? rand(-this.shake, this.shake) * 0.6 : 0, cam = this.cam;
    this.back.draw(g, cam, t);
    g.save(); g.translate(-cam + sx, sy);
    for (const p of this.props) drawCrate(g, p.x, GROUND, p.gold, p.hitT);
    if (this.crystal) { drawCrystal(g, this.crystal.x, this.crystal.y, t); g.fillStyle = '#d9fdff'; g.font = `bold 20px ${FONT}`; g.textAlign = 'center'; g.fillText('BRAIN BOOST', this.crystal.x, this.crystal.y - 70); }
    // shadows
    g.fillStyle = 'rgba(0,0,0,0.35)';
    for (const e of this.en) { const k = clamp(1 - (GROUND - e.y) / 400, 0.3, 1); g.beginPath(); g.ellipse(e.x, GROUND + 6, e.w * 0.55 * k, 9 * k, 0, 0, TAU); g.fill(); }
    { const k = clamp(1 - (GROUND - h.y) / 400, 0.3, 1); g.beginPath(); g.ellipse(h.x, GROUND + 6, 34 * k, 8 * k, 0, 0, TAU); g.fill(); }
    // bomb landing markers + boss warnings
    for (const s of this.shots) if (s.k === 'bomb') { g.strokeStyle = `rgba(255,70,50,${0.5 + Math.sin(t * 20) * 0.3})`; g.lineWidth = 3; g.beginPath(); g.ellipse(s.x, GROUND + 4, 70, 12, 0, 0, TAU); g.stroke(); }
    for (const e of this.en) if (e.boss) {
      if (e.state === 'wind' && e.atk === 'charge') { g.fillStyle = `rgba(255,60,40,${0.35 + Math.sin(t * 24) * 0.2})`; for (let i = 1; i < 7; i++) { const ax = e.x + e.face * (60 + i * 90); g.beginPath(); g.moveTo(ax, GROUND + 14); g.lineTo(ax + e.face * 40, GROUND + 26); g.lineTo(ax, GROUND + 38); g.fill(); } }
      if (e.atk === 'laser' && (e.state === 'cast' || e.state === 'laser')) { const y = GROUND - 52, x1 = e.x + e.face * 50, x2 = e.x + e.face * 1500; if (e.state === 'cast') { g.strokeStyle = `rgba(255,50,50,${0.4 + Math.sin(t * 30) * 0.3})`; g.lineWidth = 3; seg(g, x1, y, x2, y); } else { g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,60,40,0.55)'; g.lineWidth = 46 + Math.sin(t * 60) * 8; seg(g, x1, y, x2, y); g.strokeStyle = '#ffffff'; g.lineWidth = 14; seg(g, x1, y, x2, y); g.globalCompositeOperation = 'source-over'; } }
    }
    for (const e of this.en) {
      drawEnemy(g, e);
      if (e.state === 'wind' || e.state === 'cast') { g.fillStyle = '#ff3b2f'; g.font = `bold ${e.boss ? 54 : 36}px ${FONT}`; g.textAlign = 'center'; g.fillText('!', e.x, e.y - e.h - 46 + Math.sin(t * 30) * 3); }
      if (e.state === 'dizzy') for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3; g.fillStyle = '#ffe14d'; g.font = '26px Arial'; g.textAlign = 'center'; g.fillText('★', e.x + Math.cos(a) * 46, e.y - e.h - 12 + Math.sin(a) * 12); }
      if (!e.boss) { // power level tag + health
        const ty = e.y - e.h - 22, c = this.pcol(e.power), txt = '⚡' + e.power;
        g.font = `bold 15px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillStyle = 'rgba(8,10,18,0.75)'; rr(g, e.x - 27, ty - 11, 54, 20, 10); g.fill(); g.fillStyle = c; g.fillText(txt, e.x, ty);
        if (e.hp < e.maxHp) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(e.x - 26, ty + 12, 52, 5); g.fillStyle = c; g.fillRect(e.x - 26, ty + 12, 52 * clamp(e.hp / e.maxHp, 0, 1), 5); }
      }
    }
    for (const p of this.picks) { if (p.k === 'coin') drawCoin(g, p.x, p.y, 10, p.t + p.x); else drawHeart(g, p.x, p.y, 13 + Math.sin(t * 8) * 1.5); }
    // hero
    let pose = 'idle', pt = 0;
    if (this.state === 'win') pose = 'win'; else if (h.hurtT > 0 || this.state === 'lose') pose = 'hurt'; else if (h.superT > 0 || h.blastT > 0) pose = 'blast';
    else if (h.atk) { pose = h.atk.pose; pt = h.atk.t / h.atk.dur; } else if (!h.on) pose = h.jet ? 'hover' : h.vy < 0 ? 'jump' : 'fall'; else if (Math.abs(h.vx) > 50) pose = 'run';
    if (h.boost > 0) glow(g, h.x, h.y - 60, 95 + Math.sin(t * 10) * 8, '#39d0ff', 0.45);
    if (h.sup >= 100) glow(g, h.x, h.y - 60, 80, '#ffd23f', 0.25 + Math.sin(t * 8) * 0.12);
    drawHero(g, { x: h.x, y: h.y, face: h.face, t, pose, pt, armor: S.armor, suit: S.suit, jet: h.jet, alpha: h.inv > 0 && Math.floor(t * 18) % 2 ? 0.35 : 1 });
    if (h.atk && h.atk.big && pt > 0.2 && pt < 0.7) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = S.armor[1] ? 'rgba(255,210,63,0.8)' : 'rgba(255,255,255,0.6)'; g.lineWidth = 9; g.beginPath(); g.arc(h.x + h.face * 30, h.y - 70, 70, h.face > 0 ? -1.3 : Math.PI - 0.5, h.face > 0 ? 0.5 : Math.PI + 1.3); g.stroke(); g.globalCompositeOperation = 'source-over'; }
    // super beam
    if (h.superT > 0) {
      const y = h.y - 78, wv = 60 + Math.sin(t * 70) * 14, col = S.armor[4] ? 'rgba(179,136,255,0.6)' : 'rgba(57,208,255,0.6)';
      g.globalCompositeOperation = 'lighter';
      for (const dir of S.armor[4] ? [1, -1] : [h.face]) { const x1 = h.x + dir * 44, x2 = h.x + dir * 1500; g.strokeStyle = col; g.lineWidth = wv * 2; seg(g, x1, y, x2, y); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = wv * 0.7; seg(g, x1, y, x2, y); }
      g.globalCompositeOperation = 'source-over'; glow(g, h.x + h.face * 44, y, 130, '#ffffff', 0.9);
    }
    for (const s of this.shots) {
      if (s.k === 'blast') { glow(g, s.x, s.y, 44, '#39d0ff', 0.9); g.fillStyle = '#ffffff'; circ(g, s.x, s.y, 8); }
      else if (s.k === 'orb') { glow(g, s.x, s.y, 40, '#b388ff', 0.9); g.fillStyle = '#f1e6ff'; circ(g, s.x, s.y, 9 + Math.sin(t * 40) * 2); }
      else if (s.k === 'bomb') { g.fillStyle = '#23272f'; circ(g, s.x, s.y, s.r); g.fillStyle = '#ff3b2f'; circ(g, s.x, s.y - 3, 4); glow(g, s.x, s.y, 26, '#ff3b2f', 0.5 + Math.sin(t * 30) * 0.4); }
      else { const c = s.k === 'shock' ? '#ffd23f' : '#ff7b3d'; glow(g, s.x, GROUND - 14, 60, c, 0.8); g.fillStyle = c; g.beginPath(); g.moveTo(s.x - 26, GROUND + 6); g.quadraticCurveTo(s.x + sign(s.vx) * 10, GROUND - 70, s.x + sign(s.vx) * 34, GROUND + 6); g.fill(); }
    }
    this.fx.draw(g);
    g.restore();
    this.back.drawFront(g, cam, t, 1 / 60);
    if (h.superT > 1.0) { g.fillStyle = `rgba(255,255,255,${(h.superT - 1.0) * 5})`; g.fillRect(0, 0, W, H); }
    if (h.hp < h.maxHp * 0.3 && this.state !== 'done') { g.fillStyle = `rgba(255,30,30,${0.1 + Math.sin(t * 6) * 0.06})`; g.fillRect(0, 0, W, H); }
    this.drawHud(g);
  }
  bar(g, x, y, w, hh, f, c1, c2) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; rr(g, x - 2, y - 2, w + 4, hh + 4, hh / 2 + 2); g.fill();
    if (f > 0.01) { const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, c1); gr.addColorStop(1, c2); g.fillStyle = gr; rr(g, x, y, Math.max(hh, w * clamp(f, 0, 1)), hh, hh / 2); g.fill(); g.fillStyle = 'rgba(255,255,255,0.25)'; rr(g, x + 3, y + 2, Math.max(4, w * clamp(f, 0, 1) - 6), hh * 0.3, 2); g.fill(); }
  }
  drawHud(g) {
    const h = this.h, t = this.t;
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, 14, 12, 400, 104, 18); g.fill();
    g.fillStyle = SUITS[S.suit][0]; circ(g, 60, 62, 34); g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = `bold 13px ${FONT}`; g.fillText('LEVEL', 60, 46); g.font = `bold 32px ${FONT}`; g.fillText(S.level, 60, 70);
    g.textAlign = 'left'; g.font = `bold 17px ${FONT}`; g.fillStyle = '#fff'; g.fillText(S.name, 108, 28);
    g.fillStyle = this.pcol(this.power * 0.5); g.textAlign = 'right'; g.fillText('⚡ POWER ' + this.power, 400, 28);
    const hpF = h.hp / h.maxHp; this.bar(g, 108, 42, 290, 22, hpF, hpF < 0.3 ? '#ff3b2f' : '#2fbf71', hpF < 0.3 ? '#ff7b54' : '#9be36a');
    g.fillStyle = '#fff'; g.font = `bold 14px ${FONT}`; g.textAlign = 'center'; g.fillText(`♥ ${Math.ceil(h.hp)} / ${h.maxHp}`, 253, 54);
    this.bar(g, 108, 72, 290, 11, h.en / h.maxEn, '#1b6fd6', '#7df9ff');
    const full = h.sup >= 100; this.bar(g, 108, 91, 290, 11, h.sup / 100, '#ff8c1a', full && Math.sin(t * 12) > 0 ? '#ffffff' : '#ffe14d');
    if (full) { g.fillStyle = '#ffe14d'; g.font = `bold 20px ${FONT}`; g.textAlign = 'left'; g.fillText(UI.isTouch ? 'SUPER READY!' : 'SUPER READY!  Press L', 24, 136); }
    if (h.boost > 0) { g.fillStyle = '#7df9ff'; g.font = `bold 18px ${FONT}`; g.textAlign = 'left'; g.fillText('⚡ POWER SURGE ' + Math.ceil(h.boost) + 's', 24, full ? 162 : 136); }
    // coins
    const cs = 1 + Math.max(0, this.coinPulse) * 0.15;
    g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, W - 214, 12, 200, 50, 25); g.fill(); drawCoin(g, W - 184, 37, 15, t);
    g.fillStyle = '#ffe14d'; g.font = `bold ${Math.round(28 * cs)}px ${FONT}`; g.textAlign = 'left'; g.fillText(S.coins + this.got.coins, W - 160, 38);
    // waves
    if (!this.rumble && this.wi >= 0) { const n = this.waves.length, x0 = W / 2 - (n - 1) * 17; for (let i = 0; i < n; i++) { g.fillStyle = i < this.wi || (i === this.wi && this.state !== 'fight') ? '#5fd68a' : i === this.wi ? '#ffe14d' : 'rgba(255,255,255,0.3)'; if (this.waves[i].boss) { g.font = '22px Arial'; g.textAlign = 'center'; g.fillText('☠', x0 + i * 34, 30); } else circ(g, x0 + i * 34, 28, 9); } }
    if (this.rumble) { g.fillStyle = '#ffe14d'; g.font = `bold 26px ${FONT}`; g.textAlign = 'center'; g.fillText('WAVE ' + Math.max(1, this.rw), W / 2, 32); }
    // combo
    if (this.combo > 1) { const s = 1 + Math.max(0, this.comboPop) * 0.35, c = this.combo >= 25 ? '#ff5a5a' : this.combo >= 10 ? '#ffb347' : '#ffe14d'; g.save(); g.translate(W - 120, 170); g.rotate(-0.08); g.scale(s, s); g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.font = `bold 78px ${FONT}`; g.strokeText(this.combo, 0, 0); g.fillStyle = c; g.fillText(this.combo, 0, 0); g.font = `bold 26px ${FONT}`; g.strokeText('HITS!', 0, 52); g.fillText('HITS!', 0, 52); g.restore(); }
    // boss bar
    if (this.boss) { const b = this.boss; g.fillStyle = 'rgba(10,14,26,0.72)'; rr(g, 290, 646, 700, 60, 16); g.fill(); g.fillStyle = '#ff6b5a'; g.font = `bold 20px ${FONT}`; g.textAlign = 'left'; g.fillText('☠ ' + b.name, 310, 664); g.textAlign = 'right'; g.fillStyle = this.pcol(b.power); g.fillText('⚡ ' + b.power, 970, 664); this.bar(g, 310, 680, 660, 16, b.hp / b.maxHp, '#b0283a', '#ff6b5a'); if (b.state === 'dizzy') { g.fillStyle = '#ffe14d'; g.font = `bold 34px ${FONT}`; g.textAlign = 'center'; g.fillText('DIZZY - ATTACK NOW!', W / 2, 616 + Math.sin(t * 14) * 4); } }
    // GO arrow
    if (this.state === 'go' && !this.rumble && Math.sin(t * 8) > -0.3) { g.fillStyle = '#ffe14d'; g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = 8; g.font = `bold 70px ${FONT}`; g.textAlign = 'center'; g.strokeText('GO ➜', W - 170, 330); g.fillText('GO ➜', W - 170, 330); }
    // banner
    if (this.banner) { const b = this.banner, a = clamp(Math.min(b.t * 5, (b.dur - b.t) * 3), 0, 1); g.globalAlpha = a; g.fillStyle = 'rgba(8,10,20,0.72)'; g.fillRect(0, 232, W, b.sub ? 124 : 96); g.fillStyle = b.col; g.fillRect(0, 232, W, 4); g.fillRect(0, (b.sub ? 356 : 328) - 4, W, 4); g.textAlign = 'center'; g.font = `bold 56px ${FONT}`; g.fillText(b.text, W / 2 + (1 - a) * 80, 280); if (b.sub) { g.fillStyle = '#fff'; g.font = `24px ${FONT}`; g.fillText(b.sub, W / 2, 328); } g.globalAlpha = 1; }
    // controls help on the first mission
    if (this.stage === 0 && !this.rumble && !UI.isTouch && !this.boss && S.stats.wins < 2) {
      const keys = [['← →', 'Move'], ['SPACE', 'Jump'], ['J', 'Punch'], ['K', 'Blast'], ['L', 'Super']]; let x = 250; g.font = `bold 17px ${FONT}`;
      g.fillStyle = 'rgba(10,14,26,0.66)'; rr(g, 236, 668, 808, 40, 14); g.fill();
      for (const [k, v] of keys) { const kw = g.measureText(k).width + 18; g.fillStyle = '#ffe14d'; rr(g, x, 675, kw, 26, 6); g.fill(); g.fillStyle = '#14182a'; g.textAlign = 'center'; g.fillText(k, x + kw / 2, 689); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(v, x + kw + 8, 689); x += kw + 16 + g.measureText(v).width + 26; }
    }
  }
}
