'use strict';
/* ============================================================
   FIGHTER CRAFT - the Dojo: three training games.
   Power is EARNED here: practice -> stat XP -> stronger hero.
     str = Power Punch      (math)            -> stronger punches
     spd = Lightning Reflex (reaction + keys) -> faster hero
     foc = Crystal Memory   (memory)          -> more energy, stronger blasts
   ============================================================ */
const DOJO_INFO = {
  str: { name: 'Power Punch', stat: 'Strength', icon: '💪', gives: 'Stronger punches', intro: 'Power Punch! Punch the bag with the right answer.' },
  spd: { name: 'Lightning Reflex', stat: 'Speed', icon: '⚡', gives: 'Run faster', intro: 'Lightning Reflex! Press the same arrow as the robot, as fast as you can.' },
  foc: { name: 'Crystal Memory', stat: 'Focus', icon: '🧠', gives: 'More energy and stronger blasts', intro: 'Crystal Memory! Watch the crystals light up, then repeat the pattern.' }
};
const PAD_COL = ['#39a0ff', '#ffe14d', '#ff5a5a', '#5fd68a'], PAD_ARROW = ['←', '↑', '→', '↓'];

class Dojo {
  constructor(kind) {
    this.kind = kind; this.info = DOJO_INFO[kind]; this.t = 0; this.pt = 0; this.fx = new FX();
    this.phase = 'intro'; this.score = 0; this.round = 0; this.rounds = kind === 'str' ? 8 : kind === 'spd' ? 14 : 8;
    this.hero = { x: 170, y: 612, face: 1, pose: 'idle', pt: 0 };
    // str
    this.bagX = [340, 640, 940]; this.swing = [0, 0, 0]; this.firstOk = 0; this.correct = 0; this.q = null;
    // spd
    this.pads = kind === 'spd' ? [[330, 410], [640, 170], [950, 410], [640, 640]] : [[420, 400], [640, 215], [860, 400], [640, 585]];
    this.dir = -1; this.rtSum = 0; this.hits = 0; this.punchT = 0;
    // foc
    this.seq = [randi(0, 3), randi(0, 3)]; this.pos = 0; this.lives = 2; this.lit = -1; this.litT = 0; this.lastIdx = -1;
  }
  enter() { Music.play('dojo'); this.quitUi(); say(this.info.intro); }
  exit() { hush(); }
  quitUi() { UI.set('<button class="mini quit" data-act="hub">✕ Quit</button>', () => { Game.go(new Hub()); return true; }); }
  padInput() { // which pad was chosen this frame? arrows, WASD, mouse or touch
    if (Input.hit('left')) return 0; if (Input.hit('up')) return 1; if (Input.hit('right')) return 2; if (Input.hit('dn')) return 3;
    if (Input.mouse.clicked) for (let i = 0; i < 4; i++) if (Math.hypot(Input.mouse.x - this.pads[i][0], Input.mouse.y - this.pads[i][1]) < 105) return i;
    return -1;
  }
  update(dt) {
    this.t += dt; this.pt += dt; this.fx.update(dt);
    if (this.phase === 'done') return;
    if (Input.hit('pause')) { Game.go(new Hub()); return; }
    if (this.phase === 'intro') { if (this.pt > 2.4 || (this.pt > 0.6 && (Input.hit('ok') || Input.mouse.clicked))) this.begin(); return; }
    this['up_' + this.kind](dt);
  }
  begin() { if (this.kind === 'str') this.ask(); else if (this.kind === 'spd') { this.phase = 'wait'; this.pt = 0; } else { this.phase = 'show'; this.pt = 0; this.lastIdx = -1; } }

