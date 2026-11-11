'use strict';
/* ============================================================
   FIGHTER CRAFT - core: helpers, input, sound, voice, save, power math
   ============================================================ */
const W = 1280, H = 720, TAU = Math.PI * 2, GROUND = 612;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const sign = v => v < 0 ? -1 : 1;
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function rng(seed) { // small seeded random, so every district always looks the same
  return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ---------------- Input: keyboard + mouse + gamepad ---------------- */
const Input = {
  down: {}, pressed: {}, pad: {}, padPrev: {}, padHit: {},
  mouse: { x: 0, y: 0, clicked: false },
  map: {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], dn: ['ArrowDown', 'KeyS'],
    jump: ['Space', 'ArrowUp', 'KeyW'], punch: ['KeyJ', 'KeyX'], blast: ['KeyK', 'KeyC'], super: ['KeyL', 'KeyV'],
    pause: ['Escape', 'KeyP'], ok: ['Enter']
  },
  held(a) { return this.map[a].some(k => this.down[k]) || !!this.pad[a]; },
  hit(a) { return this.map[a].some(k => this.pressed[k]) || !!this.padHit[a]; },
  poll() {
    const p = {};
    try {
      const gp = navigator.getGamepads ? Array.from(navigator.getGamepads()).find(g => g && g.connected) : null;
      if (gp) {
        const b = i => gp.buttons[i] && gp.buttons[i].pressed, ax = gp.axes;
        p.left = ax[0] < -0.4 || b(14); p.right = ax[0] > 0.4 || b(15);
        p.up = ax[1] < -0.5 || b(12); p.dn = ax[1] > 0.5 || b(13);
        p.jump = b(0); p.punch = b(2); p.blast = b(1); p.super = b(3) || b(5); p.pause = b(9); p.ok = b(0);
      }
    } catch (e) { /* no gamepad */ }
    this.padHit = {};
    for (const k in p) if (p[k] && !this.padPrev[k]) this.padHit[k] = true;
    this.padPrev = p; this.pad = p;
  },
  endFrame() { this.pressed = {}; this.mouse.clicked = false; }
};
addEventListener('keydown', e => {
  Snd.init();
  if (e.target && e.target.tagName === 'INPUT') return;
  if (!e.repeat) Input.pressed[e.code] = true;
  Input.down[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { Input.down[e.code] = false; });
addEventListener('blur', () => { Input.down = {}; });

/* ---------------- Sound: everything is synthesized, zero audio files ---------------- */
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const Snd = {
  ctx: null, out: null, mus: null, nbuf: null, lastCoin: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      this.ctx = new C();
      this.out = this.ctx.createGain(); this.out.gain.value = 0.5; this.out.connect(this.ctx.destination);
      this.mus = this.ctx.createGain(); this.mus.gain.value = 0.13; this.mus.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.nbuf = this.ctx.createBuffer(1, len, len);
      const d = this.nbuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { this.ctx = null; }
  },
  tone(f, dur, type = 'square', vol = 0.2, f2 = 0, delay = 0, dest = null) {
    if (!this.ctx || (!dest && !S.opts.sound)) return;
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.out); o.start(t); o.stop(t + dur + 0.03);
  },
  noise(dur, vol = 0.2, freq = 1200, delay = 0, type = 'lowpass', dest = null) {
    if (!this.ctx || (!dest && !S.opts.sound)) return;
    const t = this.ctx.currentTime + delay, s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.nbuf; s.loop = true; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.out); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
  },
  play(n, arg) {
    const T = this.tone.bind(this), N = this.noise.bind(this);
    switch (n) {
      case 'punch': N(0.06, 0.2, 900); T(170, 0.08, 'triangle', 0.2, 70); break;
      case 'hit': N(0.09, 0.3, 2400); T(230, 0.1, 'square', 0.1, 80); break;
      case 'bighit': N(0.22, 0.4, 1300); T(130, 0.26, 'sawtooth', 0.22, 40); break;
      case 'jump': T(300, 0.14, 'sine', 0.14, 640); break;
      case 'coin': { const now = performance.now(); if (now - this.lastCoin < 45) return; this.lastCoin = now; T(1320, 0.06, 'square', 0.05); T(1760, 0.12, 'square', 0.05, 0, 0.05); break; }
      case 'blast': T(950, 0.22, 'sawtooth', 0.12, 220); N(0.14, 0.1, 3200); break;
      case 'super': T(180, 1.1, 'sawtooth', 0.22, 1400); N(1.1, 0.28, 900); T(90, 1.1, 'sine', 0.3, 60); break;
      case 'explode': N(0.45, 0.42, 650); T(95, 0.4, 'sine', 0.38, 30); break;
      case 'hurt': T(310, 0.2, 'sawtooth', 0.18, 90); N(0.1, 0.15, 800); break;
      case 'heart': T(660, 0.1, 'sine', 0.15); T(990, 0.2, 'sine', 0.15, 0, 0.1); break;
      case 'click': T(720, 0.05, 'square', 0.07); break;
      case 'correct': [660, 880, 1320].forEach((f, i) => T(f, 0.14, 'triangle', 0.16, 0, i * 0.08)); break;
      case 'wrong': T(210, 0.25, 'sawtooth', 0.1, 140); break;
      case 'levelup': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.2, 'square', 0.1, 0, i * 0.09)); break;
      case 'fanfare': [523, 523, 523, 698, 880, 784, 1047].forEach((f, i) => T(f, i === 6 ? 0.6 : 0.16, 'square', 0.11, 0, i * 0.15)); [262, 349, 392, 523].forEach((f, i) => T(f, 0.4, 'triangle', 0.14, 0, i * 0.3)); break;
      case 'warn': T(880, 0.1, 'square', 0.08); T(880, 0.1, 'square', 0.08, 0, 0.16); break;
      case 'charge': T(200, 0.5, 'sawtooth', 0.08, 700); break;
      case 'zap': T(1400, 0.12, 'square', 0.08, 300); N(0.08, 0.1, 4000, 0, 'highpass'); break;
      case 'note': T([392, 494, 587, 698][arg || 0], 0.3, 'sine', 0.22); break;
      case 'build': N(0.1, 0.2, 500); T(220, 0.1, 'square', 0.1, 0, 0.1); T(330, 0.1, 'square', 0.1, 0, 0.2); T(440, 0.25, 'square', 0.1, 0, 0.3); break;
      case 'crystal': [880, 1109, 1319, 1760].forEach((f, i) => T(f, 0.25, 'sine', 0.12, 0, i * 0.06)); break;
    }
  }
};

