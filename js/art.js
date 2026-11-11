'use strict';
/* ============================================================
   FIGHTER CRAFT - art: everything is drawn by code (no image files),
   which keeps the whole game tiny.
   ============================================================ */
function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; if (fn) fn(c.getContext('2d')); return c; }
function rr(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); }
function circ(g, x, y, r) { g.beginPath(); g.arc(x, y, Math.max(0.1, r), 0, TAU); g.fill(); }
function seg(g, x1, y1, x2, y2) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
const _shade = new Map();
function shade(hex, amt) {
  const key = hex + amt; let v = _shade.get(key); if (v) return v;
  if (hex.length === 4) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, gg = n >> 8 & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; gg *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; gg += (255 - gg) * amt; b += (255 - b) * amt; }
  v = `rgb(${r | 0},${gg | 0},${b | 0})`; _shade.set(key, v); return v;
}
const _glow = {};
function glow(g, x, y, r, col, a = 1) { // soft light, pre-rendered once per colour so it is cheap
  let s = _glow[col];
  if (!s) s = _glow[col] = mk(64, 64, c => { const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); });
  const pa = g.globalAlpha, pc = g.globalCompositeOperation;
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = pa * a; g.drawImage(s, x - r, y - r, r * 2, r * 2);
  g.globalAlpha = pa; g.globalCompositeOperation = pc;
}
function limb(g, x, y, a1, l1, a2, l2, w, col) { // 2-part arm or leg. angle 0 = down, + = forward
  const x1 = x + Math.sin(a1) * l1, y1 = y + Math.cos(a1) * l1, a = a1 + a2, x2 = x1 + Math.sin(a) * l2, y2 = y1 + Math.cos(a) * l2;
  g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  return [x2, y2, a, x1, y1];
}