  /* ----- Power Punch ----- */
  ask() {
    this.q = makeQuestion(S.mathTier); this.phase = 'ask'; this.first = true; this.pt = 0; say(this.q.speak);
    const q = this.q;
    UI.set(`<button class="mini quit" data-act="hub">✕ Quit</button>
      <div class="q-top"><div class="q-text">${q.text}</div><button class="mini" data-act="speak">🔊</button></div>
      ${q.answers.map((a, i) => `<button class="bag-btn" style="left:${this.bagX[i] - 75}px" data-act="ans" data-arg="${i}" data-key="${i + 1}">${a}</button>`).join('')}`,
      (a, arg, btn) => { if (a === 'ans') this.answer(+arg, btn); else if (a === 'speak') say(q.speak); else Game.go(new Hub()); return true; });
  }
  answer(i, btn) {
    if (this.phase !== 'ask') return;
    if (i === this.q.correct) {
      this.gain = this.first ? 2 : 1; this.score += this.gain; this.correct++; if (this.first) this.firstOk++;
      Snd.play('correct'); this.phase = 'hit'; this.pt = 0; this.punched = false;
      document.querySelectorAll('#ui .bag-btn').forEach(b => { if (b !== btn) b.style.visibility = 'hidden'; }); btn.classList.add('right');
    } else { this.first = false; Snd.play('wrong'); btn.disabled = true; btn.classList.add('wrong'); this.swing[i] = 0.35; say('Not quite. Try again!'); }
  }
  up_str(dt) {
    const H = this.hero; for (let i = 0; i < 3; i++) this.swing[i] *= Math.pow(0.08, dt);
    if (this.phase === 'hit') {
      const c = this.q.correct, tx = this.bagX[c] - 100; H.x = lerp(H.x, tx, Math.min(1, dt * 12)); H.face = 1;
      if (this.pt > 0.3 && !this.punched) { this.punched = true; this.swing[c] = 1; Snd.play('bighit'); this.fx.spark(this.bagX[c] - 30, 500, 18, '#ffd23f', 420); this.fx.text(this.bagX[c], 300, '+' + this.gain + ' 💪', '#ffe14d', 40); }
      H.pose = this.pt < 0.22 ? 'run' : this.pt < 0.62 ? 'punch3' : 'idle'; H.pt = (this.pt - 0.22) / 0.4;
      if (this.pt > 1.25) { this.round++; if (this.round >= this.rounds) this.finish(); else this.ask(); }
    } else H.pose = 'idle';
  }
  draw_str(g) {
    for (let i = 0; i < 3; i++) {
      const x = this.bagX[i], a = Math.sin(this.t * 13) * this.swing[i] * 0.3 + this.swing[i] * 0.12;
      g.save(); g.translate(x, 110); g.rotate(-a);
      g.strokeStyle = '#2a1d14'; g.lineWidth = 6; seg(g, 0, -110, 0, 220);
      const bg = g.createLinearGradient(-60, 0, 60, 0); bg.addColorStop(0, '#8a2b22'); bg.addColorStop(0.5, '#d9483b'); bg.addColorStop(1, '#8a2b22');
      g.fillStyle = bg; rr(g, -62, 215, 124, 215, 34); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(-62, 250, 124, 8); g.fillRect(-62, 392, 124, 8);
      g.restore();
    }
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(this.hero.x, 618, 40, 9, 0, 0, TAU); g.fill();
    drawHero(g, { x: this.hero.x, y: 612, face: 1, t: this.t, pose: this.hero.pose, pt: this.hero.pt, armor: S.armor, suit: S.suit, scale: 1.15 });
  }