/* Tiny step-sequencer for background music (generated live, no files) */
const Music = {
  cur: null, timer: null, step: 0, next: 0,
  songs: {
    hub: { bpm: 92, root: 60, prog: [0, 5, 7, 5], arp: [0, 4, 7, 12, 7, 4, 7, 4], bass: [1, 0, 0, 1, 0, 0, 1, 0], wave: 'triangle', hat: 0, kick: 0 },
    dojo: { bpm: 84, root: 62, prog: [0, 0, 5, 7], arp: [0, null, 7, 9, 12, null, 9, 7], bass: [1, 0, 0, 0, 1, 0, 0, 0], wave: 'sine', hat: 0, kick: 0 },
    battle: { bpm: 132, root: 57, prog: [0, 0, 3, 5], arp: [0, 7, 12, 7, 3, 7, 10, 7], bass: [1, 0, 1, 1, 0, 1, 1, 0], wave: 'square', hat: 1, kick: 1 },
    boss: { bpm: 150, root: 52, prog: [0, 1, 0, 6], arp: [0, 12, 3, 12, 7, 12, 3, 10], bass: [1, 1, 0, 1, 1, 0, 1, 1], wave: 'sawtooth', hat: 1, kick: 1 }
  },
  play(name) {
    if (this.cur === name) return;
    this.cur = name; this.step = 0;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 60);
  },
  tick() {
    if (!Snd.ctx || !this.cur || !S.opts.music || Snd.ctx.state !== 'running') return;
    const s = this.songs[this.cur], spb = 60 / s.bpm / 2, now = Snd.ctx.currentTime;
    if (this.next < now) this.next = now + 0.05;
    while (this.next < now + 0.2) {
      const i = this.step % 32, root = s.root + s.prog[Math.floor(i / 8) % 4], d = this.next - now;
      if (s.bass[i % 8]) Snd.tone(mtof(root - 24), spb * 0.95, 'triangle', 0.9, 0, d, Snd.mus);
      const a = s.arp[i % s.arp.length];
      if (a !== null) Snd.tone(mtof(root + a), spb * 0.8, s.wave, s.wave === 'sine' || s.wave === 'triangle' ? 0.5 : 0.22, 0, d, Snd.mus);
      if (s.hat && i % 2 === 1) Snd.noise(0.03, 0.25, 7000, d, 'highpass', Snd.mus);
      if (s.kick && i % 4 === 0) Snd.tone(120, 0.12, 'sine', 1, 40, d, Snd.mus);
      this.next += spb; this.step++;
    }
  }
};