/* ---------------- The hero ---------------- */
const SUITS = [['#2f7df6', '#1b4fb0'], ['#e5383b', '#9d1c1f'], ['#2fbf71', '#1b7a45'], ['#9b5de5', '#5f2fa8'], ['#ff8c1a', '#b85a00']];
function drawHero(g, o) {
  const A = o.armor || [], su = SUITS[o.suit || 0], c1 = su[0], c2 = su[1], sc = o.scale || 1, t = o.t || 0, p = o.pt || 0;
  const skin = '#f2b98a', skin2 = '#d99a6c', dark = '#20242e';
  let lean = 0, bob = Math.sin(t * 3) * 1.5;
  let fl = [0.16, -0.12], bl = [-0.16, -0.06], fa = [0.5, 1.9], ba = [0.9, 1.6];
  const k = Math.sin(Math.min(1, p * 1.5) * Math.PI);
  switch (o.pose) {
    case 'run': { const ph = t * 13; fl = [Math.sin(ph) * 0.85, -0.25 - 0.8 * Math.max(0, Math.cos(ph))]; bl = [Math.sin(ph + Math.PI) * 0.85, -0.25 - 0.8 * Math.max(0, Math.cos(ph + Math.PI))]; fa = [Math.sin(ph + Math.PI) * 0.9, 1.3]; ba = [Math.sin(ph) * 0.9, 1.3]; lean = 0.17; bob = -Math.abs(Math.sin(ph)) * 4; break; }
    case 'jump': fl = [0.75, -1.3]; bl = [-0.1, -0.7]; fa = [2.4, 0.3]; ba = [-0.6, 0.8]; bob = 0; break;
    case 'fall': fl = [0.3, -0.4]; bl = [-0.45, -0.3]; fa = [2.0, 0.4]; ba = [-1.2, 0.5]; bob = 0; break;
    case 'hover': fl = [0.15, -0.3]; bl = [-0.2, -0.5]; fa = [0.5, 1.8]; ba = [-0.5, 0.6]; lean = 0.14; bob = Math.sin(t * 9) * 2; break;
    case 'punch1': fa = [lerp(0.5, 1.56, k), lerp(1.9, 0, k)]; lean = 0.2 * k; fl = [0.45, -0.2]; bl = [-0.45, -0.1]; break;
    case 'punch2': ba = [lerp(0.9, 1.6, k), lerp(1.6, 0, k)]; fa = [0.2, 2.3]; lean = 0.24 * k; fl = [0.5, -0.2]; bl = [-0.4, -0.1]; break;
    case 'punch3': fa = [lerp(0.1, 2.35, k), lerp(2.2, 0.05, k)]; ba = [-0.6, 1.2]; lean = 0.08 * k; fl = [0.6, -0.3]; bl = [-0.6, -0.1]; bob = -12 * k; break;
    case 'kick': fl = [1.45, -0.05]; bl = [-0.5, -1.0]; fa = [-0.4, 1.0]; ba = [0.8, 1.5]; lean = -0.25; bob = 0; break;
    case 'blast': fa = [1.52, 0.05]; ba = [1.42, 0.1]; lean = 0.1; fl = [0.4, -0.2]; bl = [-0.4, -0.1]; break;
    case 'hurt': fa = [-0.8, 0.6]; ba = [-1.2, 0.4]; lean = -0.35; fl = [0.5, -0.3]; bl = [0.1, -0.5]; break;
    case 'win': { const w = Math.sin(t * 8) * 0.15; fa = [2.75 + w, 0.15]; ba = [2.95 - w, -0.2]; bob = -Math.abs(Math.sin(t * 6)) * 14; break; }
  }
  g.save(); g.translate(o.x, o.y); g.scale((o.face || 1) * sc, sc); if (o.alpha != null) g.globalAlpha = o.alpha;
  g.translate(0, bob);
  const hipY = -52, shx = Math.sin(lean) * 36, shy = hipY - Math.cos(lean) * 36;
  const leg = (a, front) => {
    const r = limb(g, front ? 4 : -4, hipY, a[0], 26, a[1], 26, 13, front ? c1 : c2), x2 = r[0], y2 = r[1], an = r[2];
    const bx = x2 - Math.sin(an) * 13, by = y2 - Math.cos(an) * 13;
    g.strokeStyle = A[0] ? (front ? '#b8f0ff' : '#63b9d6') : (front ? '#3a3f4d' : '#2a2e39'); g.lineWidth = A[0] ? 17 : 14; seg(g, bx, by, x2, y2);
    g.lineWidth = A[0] ? 12 : 10; seg(g, x2, y2, x2 + Math.cos(an) * 12, y2 - Math.sin(an) * 12);
    if (A[0]) { g.strokeStyle = '#39d0ff'; g.lineWidth = 3; seg(g, bx - 4, by, bx + 5, by); glow(g, x2, y2 + 3, 15, '#39d0ff', 0.55); }
  };
  const arm = (a, front) => {
    const r = limb(g, shx + (front ? 2 : -2), shy + 5, a[0], 20, a[1], 19, 11, front ? c1 : c2), x2 = r[0], y2 = r[1], x1 = r[3], y1 = r[4];
    if (A[1]) {
      g.strokeStyle = front ? '#ffd23f' : '#c79a1e'; g.lineWidth = 15; seg(g, lerp(x1, x2, 0.4), lerp(y1, y2, 0.4), x2, y2);
      g.fillStyle = front ? '#ffe680' : '#d9ae35'; circ(g, x2, y2, 9.5); glow(g, x2, y2, 17, '#ffd23f', 0.5);
    } else { g.fillStyle = front ? skin : skin2; circ(g, x2, y2, 7); }
    return r;
  };
  arm(ba, false); leg(bl, false);
  // jet wings (behind the body)
  g.save(); g.translate(0, hipY); g.rotate(lean);
  if (A[3]) {
    if (o.jet) { const fl2 = 22 + Math.sin(t * 50) * 8; g.fillStyle = '#ffb347'; g.beginPath(); g.moveTo(-22, -8); g.lineTo(-17, -8 + fl2); g.lineTo(-12, -8); g.fill(); glow(g, -17, 2, 30, '#ff8c1a', 0.9); }
    g.fillStyle = '#8a94a8'; g.beginPath(); g.moveTo(-10, -34); g.lineTo(-46, -50); g.lineTo(-38, -22); g.lineTo(-12, -14); g.closePath(); g.fill();
    g.fillStyle = '#ff8c1a'; g.beginPath(); g.moveTo(-14, -30); g.lineTo(-40, -44); g.lineTo(-35, -32); g.closePath(); g.fill();
    g.fillStyle = '#596275'; rr(g, -23, -36, 12, 30, 4); g.fill();
  }
  // torso
  const tg = g.createLinearGradient(-13, 0, 13, 0); tg.addColorStop(0, c2); tg.addColorStop(0.6, c1); tg.addColorStop(1, shade(c1, 0.25));
  g.fillStyle = tg; rr(g, -13, -41, 26, 45, 9); g.fill();
  g.fillStyle = dark; g.fillRect(-13, -7, 26, 5); g.fillStyle = '#ffd23f'; g.fillRect(3, -8, 6, 7);
  if (A[2]) {
    const pg = g.createLinearGradient(-14, -42, 14, -10); pg.addColorStop(0, '#f4f8ff'); pg.addColorStop(0.5, '#aebbd0'); pg.addColorStop(1, '#6f7d96');
    g.fillStyle = pg; g.beginPath(); g.moveTo(-15, -42); g.lineTo(16, -42); g.lineTo(15, -22); g.lineTo(4, -11); g.lineTo(-13, -14); g.closePath(); g.fill();
    g.fillStyle = '#dfe7f2'; rr(g, -17, -45, 13, 9, 4); g.fill(); rr(g, 6, -45, 13, 9, 4); g.fill();
    g.fillStyle = '#7df9ff'; circ(g, 3, -28, 4.5); glow(g, 3, -28, 13, '#39d0ff', 0.8);
  } else { g.fillStyle = '#ffe14d'; g.beginPath(); g.moveTo(5, -34); g.lineTo(-1, -24); g.lineTo(4, -24); g.lineTo(1, -15); g.lineTo(9, -27); g.lineTo(4, -27); g.closePath(); g.fill(); }
  g.restore();
  leg(fl, true);
  // head
  const hx = shx + Math.sin(lean) * 14 + 1, hy = shy - 15;
  g.fillStyle = skin2; g.fillRect(hx - 5, hy + 8, 9, 8);
  g.fillStyle = skin; circ(g, hx, hy, 14);
  if (A[4]) {
    const hg = g.createLinearGradient(hx - 16, hy - 16, hx + 14, hy + 12); hg.addColorStop(0, '#e8dcff'); hg.addColorStop(0.5, '#9d7be0'); hg.addColorStop(1, '#5a3aa6');
    g.fillStyle = hg; g.beginPath(); g.arc(hx, hy, 16, Math.PI * 0.72, Math.PI * 2.16); g.lineTo(hx + 9, hy + 12); g.lineTo(hx - 6, hy + 14); g.closePath(); g.fill();
    g.fillStyle = '#ffe14d'; g.beginPath(); g.moveTo(hx - 6, hy - 15); g.lineTo(hx - 18, hy - 30); g.lineTo(hx + 4, hy - 16); g.closePath(); g.fill();
    g.fillStyle = '#7df9ff'; rr(g, hx - 1, hy - 6, 17, 8, 3); g.fill(); glow(g, hx + 8, hy - 2, 16, '#39d0ff', 0.75);
  } else {
    g.fillStyle = '#3b2a20'; g.beginPath(); g.arc(hx - 1, hy - 2, 14.5, Math.PI * 0.85, Math.PI * 1.95); g.lineTo(hx + 6, hy - 9); g.lineTo(hx - 2, hy - 7); g.lineTo(hx - 8, hy + 2); g.closePath(); g.fill();
    g.fillStyle = c1; g.fillRect(hx - 14, hy - 8, 27, 4);
    g.fillStyle = '#1c1c22'; g.beginPath(); g.ellipse(hx + 7, hy - 1, 2.2, 3.2, 0, 0, TAU); g.fill();
    g.strokeStyle = '#3b2a20'; g.lineWidth = 2; seg(g, hx + 3, hy - 6.5, hx + 11, hy - 5);
    g.strokeStyle = '#a8603c'; g.lineWidth = 1.6; g.beginPath(); if (o.pose === 'win') g.arc(hx + 6, hy + 5, 4, 0.1, Math.PI - 0.4); else { g.moveTo(hx + 4, hy + 7); g.lineTo(hx + 10, hy + 6.5); } g.stroke();
  }
  const fr = arm(fa, true);
  if (o.pose === 'blast') glow(g, fr[0] + 8, fr[1], 26, '#7df9ff', 0.9);
  g.restore();
}

