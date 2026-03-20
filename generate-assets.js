/**
 * Génère les assets images pour Images Manager (icon, splash, favicon)
 * Utilise uniquement des modules Node.js natifs (zlib, fs) — aucune dépendance.
 * Lancer : node generate-assets.js
 */
const fs   = require('fs');
const path = require('path');
const zlib = require('zlib');

const BLUE  = [37, 99, 235];
const WHITE = [255, 255, 255];
const LIGHT = [180, 210, 255];

// ── CRC32 (requis par le format PNG) ──────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBytes, data]);
  const len  = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crcB]);
}

// ── Dessin de primitives dans un buffer RGB ───────────────────────────────────
function createCanvas(w, h, bg = BLUE) {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { buf[i*3]=bg[0]; buf[i*3+1]=bg[1]; buf[i*3+2]=bg[2]; }
  const set = (x, y, col) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    buf[(y*w+x)*3]=col[0]; buf[(y*w+x)*3+1]=col[1]; buf[(y*w+x)*3+2]=col[2];
  };
  const fillRect = (x1, y1, x2, y2, col) => {
    for (let y=Math.max(0,y1); y<=Math.min(h-1,y2); y++)
      for (let x=Math.max(0,x1); x<=Math.min(w-1,x2); x++) set(x, y, col);
  };
  const fillCircle = (cx, cy, r, col) => {
    for (let y=cy-r; y<=cy+r; y++)
      for (let x=cx-r; x<=cx+r; x++)
        if ((x-cx)**2+(y-cy)**2 <= r*r) set(x, y, col);
  };
  const fillRoundRect = (x1, y1, x2, y2, r, col) => {
    fillRect(x1+r, y1, x2-r, y2, col);
    fillRect(x1, y1+r, x2, y2-r, col);
    fillCircle(x1+r, y1+r, r, col);
    fillCircle(x2-r, y1+r, r, col);
    fillCircle(x1+r, y2-r, r, col);
    fillCircle(x2-r, y2-r, r, col);
  };
  return { buf, w, h, fillRect, fillCircle, fillRoundRect };
}

function toPNG(canvas) {
  const { buf, w, h } = canvas;
  const sig  = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0); ihdrData.writeUInt32BE(h, 4);
  ihdrData[8]=8; ihdrData[9]=2;
  const ihdr = chunk('IHDR', ihdrData);
  const rawRows = Buffer.alloc(h * (w * 3 + 1));
  for (let y = 0; y < h; y++) {
    rawRows[y*(w*3+1)] = 0;
    buf.copy(rawRows, y*(w*3+1)+1, y*w*3, (y+1)*w*3);
  }
  const compressed = zlib.deflateSync(rawRows, { level: 6 });
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

function drawCamera(c, cx, cy, size) {
  const bw = Math.round(size * 0.62), bh = Math.round(size * 0.20);
  c.fillRoundRect(cx-bw/2|0, cy-bh/2|0, cx+bw/2|0, cy+bh/2|0, Math.round(bh*0.2), WHITE);
  c.fillCircle(cx, cy, Math.round(size * 0.09), BLUE);
  c.fillCircle(cx, cy, Math.round(size * 0.065), WHITE);
  c.fillCircle(cx, cy, Math.round(size * 0.04), BLUE);
  c.fillRect(cx - Math.round(size*0.08), cy - Math.round(size*0.15),
             cx + Math.round(size*0.05), cy - Math.round(size*0.09), WHITE);
}

// ── icon.png 1024×1024 ────────────────────────────────────────────────────────
const icon = createCanvas(1024, 1024);
drawCamera(icon, 512, 420, 1024);
fs.writeFileSync(path.join(__dirname, 'assets', 'icon.png'), toPNG(icon));
fs.copyFileSync(path.join(__dirname, 'assets', 'icon.png'),
                path.join(__dirname, 'assets', 'adaptive-icon.png'));
console.log('✅ icon.png + adaptive-icon.png');

// ── splash.png 1242×2436 ──────────────────────────────────────────────────────
const splash = createCanvas(1242, 2436);
drawCamera(splash, 621, 900, 1242);
fs.writeFileSync(path.join(__dirname, 'assets', 'splash.png'), toPNG(splash));
console.log('✅ splash.png');

// ── favicon.png 64×64 ────────────────────────────────────────────────────────
const fav = createCanvas(64, 64);
fav.fillRoundRect(4, 14, 60, 50, 6, WHITE);
fav.fillCircle(32, 32, 12, BLUE);
fav.fillCircle(32, 32, 8, WHITE);
fav.fillCircle(32, 32, 4, BLUE);
fs.writeFileSync(path.join(__dirname, 'assets', 'favicon.png'), toPNG(fav));
console.log('✅ favicon.png');

console.log('\n✅ Tous les assets ont été générés dans ./assets/');