  /* ----- Lightning Reflex ----- */
  up_spd(dt) {
    if (this.punchT > 0) this.punchT -= dt;
    if (this.phase === 'wait') { if (this.pt > 0.45) { let d; do d = randi(0, 3); while (d === this.dir); this.dir = d; this.phase = 'target'; this.pt = 0; this.limit = Math.max(1.5, 2.6 - this.round * 0.06); } return; }
    const k = this.padInput(), p = this.pads[this.dir];
    if (k === this.dir) {
      this.hits++; this.score++; this.rtSum += this.pt; Snd.play('hit'); this.fx.spark(p[0], p[1], 20, PAD_COL[this.dir], 460); this.fx.debris(p[0], p[1], 8, '#8d99ae');
      this.fx.text(p[0], p[1] - 90, this.pt < 0.7 ? 'FAST!' : 'HIT!', '#ffe14d', 34); this.punchDir = this.dir; this.punchT = 0.25; this.next();
    } else if (k >= 0 || this.pt > this.limit) { Snd.play('wrong'); this.fx.text(p[0], p[1] - 90, k >= 0 ? 'Wrong arrow!' : 'Too slow!', '#ff8f7a', 28); this.next(); }
  }
  next() { this.round++; this.phase = 'wait'; this.pt = 0; if (this.round >= this.rounds) { if (this.hits && this.rtSum / this.hits < 0.9) this.score += 2; this.finish(); } }
  draw_spd(g) {
    for (let i = 0; i < 4; i++) {
      const [x, y] = this.pads[i], on = this.phase === 'target' && this.dir === i;
      g.fillStyle = 'rgba(10,14,26,0.55)'; circ(g, x, y, 74); g.strokeStyle = PAD_COL[i]; g.globalAlpha = on ? 1 : 0.35; g.lineWidth = 6; g.beginPath(); g.arc(x, y, 74, 0, TAU); g.stroke(); g.globalAlpha = 1;
      if (on) {
        const f = clamp(1 - this.pt / this.limit, 0, 1); glow(g, x, y, 130, PAD_COL[i], 0.5);
        g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.beginPath(); g.arc(x, y, 84, -Math.PI / 2, -Math.PI / 2 + TAU * f); g.stroke();
        g.fillStyle = '#8d99ae'; rr(g, x - 44, y - 40, 88, 76, 16); g.fill(); g.fillStyle = '#12151c'; rr(g, x - 34, y - 26, 68, 26, 8); g.fill();
        g.fillStyle = '#ff5a36'; circ(g, x - 16, y - 13, 7); circ(g, x + 16, y - 13, 7); glow(g, x, y - 13, 40, '#ff5a36', 0.5);
      }
      g.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,0.4)'; g.font = `bold ${on ? 44 : 54}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(PAD_ARROW[i], x, on ? y + 22 : y + 2);
    }
    const pd = this.punchT > 0 ? this.punchDir : -1;
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(640, 526, 36, 8, 0, 0, TAU); g.fill();
    drawHero(g, { x: 640, y: 520, face: pd === 0 ? -1 : 1, t: this.t, pose: pd < 0 ? 'idle' : pd === 1 ? 'punch3' : pd === 3 ? 'kick' : 'punch1', pt: 1 - this.punchT / 0.25, armor: S.armor, suit: S.suit });
  }

  /* ----- Crystal Memory ----- */
  up_foc(dt) {
    if (this.litT > 0) { this.litT -= dt; if (this.litT <= 0) this.lit = -1; }
    if (this.phase === 'show') {
      const idx = Math.floor((this.pt - 0.5) / 0.75);
      if (idx >= 0 && idx !== this.lastIdx) { this.lastIdx = idx; if (idx < this.seq.length) { this.lit = this.seq[idx]; this.litT = 0.5; Snd.play('note', this.lit); } else { this.phase = 'input'; this.pos = 0; this.lit = -1; } }
    } else if (this.phase === 'input') {
      const k = this.padInput();
      if (k >= 0) {
        this.lit = k; this.litT = 0.25; Snd.play('note', k);
        if (k === this.seq[this.pos]) { this.pos++; if (this.pos >= this.seq.length) { this.phase = 'good'; this.pt = 0; this.score += 2; this.round++; Snd.play('correct'); this.fx.text(640, 400, 'PERFECT!', '#ffe14d', 46); } }
        else { this.lives--; Snd.play('wrong'); this.fx.text(640, 400, this.lives > 0 ? 'Oops! Watch again...' : 'Good effort!', '#ff8f7a', 36); this.phase = 'bad'; this.pt = 0; }
      }
    } else if (this.phase === 'good') { if (this.pt > 1) { if (this.round >= this.rounds) this.finish(); else { this.seq.push(randi(0, 3)); this.phase = 'show'; this.pt = 0; this.lastIdx = -1; } } }
    else if (this.phase === 'bad') { if (this.pt > 1.3) { if (this.lives <= 0) this.finish(); else { this.phase = 'show'; this.pt = 0; this.lastIdx = -1; } } }
  }
  draw_foc(g) {
    for (let i = 0; i < 4; i++) {
      const [x, y] = this.pads[i], on = this.lit === i, s = on ? 1.15 : 1;
      if (on) glow(g, x, y, 170, PAD_COL[i], 0.9);
      g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = on ? 1 : 0.55;
      g.fillStyle = PAD_COL[i]; g.beginPath(); g.moveTo(0, -84); g.lineTo(58, 0); g.lineTo(0, 84); g.lineTo(-58, 0); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(0, -84); g.lineTo(58, 0); g.lineTo(0, -8); g.closePath(); g.fill();
      g.globalAlpha = 1; g.fillStyle = on ? '#fff' : 'rgba(10,14,26,0.7)'; g.font = `bold 44px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(PAD_ARROW[i], 0, 8);
      g.restore();
    }
    drawBolt(g, 640, 400, this.t);
    g.fillStyle = '#fff'; g.font = `bold 26px ${FONT}`; g.textAlign = 'center';
    g.fillText(this.phase === 'show' ? '👀 WATCH...' : this.phase === 'input' ? '👉 YOUR TURN!  ' + this.pos + ' / ' + this.seq.length : '', 640, 698);
    for (let i = 0; i < 2; i++) drawHeart(g, 1180 + i * 40, 110, i < this.lives ? 14 : 6);
  }

  /* ----- shared ----- */
  finish() {
    this.phase = 'done'; const key = this.kind, before = S[key], pBefore = Calc.power(), gained = this.score;
    const ups = Calc.addStat(key, gained); S.coins += gained; S.stats.trainings++;
    let tierMsg = '';
    if (key === 'str') { S.stats.math += this.correct; if (this.firstOk >= 7 && S.mathTier < 6) { S.mathTier++; tierMsg = 'Wow! The questions will get a little harder now. You are ready!'; } else if (this.firstOk <= 3 && S.mathTier > 1) S.mathTier--; }
    const badges = checkBadges(); Save.save();
    UI.dojoResult({ kind: key, info: this.info, gained, ups, before, pBefore, badges, tierMsg });
  }
  draw(g) {
    g.drawImage(renderDojo(), 0, 0);
    if (this.phase !== 'intro') this['draw_' + this.kind](g);
    this.fx.draw(g);
    g.textBaseline = 'middle';
    if (this.phase === 'intro') {
      g.fillStyle = 'rgba(8,10,20,0.75)'; g.fillRect(0, 250, W, 200); g.fillStyle = '#ffe14d'; g.fillRect(0, 250, W, 4); g.fillRect(0, 446, W, 4);
      g.textAlign = 'center'; g.font = `bold 64px ${FONT}`; g.fillText(this.info.icon + ' ' + this.info.name.toUpperCase(), W / 2, 318);
      g.fillStyle = '#fff'; g.font = `26px ${FONT}`; g.fillText(this.info.intro.split('! ')[1] || '', W / 2, 388); g.font = `18px ${FONT}`; g.fillStyle = '#9fb4cc'; g.fillText('Trains your ' + this.info.stat + '  →  ' + this.info.gives, W / 2, 424);
    } else if (this.kind !== 'str' || this.phase !== 'ask') {
      g.fillStyle = 'rgba(10,14,26,0.7)'; rr(g, W / 2 - 190, 14, 380, 50, 25); g.fill(); g.fillStyle = '#ffe14d'; g.font = `bold 24px ${FONT}`; g.textAlign = 'center';
      g.fillText(`${this.info.icon} ${Math.min(this.round + 1, this.rounds)} / ${this.rounds}     +${this.score} ${this.info.stat}`, W / 2, 40);
    }
  }
}