/* BOLT, the little helper drone that gives tips */
function drawBolt(g, x, y, t) {
  y += Math.sin(t * 2.4) * 6;
  g.save(); g.translate(x, y);
  glow(g, 0, 22, 20, '#39d0ff', 0.6);
  const bg = g.createLinearGradient(-20, -20, 20, 20); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#9fb4cc');
  g.fillStyle = bg; circ(g, 0, 0, 20);
  g.fillStyle = '#1d2a3a'; rr(g, -14, -9, 28, 16, 8); g.fill();
  const blink = (t % 3.5) < 0.12 ? 1 : 5;
  g.fillStyle = '#7df9ff'; g.fillRect(-9, -1 - blink / 2, 5, blink); g.fillRect(4, -1 - blink / 2, 5, blink);
  g.strokeStyle = '#9fb4cc'; g.lineWidth = 2.5; seg(g, 0, -20, 0, -31); g.fillStyle = '#ffd23f'; circ(g, 0, -33, 4); glow(g, 0, -33, 10, '#ffd23f', 0.6 + Math.sin(t * 6) * 0.3);
  g.fillStyle = '#6d8199'; g.fillRect(-27, -3, 8, 6); g.fillRect(19, -3, 8, 6);
  g.restore();
}

/* ---------------- Small objects ---------------- */
function drawCoin(g, x, y, r, t) {
  const w = Math.abs(Math.cos(t * 6)) * 0.8 + 0.2;
  g.fillStyle = '#b8860b'; g.beginPath(); g.ellipse(x, y, r * w, r, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(x, y, r * w * 0.78, r * 0.78, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff3b0'; g.beginPath(); g.ellipse(x - r * w * 0.25, y - r * 0.3, r * w * 0.2, r * 0.25, 0, 0, TAU); g.fill();
}
function drawHeart(g, x, y, s) {
  g.fillStyle = '#ff4d6d'; g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.4, y - s * 0.2, x - s * 0.6, y - s * 1.2, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.4, y - s * 0.2, x, y + s * 0.9); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.6)'; circ(g, x - s * 0.4, y - s * 0.4, s * 0.2);
}
/* ---------------- Particles ---------------- */
class FX {
  constructor() { this.p = []; this.txt = []; }
  add(o) { if (this.p.length < 420) this.p.push(o); }
  spark(x, y, n, col = '#ffd23f', spd = 320) { for (let i = 0; i < n; i++) { const a = rand(TAU), v = rand(spd * 0.3, spd); this.add({ k: 0, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: rand(0.2, 0.5), max: 0.5, col, g: 500 }); } }
  smoke(x, y, n = 1, col = '120,120,130') { for (let i = 0; i < n; i++) this.add({ k: 1, x: x + rand(-8, 8), y, vx: rand(-20, 20), vy: rand(-70, -30), life: rand(0.6, 1.1), max: 1.1, col, s: rand(8, 16), g: 0 }); }
  debris(x, y, n, col) { for (let i = 0; i < n; i++) this.add({ k: 2, x, y, vx: rand(-320, 320), vy: rand(-560, -180), life: rand(0.9, 1.5), max: 1.5, col, s: rand(5, 13), r: rand(TAU), vr: rand(-12, 12), g: 1500 }); }
  ring(x, y, col, r = 80) { this.add({ k: 3, x, y, vx: 0, vy: 0, life: 0.35, max: 0.35, col, s: r, g: 0 }); }
  text(x, y, str, col = '#fff', size = 26) { this.txt.push({ x, y, str, col, size, life: 0.9 }); }
  update(dt) {
    for (let i = this.p.length - 1; i >= 0; i--) {
      const p = this.p[i]; p.life -= dt; if (p.life <= 0) { this.p[i] = this.p[this.p.length - 1]; this.p.pop(); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 2) { p.r += p.vr * dt; if (p.y > GROUND + 20 && p.vy > 0) { p.y = GROUND + 20; p.vy *= -0.4; p.vx *= 0.6; } }
    }
    for (let i = this.txt.length - 1; i >= 0; i--) { const t = this.txt[i]; t.life -= dt; t.y -= 50 * dt; if (t.life <= 0) this.txt.splice(i, 1); }
  }
  draw(g) {
    for (const p of this.p) {
      const a = clamp(p.life / p.max, 0, 1);
      if (p.k === 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.strokeStyle = p.col; g.lineWidth = 3; g.lineCap = 'round'; seg(g, p.x, p.y, p.x - p.vx * 0.03, p.y - p.vy * 0.03); g.globalCompositeOperation = 'source-over'; }
      else if (p.k === 1) { g.globalAlpha = a * 0.45; g.fillStyle = `rgb(${p.col})`; circ(g, p.x, p.y, p.s * (1.6 - a * 0.8)); }
      else if (p.k === 2) { g.globalAlpha = Math.min(1, a * 3); g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.col; g.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.7); g.restore(); }
      else { g.globalAlpha = a; g.strokeStyle = p.col; g.lineWidth = 6 * a + 1; g.beginPath(); g.arc(p.x, p.y, p.s * (1 - a) + 8, 0, TAU); g.stroke(); }
    }
    g.globalAlpha = 1;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const t of this.txt) {
      g.globalAlpha = clamp(t.life * 2.5, 0, 1); g.font = `bold ${t.size}px Bahnschrift, "Segoe UI", Arial`;
      g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.strokeText(t.str, t.x, t.y); g.fillStyle = t.col; g.fillText(t.str, t.x, t.y);
    }
    g.globalAlpha = 1;
  }
}

