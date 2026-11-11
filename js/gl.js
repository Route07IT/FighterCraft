'use strict';
/* ============================================================
   FIGHTER CRAFT - a tiny 3D engine (WebGL, no libraries).
   Shapes: boxes plus smooth spheres, cylinders and cones, so
   characters and vehicles look rounded instead of blocky.
     - static shapes (the city) are uploaded once
     - dynamic shapes (hero, robots, vehicles, sparks) are rebuilt every frame
     - "glow" shapes are drawn with additive light (beams, beacons, flames)
     - soft round shadows are blended onto the ground
   Material (4th colour number): 0..1 glows by itself, below 0 is shiny
   metal/paint, 2..7 is a building wall with windows, 9 asphalt, 10 paving,
   11 grass, 12 water.
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

/* unit shapes: p = positions, q = normals, n = vertex count */
function mkSphere(seg, rings) {
  const P = [], pt = (i, j) => { const th = i / seg * Math.PI * 2, ph = j / rings * Math.PI, s = Math.sin(ph); return [Math.cos(th) * s, Math.cos(ph), Math.sin(th) * s]; };
  for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1); if (j > 0) P.push(...a, ...b, ...c); if (j < rings - 1) P.push(...a, ...c, ...d); }
  const p = new Float32Array(P); return { p, q: p, n: P.length / 3 };
}
function mkCyl(seg, rTop) { // radius 1 at the bottom (y=-1), rTop at the top (y=1); rTop 0 makes a cone
  const P = [], Q = [], sl = (1 - rTop) / 2;
  for (let i = 0; i < seg; i++) {
    const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    P.push(c0, -1, s0, c1, -1, s1, c1 * rTop, 1, s1 * rTop); Q.push(c0, sl, s0, c1, sl, s1, c1, sl, s1);
    if (rTop > 0) { P.push(c0, -1, s0, c1 * rTop, 1, s1 * rTop, c0 * rTop, 1, s0 * rTop); Q.push(c0, sl, s0, c1, sl, s1, c0, sl, s0); P.push(0, 1, 0, c0 * rTop, 1, s0 * rTop, c1 * rTop, 1, s1 * rTop); Q.push(0, 1, 0, 0, 1, 0, 0, 1, 0); }
    P.push(0, -1, 0, c1, -1, s1, c0, -1, s0); Q.push(0, -1, 0, 0, -1, 0, 0, -1, 0);
  }
  return { p: new Float32Array(P), q: new Float32Array(Q), n: P.length / 3 };
}
const SPT = mkSphere(5, 3), SPH = mkSphere(14, 9), SPL = mkSphere(9, 6), SPX = mkSphere(6, 4), CYL = mkCyl(12, 1), CYX = mkCyl(7, 1), CONE = mkCyl(10, 0), TAPER = mkCyl(12, 0.55);

