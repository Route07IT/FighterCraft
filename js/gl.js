'use strict';
/* ============================================================
   FIGHTER CRAFT - a tiny 3D engine (WebGL, no libraries).
   Everything in the 3D world is made of coloured boxes:
     - static boxes (the city) are uploaded once
     - dynamic boxes (hero, robots, coins, sparks) are rebuilt every frame
     - "glow" boxes are drawn last with additive light (beams, beacons, force fields)
   ============================================================ */
const M4 = { // 4x4 matrices, column-major
  id() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
  mul(a, b) { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]; return o; },
  t(m, x, y, z) { const o = m.slice(); o[12] = m[0] * x + m[4] * y + m[8] * z + m[12]; o[13] = m[1] * x + m[5] * y + m[9] * z + m[13]; o[14] = m[2] * x + m[6] * y + m[10] * z + m[14]; return o; },
  rx(m, a) { if (!a) return m; const c = Math.cos(a), s = Math.sin(a), o = m.slice(); for (let i = 0; i < 3; i++) { const y = m[4 + i], z = m[8 + i]; o[4 + i] = y * c + z * s; o[8 + i] = z * c - y * s; } return o; },
  ry(m, a) { if (!a) return m; const c = Math.cos(a), s = Math.sin(a), o = m.slice(); for (let i = 0; i < 3; i++) { const x = m[i], z = m[8 + i]; o[i] = x * c - z * s; o[8 + i] = x * s + z * c; } return o; },
  rz(m, a) { if (!a) return m; const c = Math.cos(a), s = Math.sin(a), o = m.slice(); for (let i = 0; i < 3; i++) { const x = m[i], y = m[4 + i]; o[i] = x * c + y * s; o[4 + i] = y * c - x * s; } return o; },
  persp(fovy, asp, n, f) { const t = 1 / Math.tan(fovy / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; },
  look(ex, ey, ez, tx, ty, tz) {
    let fx = tx - ex, fy = ty - ey, fz = tz - ez; const fl = Math.hypot(fx, fy, fz) || 1; fx /= fl; fy /= fl; fz /= fl;
    let sx = -fz, sz = fx; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl; // side = f x up(0,1,0)
    const ux = -sz * fy, uy = sz * fx - sx * fz, uz = sx * fy;
    return [sx, ux, -fx, 0, 0, uy, -fy, 0, sz, uz, -fz, 0, -(sx * ex + sz * ez), -(ux * ex + uy * ey + uz * ez), fx * ex + fy * ey + fz * ez, 1];
  }
};
const _c3 = new Map();
function C3(hex) { // '#rrggbb' -> [r,g,b] in 0..1 (cached)
  let v = _c3.get(hex); if (v) return v;
  const n = parseInt(hex.slice(1), 16); v = [(n >> 16) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; _c3.set(hex, v); return v;
}
const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mulC = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

const G3 = {
  ok: false, gl: null, FL: 360, // floats per box: 36 vertices x (pos3 + normal3 + colour3 + material1)
  init(cv) {
    let gl = null;
    try { gl = cv.getContext('webgl', { antialias: true, alpha: false }) || cv.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return false;
    this.gl = gl; this.cv = cv;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
    const HP = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
    try {
      this.prog = prog(
        'attribute vec3 aP; attribute vec3 aN; attribute vec4 aC; uniform mat4 uVP; varying vec3 vN; varying vec4 vC; varying vec3 vW; void main(){ vW=aP; vN=aN; vC=aC; gl_Position=uVP*vec4(aP,1.0); }',
        HP + `varying vec3 vN; varying vec4 vC; varying vec3 vW;
uniform vec3 uSun, uSunCol, uAmb, uFog, uCam, uLitA, uLitB; uniform float uFogD, uAdd;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec3 n = normalize(vN); vec3 col = vC.rgb; float em = vC.a;
  float fd = length(vW - uCam); float fog = clamp(fd / uFogD, 0.0, 1.0); fog *= fog;
  if (uAdd > 0.5) { gl_FragColor = vec4(col * em * (1.0 - fog), 1.0); return; }
  if (em > 1.5) { // a building: draw rows of windows on its walls
    float d = em - 2.0; em = 0.0;
    if (abs(n.y) < 0.5 && vW.y > 1.2) {
      float u = abs(n.x) > 0.5 ? vW.z : vW.x;
      vec2 g = vec2(u / 2.4, vW.y / 3.2); vec2 c = floor(g); vec2 f = fract(g);
      if (f.x > 0.2 && f.x < 0.8 && f.y > 0.28 && f.y < 0.8) {
        float lit = d < 0.5 ? uLitA.x : d < 1.5 ? uLitA.y : d < 2.5 ? uLitA.z : d < 3.5 ? uLitB.x : d < 4.5 ? uLitB.y : uLitB.z;
        vec3 win = d < 0.5 ? vec3(1.0, 0.8, 0.45) : d < 1.5 ? (hash(c * 0.7) < 0.5 ? vec3(1.0, 0.3, 0.9) : vec3(0.3, 0.95, 1.0)) : d < 2.5 ? vec3(0.85, 0.95, 1.0) : d < 3.5 ? vec3(0.8, 1.0, 0.4) : d < 4.5 ? vec3(1.0, 0.35, 0.3) : vec3(1.0, 0.92, 0.6);
        if (hash(c + vec2(n.x * 7.0, n.z * 13.0)) < lit) { col = win * (0.75 + 0.25 * hash(c * 1.7)); em = 0.9; } else col *= 0.5;
      }
    }
  }
  vec3 lit = col * (uAmb + uSunCol * max(dot(n, uSun), 0.0));
  lit = mix(lit, col, clamp(em, 0.0, 1.0));
  gl_FragColor = vec4(mix(lit, uFog, fog), 1.0);
}`);
      this.sky = prog('attribute vec2 aP; varying vec2 vP; void main(){ vP=aP; gl_Position=vec4(aP,0.9999,1.0); }',
        HP + 'varying vec2 vP; uniform vec3 uTop, uHor, uSunC; uniform vec3 uSunP; void main(){ float t=clamp(vP.y*0.9+0.25,0.0,1.0); vec3 c=mix(uHor,uTop,t); float d=length((vP-uSunP.xy)*vec2(1.78,1.0)); c+=uSunC*uSunP.z*(smoothstep(0.09,0.07,d)+0.35*smoothstep(0.7,0.0,d)); gl_FragColor=vec4(c,1.0); }');
    } catch (e) { console.error(e); return false; }
    this.u = {}; for (const n of ['uVP', 'uSun', 'uSunCol', 'uAmb', 'uFog', 'uCam', 'uLitA', 'uLitB', 'uFogD', 'uAdd']) this.u[n] = gl.getUniformLocation(this.prog, n);
    this.us = {}; for (const n of ['uTop', 'uHor', 'uSunC', 'uSunP']) this.us[n] = gl.getUniformLocation(this.sky, n);
    this.aP = gl.getAttribLocation(this.prog, 'aP'); this.aN = gl.getAttribLocation(this.prog, 'aN'); this.aC = gl.getAttribLocation(this.prog, 'aC');
    this.aSky = gl.getAttribLocation(this.sky, 'aP');
    this.sbuf = gl.createBuffer(); this.dbuf = gl.createBuffer(); this.abuf = gl.createBuffer(); this.qbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.qbuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    this.dyn = new Float32Array(2600 * this.FL); this.add = new Float32Array(700 * this.FL); this.sn = 0;
    this._c = new Float32Array(24); this._m = M4.id();
    this.out = this.dyn; this.n = 0; this.cap = 2600; this.an = 0; this.ok = true;
    return true;
  },
  begin() { this.n = 0; this.an = 0; },
  _emit(o, idx, m, hx, hy, hz, col, e) {
    const C = this._c, ax = m[0] * hx, ay = m[1] * hx, az = m[2] * hx, bx = m[4] * hy, by = m[5] * hy, bz = m[6] * hy, cx = m[8] * hz, cy = m[9] * hz, cz = m[10] * hz, px = m[12], py = m[13], pz = m[14];
    for (let k = 0; k < 8; k++) { const sa = k & 1 ? 1 : -1, sb = k & 2 ? 1 : -1, sc = k & 4 ? 1 : -1; C[k * 3] = px + sa * ax + sb * bx + sc * cx; C[k * 3 + 1] = py + sa * ay + sb * by + sc * cy; C[k * 3 + 2] = pz + sa * az + sb * bz + sc * cz; }
    let i = idx * 360; const r = col[0], g = col[1], b = col[2];
    for (let f = 0; f < 6; f++) {
      const F = G3.FACE[f], s = F[0], a4 = F[1] * 4, nx = s * m[a4], ny = s * m[a4 + 1], nz = s * m[a4 + 2];
      for (let t = 0; t < 6; t++) { const ci = F[2 + G3.TRI[t]] * 3; o[i++] = C[ci]; o[i++] = C[ci + 1]; o[i++] = C[ci + 2]; o[i++] = nx; o[i++] = ny; o[i++] = nz; o[i++] = r; o[i++] = g; o[i++] = b; o[i++] = e; }
    }
  },
  /* a box with full transform m (rotation + translation only), half-sizes hx,hy,hz */
  box(m, hx, hy, hz, col, e = 0) { if (this.n < this.cap) this._emit(this.out, this.n++, m, hx, hy, hz, col, e); },
  /* axis-aligned box centred at x,y,z */
  abox(x, y, z, hx, hy, hz, col, e = 0) { const m = this._m; m[12] = x; m[13] = y; m[14] = z; this.box(m, hx, hy, hz, col, e); },
  /* additive glow box (e = brightness) */
  glow(m, hx, hy, hz, col, e = 1) { if (this.an < 700) this._emit(this.add, this.an++, m, hx, hy, hz, col, e); },
  aglow(x, y, z, hx, hy, hz, col, e = 1) { const m = this._m; m[12] = x; m[13] = y; m[14] = z; this.glow(m, hx, hy, hz, col, e); },
  /* record the static city: call staticBegin, emit boxes with box/abox, then staticEnd */
  staticBegin(maxBoxes) { this._save = [this.out, this.n, this.cap]; this.out = new Float32Array(maxBoxes * this.FL); this.n = 0; this.cap = maxBoxes; },
  staticEnd() {
    const gl = this.gl; this.sn = this.n;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sbuf); gl.bufferData(gl.ARRAY_BUFFER, this.out.subarray(0, this.n * this.FL), gl.STATIC_DRAW);
    this.out = this._save[0]; this.n = this._save[1]; this.cap = this._save[2];
  },
  _attribs() { const gl = this.gl; gl.enableVertexAttribArray(this.aP); gl.enableVertexAttribArray(this.aN); gl.enableVertexAttribArray(this.aC); gl.vertexAttribPointer(this.aP, 3, gl.FLOAT, false, 40, 0); gl.vertexAttribPointer(this.aN, 3, gl.FLOAT, false, 40, 12); gl.vertexAttribPointer(this.aC, 4, gl.FLOAT, false, 40, 24); },
  render(vp, cam, env) {
    const gl = this.gl; gl.viewport(0, 0, this.cv.width, this.cv.height);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
    gl.useProgram(this.sky); gl.bindBuffer(gl.ARRAY_BUFFER, this.qbuf); gl.enableVertexAttribArray(this.aSky); gl.vertexAttribPointer(this.aSky, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(this.us.uTop, env.top); gl.uniform3fv(this.us.uHor, env.hor); gl.uniform3fv(this.us.uSunC, env.sunDisc); gl.uniform3fv(this.us.uSunP, env.sunScr);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.u.uVP, false, vp); gl.uniform3fv(this.u.uSun, env.sun); gl.uniform3fv(this.u.uSunCol, env.sunCol); gl.uniform3fv(this.u.uAmb, env.amb); gl.uniform3fv(this.u.uFog, env.fog);
    gl.uniform3fv(this.u.uCam, cam); gl.uniform3fv(this.u.uLitA, env.litA); gl.uniform3fv(this.u.uLitB, env.litB); gl.uniform1f(this.u.uFogD, env.fogD); gl.uniform1f(this.u.uAdd, 0);
    if (this.sn) { gl.bindBuffer(gl.ARRAY_BUFFER, this.sbuf); this._attribs(); gl.drawArrays(gl.TRIANGLES, 0, this.sn * 36); }
    if (this.n) { gl.bindBuffer(gl.ARRAY_BUFFER, this.dbuf); gl.bufferData(gl.ARRAY_BUFFER, this.dyn.subarray(0, this.n * this.FL), gl.DYNAMIC_DRAW); this._attribs(); gl.drawArrays(gl.TRIANGLES, 0, this.n * 36); }
    if (this.an) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false); gl.uniform1f(this.u.uAdd, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.abuf); gl.bufferData(gl.ARRAY_BUFFER, this.add.subarray(0, this.an * this.FL), gl.DYNAMIC_DRAW); this._attribs(); gl.drawArrays(gl.TRIANGLES, 0, this.an * 36);
      gl.disable(gl.BLEND); gl.depthMask(true);
    }
  }
};
G3.TRI = [0, 1, 2, 0, 2, 3];
G3.FACE = [[1, 0, 1, 3, 7, 5], [-1, 0, 0, 4, 6, 2], [1, 1, 2, 6, 7, 3], [-1, 1, 0, 1, 5, 4], [1, 2, 4, 5, 7, 6], [-1, 2, 0, 2, 3, 1]];