/* ---------------- City skylines ---------------- */
function drawSkyline(g, o) {
  const r = rng(o.seed); let x = 0;
  while (x < o.w) {
    let bw = o.minW + r() * (o.maxW - o.minW); if (x + bw > o.w - 40) bw = o.w - x;
    const bh = o.minH + r() * (o.maxH - o.minH), top = o.base - bh, ruined = r() < (o.ruin || 0);
    const gr = g.createLinearGradient(0, top, 0, o.base); gr.addColorStop(0, shade(o.color, 0.14)); gr.addColorStop(1, shade(o.color, -0.28));
    g.fillStyle = gr;
    if (ruined) { g.beginPath(); g.moveTo(x, o.base); g.lineTo(x, top + r() * 30); const n = 4 + Math.floor(r() * 4); for (let i = 1; i <= n; i++) g.lineTo(x + bw * i / n, top + r() * 48); g.lineTo(x + bw, o.base); g.closePath(); g.fill(); }
    else {
      g.fillRect(x, top, bw, bh); const roof = r();
      if (roof < 0.25) g.fillRect(x + bw * 0.45, top - 26 - r() * 34, 3, 62);
      else if (roof < 0.45) g.fillRect(x + bw * 0.18, top - 13, bw * 0.34, 13);
      else if (roof < 0.6 && o.gold) { g.fillStyle = '#ffd86b'; g.beginPath(); g.moveTo(x + bw * 0.2, top); g.lineTo(x + bw * 0.5, top - 60); g.lineTo(x + bw * 0.8, top); g.fill(); }
      if (o.green && r() < 0.6) { g.fillStyle = '#4fbf6b'; for (let i = 0; i < 4; i++) circ(g, x + bw * (0.15 + i * 0.23), top - 2, 9 + r() * 6); }
    }
    g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x + bw * 0.8, top + (ruined ? 48 : 0), bw * 0.2, bh);
    const ww = o.ww || 7, wh = o.wh || 10;
    for (let wy = top + 52; wy < o.base - 14; wy += wh + 9) for (let wx = x + 8; wx < x + bw - ww - 5; wx += ww + 7) {
      const q = r();
      if (q < o.lit) { g.fillStyle = o.win[Math.floor(r() * o.win.length)]; g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(wx, wy, ww, wh); }
      else if (q < o.lit + 0.35) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.globalAlpha = 1; g.fillRect(wx, wy, ww, wh); }
    }
    g.globalAlpha = 1;
    x += bw + (o.gap || 0) * r();
  }
}
function drawClouds(g, w, seed, col, y0, y1, n) {
  const r = rng(seed); g.fillStyle = col;
  for (let i = 0; i < n; i++) { const cx = r() * w, cy = y0 + r() * (y1 - y0), s = 26 + r() * 30; for (let j = 0; j < 5; j++) { g.globalAlpha = 0.5 + r() * 0.3; g.beginPath(); g.ellipse(cx + (j - 2) * s * 0.7, cy + r() * 8, s * (0.7 + r() * 0.5), s * 0.42, 0, 0, TAU); g.fill(); } }
  g.globalAlpha = 1;
}