/* Voice: reads tips and questions out loud for young readers (uses Windows' built-in voices) */
function say(text) {
  if (!S.opts.voice || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/[^\x20-\x7E]/g, ' '));
    u.rate = 0.95; u.pitch = 1.2; u.lang = 'en-US'; u.volume = 0.9;
    speechSynthesis.speak(u);
  } catch (e) { /* voice not available */ }
}
function hush() { try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ } }

/* ---------------- Save game (stored on this PC only) ---------------- */
const SAVE_KEY = 'fightercraft.save.v1';
function newSave() {
  return {
    name: 'Hero', suit: 0, level: 1, xp: 0, coins: 0,
    str: 1, spd: 1, foc: 1, strXp: 0, spdXp: 0, focXp: 0, mathTier: 1,
    armor: [false, false, false, false, false],
    stage: 0, stars: {}, bossDone: {},
    build: { workshop: 0, bank: 0, hospital: 0, plant: 0, park: 0 },
    badges: {},
    stats: { robots: 0, math: 0, bestCombo: 0, trainings: 0, noHit: 0, wins: 0, rumble: 0, built: 0 },
    opts: { sound: true, music: true, voice: true },
    started: false, pendingCity: -1
  };
}
let S = newSave();
const Save = {
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const d = JSON.parse(raw), base = newSave();
        S = Object.assign(base, d);
        S.build = Object.assign(newSave().build, d.build || {});
        S.stats = Object.assign(newSave().stats, d.stats || {});
        S.opts = Object.assign(newSave().opts, d.opts || {});
      }
    } catch (e) { S = newSave(); }
  },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked */ } },
  reset() { const o = S.opts; S = newSave(); S.opts = o; this.save(); }
};

/* ---------------- Power math: where the hero's strength really comes from ---------------- */
const Calc = {
  armorCount() { return S.armor.filter(Boolean).length; },
  cityLevel() { return this.armorCount(); },
  buildSum() { let n = 0; for (const k in S.build) n += S.build[k]; return n; },
  powerParts() {
    return [
      { icon: '⭐', name: 'Hero Level', v: S.level * 10, how: 'Beat robots to earn XP' },
      { icon: '💪', name: 'Strength', v: S.str * 6, how: 'Train with Power Punch math' },
      { icon: '⚡', name: 'Speed', v: S.spd * 4, how: 'Train with Lightning Reflex' },
      { icon: '🧠', name: 'Focus', v: S.foc * 4, how: 'Train with Crystal Memory' },
      { icon: '🛡️', name: 'Armor', v: this.armorCount() * 25, how: 'Defeat bosses - armor is FREE' },
      { icon: '🏙️', name: 'City', v: this.buildSum() * 3, how: 'Build the city with coins' }
    ];
  },
  power() { return this.powerParts().reduce((a, p) => a + p.v, 0); },
  maxHp() { return 100 + S.level * 10 + (S.armor[2] ? 60 : 0) + S.build.hospital * 25; },
  punch() { return 8 + S.str * 2 + S.level + (S.armor[1] ? 8 : 0) + S.build.workshop; },
  blast() { return 12 + S.foc * 2 + S.level + S.build.workshop * 4 + (S.armor[4] ? 8 : 0); },
  speed() { return 300 + S.spd * 8 + (S.armor[0] ? 50 : 0); },
  maxEnergy() { return 100 + S.foc * 8 + (S.armor[4] ? 40 : 0); },
  regen() { return 9 + S.build.plant * 4; },
  xpNeed(l = S.level) { return 50 + (l - 1) * 35; },
  statNeed(l) { return 6 + l * 4; },
  recPower(stage) { return Math.round(22 + stage * 21); },
  /* gives XP, returns how many levels were gained */
  addXp(n) {
    n = Math.round(n * (1 + S.build.park * 0.1));
    S.xp += n; let ups = 0;
    while (S.xp >= this.xpNeed()) { S.xp -= this.xpNeed(); S.level++; ups++; }
    return ups;
  },
  addStat(key, n) { // key: 'str' | 'spd' | 'foc'
    S[key + 'Xp'] += n; let ups = 0;
    while (S[key] < 25 && S[key + 'Xp'] >= this.statNeed(S[key])) { S[key + 'Xp'] -= this.statNeed(S[key]); S[key]++; ups++; }
    return ups;
  }
};
