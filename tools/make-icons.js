// Draws the app icons (a gold lightning bolt in a blue ring) without any libraries.
// Run:  node tools/make-icons.js
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc = b => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
const BOLT = [[0.60, 0.12], [0.28, 0.55], [0.47, 0.55], [0.38, 0.88], [0.74, 0.42], [0.54, 0.42], [0.68, 0.12]];
const inside = (x, y) => { let c = false; for (let i = 0, j = BOLT.length - 1; i < BOLT.length; j = i++) { const [xi, yi] = BOLT[i], [xj, yj] = BOLT[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const edge = (x, y) => { let d = 9; for (let i = 0, j = BOLT.length - 1; i < BOLT.length; j = i++) { const [ax, ay] = BOLT[j], [bx, by] = BOLT[i], t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2))); d = Math.min(d, Math.hypot(x - ax - t * (bx - ax), y - ay - t * (by - ay))); } return d; };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function colour(x, y) {
  const r = Math.hypot(x - 0.5, y - 0.5);
  let c = mix([30, 46, 120], [8, 10, 30], y); c = mix(c, [60, 120, 230], Math.max(0, 0.55 - r) * 0.9);
  if (Math.abs(r - 0.39) < 0.022) c = [57, 208, 255]; else if (Math.abs(r - 0.39) < 0.032) c = mix(c, [57, 208, 255], 0.4);
  const d = edge(x, y);
  if (inside(x, y)) c = d < 0.012 ? [255, 250, 220] : mix([255, 243, 150], [255, 150, 26], (y - 0.12) / 0.76);
  else if (d < 0.03) c = [16, 18, 40];
  return c;
}
function png(size, file) {
  const SS = 3, raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) { const c = colour((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size); r += c[0]; g += c[1]; b += c[2]; }
      const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = r / 9; raw[o + 1] = g / 9; raw[o + 2] = b / 9; raw[o + 3] = 255;
    }
  }
  const hd = Buffer.alloc(13); hd.writeUInt32BE(size, 0); hd.writeUInt32BE(size, 4); hd[8] = 8; hd[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', hd), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
  console.log(file, fs.statSync(file).size, 'bytes');
}
const dir = path.join(__dirname, '..', 'icons'); fs.mkdirSync(dir, { recursive: true });
for (const s of [180, 192, 512]) png(s, path.join(dir, `icon-${s}.png`));