/* ---------------- The home city: it changes with every armor piece ---------------- */
const CITY_LOOK = [
  { sky: ['#121019', '#27212f', '#4a3b42'], far: '#2c2833', mid: '#1b1920', win: ['#ffb347'], lit: 0.02, ruin: 0.6, ground: ['#2b262d', '#17141a'] },
  { sky: ['#17152c', '#40315c', '#c06a4f'], far: '#3e3350', mid: '#2a2238', win: ['#ffcf7a'], lit: 0.2, ruin: 0.3, ground: ['#3a3340', '#1e1a24'] },
  { sky: ['#0b0e30', '#2c1f6b', '#c2478a'], far: '#2d2668', mid: '#19153d', win: ['#ff3df2', '#3df2ff', '#ffe14d'], lit: 0.5, ruin: 0.08, ground: ['#34305a', '#18152e'] },
  { sky: ['#2a6fc9', '#7dc0f5', '#d8f0ff'], far: '#93b3d6', mid: '#4f76a6', win: ['#e3f4ff', '#bfe3ff'], lit: 0.32, ruin: 0, ground: ['#8793a6', '#586273'] },
  { sky: ['#2382d8', '#86d3ff', '#e9fbe4'], far: '#93c2d6', mid: '#4a82a0', win: ['#e3f4ff', '#c9f5d6'], lit: 0.36, ruin: 0, ground: ['#7fae7a', '#4f7a52'] },
  { sky: ['#2a7de0', '#9ad8ff', '#fff3c4'], far: '#a9c4e0', mid: '#5a86b8', win: ['#fff1b8', '#e3f4ff'], lit: 0.5, ruin: 0, ground: ['#d8c79a', '#9a8a5c'] }
];
const LAND_X = { workshop: 140, bank: 350, park: 640, hospital: 935, plant: 1140 };
function drawLandmark(g, id, lv, x, base) {
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (!lv) { g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 3; g.setLineDash([10, 8]); g.strokeRect(x - 60, base - 80, 120, 80); g.setLineDash([]); g.fillStyle = 'rgba(255,255,255,0.25)'; g.font = 'bold 44px Arial'; g.fillText('?', x, base - 40); return; }
  const h = 70 + lv * 26;
  if (id === 'workshop') {
    const gr = g.createLinearGradient(x - 70, 0, x + 70, 0); gr.addColorStop(0, '#b5533c'); gr.addColorStop(1, '#7a3324'); g.fillStyle = gr; g.fillRect(x - 70, base - h, 140, h);
    g.fillStyle = '#3d4654'; g.fillRect(x - 76, base - h - 10, 152, 12); g.fillStyle = '#2a303b'; rr(g, x - 50, base - 50, 46, 50, 4); g.fill(); g.fillStyle = '#ffd23f'; for (let i = 0; i < 4; i++) g.fillRect(x - 48, base - 46 + i * 11, 42, 3);
    g.fillStyle = '#566'; g.fillRect(x + 36, base - h - 44, 16, 36); for (let i = 1; i < lv; i++) { g.fillStyle = '#ffe9a8'; g.fillRect(x + 8, base - 50 - i * 30, 40, 16); }
    g.font = '40px "Segoe UI Emoji"'; g.fillText('🔧', x + 28, base - 28);
  } else if (id === 'bank') {
    g.fillStyle = '#e9e2d0'; g.fillRect(x - 74, base - h, 148, h); g.fillStyle = '#cfc6ae'; g.beginPath(); g.moveTo(x - 84, base - h); g.lineTo(x, base - h - 44); g.lineTo(x + 84, base - h); g.fill();
    g.fillStyle = '#fbf7ea'; const n = 3 + lv; for (let i = 0; i < n; i++) g.fillRect(x - 64 + i * (128 / (n - 1)) - 6, base - h + 12, 12, h - 12);
    g.fillStyle = '#b8a977'; g.fillRect(x - 84, base - 8, 168, 8); g.fillStyle = '#ffd23f'; circ(g, x, base - h - 16, 13); glow(g, x, base - h - 16, 30 + lv * 8, '#ffd23f', 0.5);
    g.fillStyle = '#8a6508'; g.font = 'bold 18px Arial'; g.fillText('$', x, base - h - 15);
  } else if (id === 'hospital') {
    const gr = g.createLinearGradient(x - 60, 0, x + 60, 0); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#cfd9e6'); g.fillStyle = gr; g.fillRect(x - 62, base - h - 20, 124, h + 20);
    g.fillStyle = '#9fd3ff'; for (let fy = 0; fy < lv + 1; fy++) for (let i = 0; i < 4; i++) g.fillRect(x - 50 + i * 27, base - h + fy * 30, 18, 16);
    g.fillStyle = '#e63946'; g.fillRect(x - 7, base - h - 60, 14, 38); g.fillRect(x - 19, base - h - 48, 38, 14); glow(g, x, base - h - 41, 40, '#ff4d6d', 0.4);
    g.fillStyle = '#5a6b80'; g.fillRect(x - 16, base - 30, 32, 30);
  } else if (id === 'plant') {
    for (let i = 0; i < lv; i++) { const cx = x - 46 + i * 46, th = 110 + i * 12; const gr = g.createLinearGradient(cx - 26, 0, cx + 26, 0); gr.addColorStop(0, '#d9dde3'); gr.addColorStop(1, '#8b95a3'); g.fillStyle = gr; g.beginPath(); g.moveTo(cx - 28, base); g.quadraticCurveTo(cx - 10, base - th * 0.6, cx - 19, base - th); g.lineTo(cx + 19, base - th); g.quadraticCurveTo(cx + 10, base - th * 0.6, cx + 28, base); g.fill(); glow(g, cx, base - th, 34, '#39d0ff', 0.75); g.fillStyle = '#39d0ff'; g.fillRect(cx - 19, base - th, 38, 4); }
    g.font = '30px "Segoe UI Emoji"'; g.fillText('⚡', x - 46, base - 30);
  } else if (id === 'park') {
    for (let i = 0; i < 1 + lv * 2; i++) { const tx = x - 190 + i * (380 / (lv * 2)) + (i % 2) * 8; if (Math.abs(tx - x) < 70) continue; g.fillStyle = '#6b4a2b'; g.fillRect(tx - 5, base - 46, 10, 46); g.fillStyle = '#3fa85a'; circ(g, tx, base - 62, 30); g.fillStyle = '#58c773'; circ(g, tx - 9, base - 72, 18); }
    if (lv >= 2) { g.fillStyle = '#b8c4d4'; rr(g, x - 150, base - 20, 60, 20, 6); g.fill(); g.fillStyle = '#7dd3ff'; g.fillRect(x - 123, base - 52, 6, 34); glow(g, x - 120, base - 50, 26, '#7dd3ff', 0.6); }
    if (lv >= 3) { g.fillStyle = '#ffd86b'; g.fillRect(x + 108, base - 22, 44, 22); g.fillRect(x + 126, base - 70, 8, 50); circ(g, x + 130, base - 78, 10); glow(g, x + 130, base - 60, 46, '#ffd23f', 0.45); }
  }
}
function renderCity(L, build) {
  const K = CITY_LOOK[L];
  return mk(W, H, g => {
    const gr = g.createLinearGradient(0, 0, 0, 580); gr.addColorStop(0, K.sky[0]); gr.addColorStop(0.55, K.sky[1]); gr.addColorStop(1, K.sky[2]);
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const r = rng(77);
    if (L <= 2) { g.fillStyle = '#fff'; for (let i = 0; i < 110; i++) { g.globalAlpha = r() * (L === 0 ? 0.25 : 0.8); g.fillRect(r() * W, r() * 340, 2, 2); } g.globalAlpha = 1; }
    const sun = [null, { x: 1040, y: 470, r: 62, c: '#ffb37a' }, { x: 240, y: 130, r: 34, c: '#f3ecff' }, { x: 1050, y: 130, r: 52, c: '#fffbe0' }, { x: 1050, y: 120, r: 56, c: '#fffbe0' }, { x: 1050, y: 120, r: 62, c: '#fff6c9' }][L];
    if (sun) { glow(g, sun.x, sun.y, sun.r * 3.4, sun.c, 0.6); g.fillStyle = sun.c; circ(g, sun.x, sun.y, sun.r); }
    if (L === 0) drawClouds(g, W, 5, '#221c2a', 40, 300, 12);
    if (L >= 3) drawClouds(g, W, 8, '#ffffff', 50, 300, 8);
    if (L === 5) { g.lineWidth = 9; ['#ff5a5a', '#ffb347', '#ffe14d', '#5fd68a', '#4da6ff', '#b388ff'].forEach((c, i) => { g.strokeStyle = c; g.globalAlpha = 0.3; g.beginPath(); g.arc(640, 640, 560 - i * 9, Math.PI, TAU); g.stroke(); }); g.globalAlpha = 1; }
    drawSkyline(g, { w: W, base: 530, minH: 120 + L * 14, maxH: 250 + L * 34, minW: 60, maxW: 130, color: K.far, win: K.win, lit: K.lit * 0.7, seed: 11, ruin: K.ruin, ww: 5, wh: 7, gold: L >= 5 });
    g.fillStyle = K.sky[2]; g.globalAlpha = 0.25; g.fillRect(0, 280, W, 300); g.globalAlpha = 1;
    if (L >= 3) { g.fillStyle = '#dfe9f5'; g.fillRect(0, 352, W, 7); g.fillStyle = '#9fb4cc'; for (let x = 60; x < W; x += 180) g.fillRect(x, 359, 9, 190); }
    drawSkyline(g, { w: W, base: 572, minH: 110, maxH: 220 + L * 22, minW: 100, maxW: 200, color: K.mid, win: K.win, lit: K.lit, seed: 23, ruin: K.ruin * 0.8, gap: 36, ww: 9, wh: 13, green: L >= 4, gold: L >= 5 });
    if (L === 2 || L === 5) { g.font = 'bold 26px Bahnschrift, Arial'; g.textAlign = 'center'; ['NOVA', 'HERO', 'CITY'].forEach((s, i) => { const x = 250 + i * 390, y = 430 + (i % 2) * 50, c = ['#ff3df2', '#3df2ff', '#ffe14d'][i]; g.strokeStyle = c; g.lineWidth = 3; g.strokeRect(x - 44, y - 22, 88, 32); g.fillStyle = c; g.fillText(s, x, y + 2); glow(g, x, y - 6, 80, c, 0.4); }); }
    const gg = g.createLinearGradient(0, 566, 0, H); gg.addColorStop(0, K.ground[0]); gg.addColorStop(1, K.ground[1]); g.fillStyle = gg; g.fillRect(0, 566, W, H - 566);
    g.fillStyle = shade(K.ground[0], 0.3); g.fillRect(0, 566, W, 6);
    if (L < 2) { g.fillStyle = 'rgba(0,0,0,0.4)'; for (let i = 0; i < 26; i++) { const x = r() * W, y = 590 + r() * 110; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 14 + r() * 22, y - 8 - r() * 14); g.lineTo(x + 40 + r() * 20, y); g.fill(); } }
    else { g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) seg(g, 640 + (i - 4) * 90, 572, 640 + (i - 4) * 260, H); for (let y = 600; y < H; y += 34) seg(g, 0, y, W, y); }
    for (const id in LAND_X) drawLandmark(g, id, build[id], LAND_X[id], 572);
    // hero plaza
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(640, 618, 190, 26, 0, 0, TAU); g.fill();
    g.fillStyle = L >= 5 ? '#ffd86b' : L >= 3 ? '#dfe9f5' : '#5a5560'; g.beginPath(); g.ellipse(640, 610, 170, 22, 0, 0, TAU); g.fill();
    g.fillStyle = L >= 5 ? '#fff1b8' : L >= 3 ? '#f4f8ff' : '#6d6874'; g.beginPath(); g.ellipse(640, 606, 150, 17, 0, 0, TAU); g.fill();
  });
}
function drawCityLive(g, t, L) {
  if (L <= 1) { // robot searchlights and drifting smog
    for (let i = 0; i < 2; i++) { const x = 330 + i * 620, a = Math.sin(t * 0.5 + i * 2) * 0.6 - Math.PI / 2; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.16; g.fillStyle = '#ff4433'; g.beginPath(); g.moveTo(x, 420); g.lineTo(x + Math.cos(a - 0.09) * 600, 420 + Math.sin(a - 0.09) * 600); g.lineTo(x + Math.cos(a + 0.09) * 600, 420 + Math.sin(a + 0.09) * 600); g.fill(); g.restore(); glow(g, x, 420, 16, '#ff4433', 0.9); }
    g.fillStyle = 'rgba(30,25,35,0.16)'; for (let i = 0; i < 5; i++) { const x = ((i * 310 + t * 14) % (W + 400)) - 200; g.beginPath(); g.ellipse(x, 300 + i * 46, 240, 34, 0, 0, TAU); g.fill(); }
  }
  if (L >= 1) for (let i = 0; i < 6; i++) if (Math.sin(t * 2 + i * 1.7) > 0.3) glow(g, 90 + i * 215, 250 + (i * 53) % 110, 9, '#ff4433', 0.9);
  if (L >= 2) for (let i = 0; i < 3; i++) glow(g, 250 + i * 390, 425 + (i % 2) * 50, 90, ['#ff3df2', '#3df2ff', '#ffe14d'][i], 0.12 + Math.sin(t * 3 + i) * 0.08);
  if (L >= 3) {
    const tx = ((t * 150) % (W + 500)) - 250; g.fillStyle = '#f4f8ff'; rr(g, tx, 334, 190, 19, 9); g.fill(); g.fillStyle = '#39a0ff'; for (let i = 0; i < 7; i++) g.fillRect(tx + 12 + i * 25, 339, 17, 7); glow(g, tx + 190, 343, 16, '#ffffff', 0.9);
    for (let i = 0; i < 5; i++) { const dir = i % 2 ? 1 : -1, x = ((t * (70 + i * 22) * dir + i * 300) % (W + 100) + W + 100) % (W + 100) - 50, y = 150 + i * 44; g.fillStyle = ['#ff5a5a', '#ffe14d', '#5fd68a', '#b388ff', '#ffffff'][i]; rr(g, x - 11, y - 4, 22, 8, 4); g.fill(); glow(g, x - dir * 12, y, 10, '#39d0ff', 0.9); }
  }
  if (L >= 4) { const bx = ((t * 16) % (W + 200)) - 100, by = 120 + Math.sin(t * 0.6) * 14; g.fillStyle = '#ff7b54'; circ(g, bx, by, 30); g.fillStyle = '#ffd23f'; g.beginPath(); g.ellipse(bx, by, 11, 30, 0, 0, TAU); g.fill(); g.strokeStyle = '#6b4a2b'; g.lineWidth = 1.5; seg(g, bx - 16, by + 26, bx - 6, by + 46); seg(g, bx + 16, by + 26, bx + 6, by + 46); g.fillStyle = '#6b4a2b'; g.fillRect(bx - 7, by + 46, 14, 10); }
  if (L >= 5) for (let i = 0; i < 4; i++) { const per = 2.4 + i * 0.5, p = ((t + i * 1.3) % per) / per, x = 180 + i * 300, y = 150 + (i % 2) * 70, c = ['#ff5a5a', '#ffe14d', '#3df2ff', '#b388ff'][i]; if (p < 0.75) for (let j = 0; j < 14; j++) { const a = j * TAU / 14, rad = p * 120; glow(g, x + Math.cos(a) * rad, y + Math.sin(a) * rad + p * p * 40, 9, c, 1 - p / 0.75); } }
}