const G3 = {
  ok: false, gl: null,
  init(cv) {
    let gl = null;
    try { gl = cv.getContext('webgl', { antialias: true, alpha: false }) || cv.getContext('experimental-webgl'); } catch (e) { gl = null; }
    if (!gl) return false;
    this.gl = gl; this.cv = cv;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
    const HP = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
    const NOISE = 'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }\nfloat vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x), f.y); }\n';
    try {
      this.prog = prog(
        'attribute vec3 aP; attribute vec3 aN; attribute vec4 aC; uniform mat4 uVP; varying vec3 vN; varying vec4 vC; varying vec3 vW; void main(){ vW=aP; vN=aN; vC=aC; gl_Position=uVP*vec4(aP,1.0); }',
        HP + `varying vec3 vN; varying vec4 vC; varying vec3 vW;
uniform vec3 uSun, uSunCol, uAmb, uFog, uCam, uLitA, uLitB; uniform float uFogD, uAdd, uTime;
` + NOISE + `void main(){
  vec3 n = normalize(vN); vec3 col = vC.rgb; float em = vC.a; float spec = 0.0;
  float fd = length(vW - uCam); float fog = clamp(fd / uFogD, 0.0, 1.0); fog *= fog;
  if (uAdd > 1.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, em * (1.0 - fog)); return; }
  if (uAdd > 0.5) { gl_FragColor = vec4(col * em * (1.0 - fog), 1.0); return; }
  if (em < 0.0) { spec = -em; em = 0.0; }
  else if (em > 8.5) { // ground: asphalt, paving, grass, water
    float k = em; em = 0.0;
    if (k < 9.5) col *= 0.84 + 0.2 * vn(vW.xz * 0.8) + 0.1 * vn(vW.xz * 6.0);
    else if (k < 10.5) { vec2 t = fract(vW.xz / 2.5); float ln = step(0.965, max(t.x, t.y)); col *= (0.9 + 0.12 * vn(vW.xz * 0.4)) * (1.0 - 0.25 * ln); }
    else if (k < 11.5) col *= 0.78 + 0.3 * vn(vW.xz * 1.1) + 0.14 * vn(vW.xz * 8.0);
    else { float w = vn(vW.xz * 0.3 + uTime * 0.2) + 0.5 * vn(vW.xz * 1.3 - uTime * 0.35); col *= 0.7 + 0.4 * w; spec = 0.7; }
  }
  else if (em > 1.5) { // a building: weathered wall, shop fronts, rows of glass windows
    float d = em - 2.0; em = 0.0;
    if (abs(n.y) < 0.5) {
      float u = abs(n.x) > abs(n.z) ? vW.z : vW.x;
      col *= 0.9 + 0.14 * vn(vec2(u * 0.5, vW.y * 0.2));
      if (vW.y > 0.3) {
        bool shop = vW.y < 3.4;
        vec2 g = shop ? vec2(u / 4.2, 0.0) : vec2(u / 2.4, vW.y / 3.2); vec2 c = floor(g);
        vec2 f = shop ? vec2(fract(g.x), (vW.y - 0.3) / 3.1) : fract(g);
        if (!shop && f.y < 0.07) col *= 0.8;
        if (f.x > 0.16 && f.x < 0.84 && f.y > 0.26 && f.y < 0.82) {
          float lit = d < 0.5 ? uLitA.x : d < 1.5 ? uLitA.y : d < 2.5 ? uLitA.z : d < 3.5 ? uLitB.x : d < 4.5 ? uLitB.y : uLitB.z;
          vec3 win = d < 0.5 ? vec3(1.0, 0.8, 0.45) : d < 1.5 ? (hash(c * 0.7) < 0.5 ? vec3(1.0, 0.3, 0.9) : vec3(0.3, 0.95, 1.0)) : d < 2.5 ? vec3(0.95, 0.97, 0.85) : d < 3.5 ? vec3(0.8, 1.0, 0.4) : d < 4.5 ? vec3(1.0, 0.35, 0.3) : vec3(1.0, 0.92, 0.6);
          float hs = hash(c + vec2(n.x * 7.0 + d, n.z * 13.0));
          if (hs < lit * (shop ? 1.6 : 1.0)) { col = win * (0.75 + 0.25 * hash(c * 1.7)); em = 0.9; }
          else { col = mix(vec3(0.07, 0.09, 0.13), uFog, 0.36 + 0.26 * f.y) * (0.8 + 0.2 * hs); spec = 0.5; }
        }
      }
    }
  }
  float ndl = max(dot(n, uSun), 0.0);
  vec3 lit = col * (uAmb * (0.62 + 0.5 * (0.5 + 0.5 * n.y)) + uSunCol * ndl);
  if (spec > 0.0) { vec3 v = normalize(uCam - vW); vec3 hv = normalize(v + uSun); lit += uSunCol * pow(max(dot(n, hv), 0.0), 30.0) * spec; lit += uAmb * pow(1.0 - max(dot(n, v), 0.0), 3.0) * spec * 0.45; }
  lit = mix(lit, col, clamp(em, 0.0, 1.0));
  gl_FragColor = vec4(mix(lit, uFog, fog), 1.0);
}`);
      this.sky = prog('attribute vec2 aP; varying vec2 vP; void main(){ vP=aP; gl_Position=vec4(aP,0.9999,1.0); }',
        HP + 'varying vec2 vP; uniform vec3 uTop, uHor, uSunC, uSunP, uCl; uniform float uYaw, uTime, uCA;\n' + NOISE +
        'void main(){ float t=clamp(vP.y*0.9+0.25,0.0,1.0); vec3 c=mix(uHor,uTop,t); float d=length((vP-uSunP.xy)*vec2(1.78,1.0)); c+=uSunC*uSunP.z*(smoothstep(0.09,0.07,d)+0.35*smoothstep(0.7,0.0,d));' +
        ' vec2 uv=vec2(vP.x*1.1+uYaw*1.7+uTime*0.004, vP.y*2.2); float f=vn(uv*1.7)*0.55+vn(uv*3.7)*0.3+vn(uv*8.0)*0.15; float cl=smoothstep(0.5,0.78,f)*smoothstep(-0.02,0.3,vP.y); c=mix(c,uCl,cl*uCA); gl_FragColor=vec4(c,1.0); }');
    } catch (e) { console.error(e); return false; }
    this.u = {}; for (const n of ['uVP', 'uSun', 'uSunCol', 'uAmb', 'uFog', 'uCam', 'uLitA', 'uLitB', 'uFogD', 'uAdd', 'uTime']) this.u[n] = gl.getUniformLocation(this.prog, n);
    this.us = {}; for (const n of ['uTop', 'uHor', 'uSunC', 'uSunP', 'uCl', 'uYaw', 'uTime', 'uCA']) this.us[n] = gl.getUniformLocation(this.sky, n);
    this.aP = gl.getAttribLocation(this.prog, 'aP'); this.aN = gl.getAttribLocation(this.prog, 'aN'); this.aC = gl.getAttribLocation(this.prog, 'aC'); this.aSky = gl.getAttribLocation(this.sky, 'aP');
    this.sbuf = gl.createBuffer(); this.dbuf = gl.createBuffer(); this.abuf = gl.createBuffer(); this.hbuf = gl.createBuffer(); this.qbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.qbuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const tg = v => ({ a: new Float32Array(v * 10), n: 0, cap: v });
    this.D = tg(170000); this.A = tg(26000); this.Sh = tg(5000); this.T = this.D; this.sn = 0;
    this._c = new Float32Array(24); this._m = M4.id(); this.ok = true;
    return true;
  },
  begin() { this.D.n = 0; this.A.n = 0; this.Sh.n = 0; },
  _box(T, m, hx, hy, hz, col, e) {
    if (T.n + 36 > T.cap) return;
    const C = this._c, o = T.a, ax = m[0] * hx, ay = m[1] * hx, az = m[2] * hx, bx = m[4] * hy, by = m[5] * hy, bz = m[6] * hy, cx = m[8] * hz, cy = m[9] * hz, cz = m[10] * hz, px = m[12], py = m[13], pz = m[14];
    for (let k = 0; k < 8; k++) { const sa = k & 1 ? 1 : -1, sb = k & 2 ? 1 : -1, sc = k & 4 ? 1 : -1; C[k * 3] = px + sa * ax + sb * bx + sc * cx; C[k * 3 + 1] = py + sa * ay + sb * by + sc * cy; C[k * 3 + 2] = pz + sa * az + sb * bz + sc * cz; }
    let i = T.n * 10; const r = col[0], g = col[1], b = col[2];
    for (let f = 0; f < 6; f++) {
      const F = G3.FACE[f], s = F[0], a4 = F[1] * 4, nx = s * m[a4], ny = s * m[a4 + 1], nz = s * m[a4 + 2];
      for (let t = 0; t < 6; t++) { const ci = F[2 + G3.TRI[t]] * 3; o[i++] = C[ci]; o[i++] = C[ci + 1]; o[i++] = C[ci + 2]; o[i++] = nx; o[i++] = ny; o[i++] = nz; o[i++] = r; o[i++] = g; o[i++] = b; o[i++] = e; }
    }
    T.n += 36;
  },
  _mesh(T, m, M, sx, sy, sz, col, e) {
    const cnt = M.n; if (T.n + cnt > T.cap) return;
    const o = T.a, p = M.p, q = M.q, r = col[0], g = col[1], b = col[2], ix = 1 / sx, iy = 1 / sy, iz = 1 / sz;
    const m0 = m[0], m1 = m[1], m2 = m[2], m4 = m[4], m5 = m[5], m6 = m[6], m8 = m[8], m9 = m[9], m10 = m[10], tx = m[12], ty = m[13], tz = m[14];
    let i = T.n * 10;
    for (let k = 0, j = 0; k < cnt; k++, j += 3) {
      const x = p[j] * sx, y = p[j + 1] * sy, z = p[j + 2] * sz, nx = q[j] * ix, ny = q[j + 1] * iy, nz = q[j + 2] * iz;
      const wx = m0 * nx + m4 * ny + m8 * nz, wy = m1 * nx + m5 * ny + m9 * nz, wz = m2 * nx + m6 * ny + m10 * nz, l = 1 / (Math.sqrt(wx * wx + wy * wy + wz * wz) || 1);
      o[i++] = m0 * x + m4 * y + m8 * z + tx; o[i++] = m1 * x + m5 * y + m9 * z + ty; o[i++] = m2 * x + m6 * y + m10 * z + tz;
      o[i++] = wx * l; o[i++] = wy * l; o[i++] = wz * l; o[i++] = r; o[i++] = g; o[i++] = b; o[i++] = e;
    }
    T.n += cnt;
  },
  _at(x, y, z) { const m = this._m; m[12] = x; m[13] = y; m[14] = z; return m; },
  /* solid shapes. m = rotation + translation; sizes are half-sizes / radii */
  box(m, hx, hy, hz, col, e = 0) { this._box(this.T, m, hx, hy, hz, col, e); },
  abox(x, y, z, hx, hy, hz, col, e = 0) { this._box(this.T, this._at(x, y, z), hx, hy, hz, col, e); },
  mesh(m, M, sx, sy, sz, col, e = 0) { this._mesh(this.T, m, M, sx, sy, sz, col, e); },
  amesh(x, y, z, M, sx, sy, sz, col, e = 0) { this._mesh(this.T, this._at(x, y, z), M, sx, sy, sz, col, e); },
  /* additive glow shapes (e = brightness) */
  glow(m, hx, hy, hz, col, e = 1) { this._box(this.A, m, hx, hy, hz, col, e); },
  aglow(x, y, z, hx, hy, hz, col, e = 1) { this._box(this.A, this._at(x, y, z), hx, hy, hz, col, e); },
  gmesh(m, M, sx, sy, sz, col, e = 1) { this._mesh(this.A, m, M, sx, sy, sz, col, e); },
  agmesh(x, y, z, M, sx, sy, sz, col, e = 1) { this._mesh(this.A, this._at(x, y, z), M, sx, sy, sz, col, e); },
  /* soft round shadow on the ground */
  shadow(x, y, z, r, a = 0.45) {
    const T = this.Sh; if (T.n + 36 > T.cap) return; const o = T.a; let i = T.n * 10;
    for (let k = 0; k < 12; k++) {
      const a0 = k / 12 * 6.2832, a1 = (k + 1) / 12 * 6.2832, P = [x, z, a, x + Math.cos(a0) * r, z + Math.sin(a0) * r, 0, x + Math.cos(a1) * r, z + Math.sin(a1) * r, 0];
      for (let v = 0; v < 9; v += 3) { o[i++] = P[v]; o[i++] = y; o[i++] = P[v + 1]; o[i++] = 0; o[i++] = 1; o[i++] = 0; o[i++] = 0; o[i++] = 0; o[i++] = 0; o[i++] = P[v + 2]; }
    }
    T.n += 36;
  },
  /* record the static city: staticBegin, emit shapes, staticEnd */
  staticBegin(maxVerts) { this.T = { a: new Float32Array(maxVerts * 10), n: 0, cap: maxVerts }; },
  staticEnd() { const gl = this.gl; this.sn = this.T.n; gl.bindBuffer(gl.ARRAY_BUFFER, this.sbuf); gl.bufferData(gl.ARRAY_BUFFER, this.T.a.subarray(0, this.T.n * 10), gl.STATIC_DRAW); this.T = this.D; },
  _attribs() { const gl = this.gl; gl.enableVertexAttribArray(this.aP); gl.enableVertexAttribArray(this.aN); gl.enableVertexAttribArray(this.aC); gl.vertexAttribPointer(this.aP, 3, gl.FLOAT, false, 40, 0); gl.vertexAttribPointer(this.aN, 3, gl.FLOAT, false, 40, 12); gl.vertexAttribPointer(this.aC, 4, gl.FLOAT, false, 40, 24); },
  _draw(buf, T) { const gl = this.gl; if (!T.n) return; gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, T.a.subarray(0, T.n * 10), gl.DYNAMIC_DRAW); this._attribs(); gl.drawArrays(gl.TRIANGLES, 0, T.n); },
  render(vp, cam, env) {
    const gl = this.gl; gl.viewport(0, 0, this.cv.width, this.cv.height);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(true);
    gl.useProgram(this.sky); gl.bindBuffer(gl.ARRAY_BUFFER, this.qbuf); gl.enableVertexAttribArray(this.aSky); gl.vertexAttribPointer(this.aSky, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(this.us.uTop, env.top); gl.uniform3fv(this.us.uHor, env.hor); gl.uniform3fv(this.us.uSunC, env.sunDisc); gl.uniform3fv(this.us.uSunP, env.sunScr);
    gl.uniform3fv(this.us.uCl, env.cloud); gl.uniform1f(this.us.uCA, env.cloudA); gl.uniform1f(this.us.uYaw, env.yaw || 0); gl.uniform1f(this.us.uTime, env.time || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.clear(gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    gl.useProgram(this.prog);
    gl.uniformMatrix4fv(this.u.uVP, false, vp); gl.uniform3fv(this.u.uSun, env.sun); gl.uniform3fv(this.u.uSunCol, env.sunCol); gl.uniform3fv(this.u.uAmb, env.amb); gl.uniform3fv(this.u.uFog, env.fog);
    gl.uniform3fv(this.u.uCam, cam); gl.uniform3fv(this.u.uLitA, env.litA); gl.uniform3fv(this.u.uLitB, env.litB); gl.uniform1f(this.u.uFogD, env.fogD); gl.uniform1f(this.u.uAdd, 0); gl.uniform1f(this.u.uTime, env.time || 0);
    if (this.sn) { gl.bindBuffer(gl.ARRAY_BUFFER, this.sbuf); this._attribs(); gl.drawArrays(gl.TRIANGLES, 0, this.sn); }
    if (this.Sh.n) { gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.uniform1f(this.u.uAdd, 2); this._draw(this.hbuf, this.Sh); gl.disable(gl.BLEND); gl.depthMask(true); gl.uniform1f(this.u.uAdd, 0); }
    this._draw(this.dbuf, this.D);
    if (this.A.n) { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false); gl.uniform1f(this.u.uAdd, 1); this._draw(this.abuf, this.A); gl.disable(gl.BLEND); gl.depthMask(true); }
  }
};
G3.TRI = [0, 1, 2, 0, 2, 3];
G3.FACE = [[1, 0, 1, 3, 7, 5], [-1, 0, 0, 4, 6, 2], [1, 1, 2, 6, 7, 3], [-1, 1, 0, 1, 5, 4], [1, 2, 4, 5, 7, 6], [-1, 2, 0, 2, 3, 1]];