/* ---------------- Dojo room ---------------- */
let _dojo = null;
function renderDojo() {
  return _dojo || (_dojo = mk(W, H, g => {
    const wg = g.createLinearGradient(0, 0, 0, 540); wg.addColorStop(0, '#2a1d3d'); wg.addColorStop(1, '#5b3a55'); g.fillStyle = wg; g.fillRect(0, 0, W, 540);
    g.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = 0; x < W; x += 160) g.fillRect(x, 0, 8, 540);
    g.save(); g.beginPath(); g.arc(640, 250, 170, 0, TAU); g.clip(); const sg = g.createLinearGradient(0, 80, 0, 420); sg.addColorStop(0, '#2a6fc9'); sg.addColorStop(1, '#ffd9a0'); g.fillStyle = sg; g.fillRect(470, 80, 340, 340);
    drawSkyline(g, { w: 900, base: 430, minH: 60, maxH: 190, minW: 40, maxW: 80, color: '#3b3566', win: ['#ffe14d'], lit: 0.4, seed: 5, ww: 4, wh: 6 }); g.restore();
    g.strokeStyle = '#c9a15a'; g.lineWidth = 14; g.beginPath(); g.arc(640, 250, 170, 0, TAU); g.stroke(); g.lineWidth = 5; seg(g, 470, 250, 810, 250); seg(g, 640, 80, 640, 420);
    for (const x of [150, 1130]) { g.fillStyle = '#c0392b'; g.fillRect(x - 44, 60, 88, 300); g.fillStyle = '#ffd23f'; g.fillRect(x - 44, 60, 88, 10); g.fillRect(x - 44, 350, 88, 10); g.font = '54px "Segoe UI Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(x < 600 ? '💪' : '🧠', x, 150); g.fillText('⚡', x, 270); }
    const fg = g.createLinearGradient(0, 540, 0, H); fg.addColorStop(0, '#b98a4e'); fg.addColorStop(1, '#6e4b22'); g.fillStyle = fg; g.fillRect(0, 540, W, 180);
    g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 2; for (let y = 560; y < H; y += 32) seg(g, 0, y, W, y); for (let i = 0; i < 12; i++) seg(g, i * 120 + 40, 540, i * 150 - 100, H);
    g.fillStyle = '#3d2a14'; g.fillRect(0, 532, W, 12);
  }));
}
