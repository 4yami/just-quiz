// Generates public/pwa-192.png, public/pwa-512.png and public/favicon.ico
// Pure Node.js (zlib + manual PNG/ICO encoding) — no native dependencies.
// Icon: electric-blue gradient rounded square with a white double-checkmark
// that matches the app header's lucide check-check logo exactly:
// the 24×24 icon (stroke-width 3.5) sits centered in a 36×36 tile, so every
// viewBox unit (and the stroke) maps to tile fraction (6 + v)/36.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- Minimal PNG encoder ---
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(width, height, rgba) {
  // Each row: filter byte (0) + width*4 bytes
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Minimal ICO encoder (PNG-in-ICO, supported by all modern browsers) ---
// images: [{ width, height, data }] where data is a PNG buffer.
function encodeIco(images) {
  const count = images.length;
  const headerSize = 6 + 16 * count;
  const entries = [];
  let offset = headerSize;
  for (const { width, height, data } of images) {
    entries.push({
      width: width >= 256 ? 0 : width, // 0 in the ICO header means 256px
      height: height >= 256 ? 0 : height,
      data,
      offset,
    });
    offset += data.length;
  }

  const buf = Buffer.alloc(headerSize + images.reduce((sum, img) => sum + img.data.length, 0));
  buf.writeUInt16LE(0, 0);         // reserved
  buf.writeUInt16LE(1, 2);         // type: icon
  buf.writeUInt16LE(count, 4);     // image count
  let p = 6;
  for (const e of entries) {
    buf[p] = e.width;              // width (0 = 256)
    buf[p + 1] = e.height;         // height (0 = 256)
    buf[p + 2] = 0;                // color count (0 = 256+)
    buf[p + 3] = 0;                // reserved
    buf.writeUInt16LE(1, p + 4);   // color planes
    buf.writeUInt16LE(32, p + 6);  // bits per pixel
    buf.writeUInt32LE(e.data.length, p + 8);
    buf.writeUInt32LE(e.offset, p + 12);
    p += 16;
  }
  for (const e of entries) e.data.copy(buf, e.offset);
  return buf;
}

// --- Drawing helpers ---
function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

// Lucide `check-check` polylines, 24×24 viewBox:
//   M18 6 7 17l-5-5        (back check — long, left sweep)
//   m22 10-7.5 7.5L13 16   (front check — short, right picket)
// The header renders this icon at h-6 w-6 inside a h-9 w-9 tile (6px padding),
// so each viewBox unit v maps to tile fraction (6 + v)/36.
const CHECKS = [
  [
    [18, 6],
    [7, 17],
    [2, 12],
  ],
  [
    [22, 10],
    [14.5, 17.5],
    [13, 16],
  ],
].map((poly) => poly.map(([x, y]) => [(6 + x) / 36, (6 + y) / 36]));

function pointSegDistSq(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return (px - cx) ** 2 + (py - cy) ** 2;
}

// Polylines (and their vertices) scaled from 0..1 tile fractions into the
// target pixel size, used for the distance test below.
function scalePolylines(polylines, size) {
  return polylines.map((poly) => poly.map(([x, y]) => [x * size, y * size]));
}

// Squared distance from (px, py) to the stroked double-check — vertices are
// included so round caps/joins match Lucide exactly.
function strokeDistSq(px, py, polylines) {
  let min = Infinity;
  for (const poly of polylines) {
    for (let i = 0; i < poly.length - 1; i++) {
      const d = pointSegDistSq(px, py, poly[i][0], poly[i][1], poly[i + 1][0], poly[i + 1][1]);
      if (d < min) min = d;
    }
    for (const [x, y] of poly) {
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < min) min = d;
    }
  }
  return min;
}

// 4×4 supersampling per pixel gives even fractional stroke widths and crisp
// anti-aliased edges — no chunky integer rounding, no 2px floor, no extra
// feathering that used to fatten the strokes.
const SS = 4;

function drawIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;
  const gradX1 = 0, gradY1 = 0, gradX2 = size, gradY2 = size;
  const gradLen2 = (gradX2 - gradX1) ** 2 + (gradY2 - gradY1) ** 2 || 1;

  // Header stroke weight: 3.5px on the 24px viewBox, scaled to the 36px tile,
  // then to this tile size. Kept fractional so 16px favicons stay light and
  // match the header exactly.
  const half = ((size * 3.5) / 36) / 2;
  const halfSq = half * half;
  const polylines = scalePolylines(CHECKS, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Linear gradient (#0052FF → #4D7CFF) along the diagonal, sampled at the
      // pixel center — the gradient is smooth so it needs no supersampling.
      const gx = Math.min(x + 0.5, size - 1);
      const gy = Math.min(y + 0.5, size - 1);
      const t = Math.min(1, Math.max(0, ((gx - gradX1) * (gradX2 - gradX1) + (gy - gradY1) * (gradY2 - gradY1)) / gradLen2));
      const br = lerp(0x00, 0x4d, t);
      const bg = lerp(0x52, 0x7c, t);
      const bb = lerp(0xff, 0xff, t);

      let sr = 0, sg = 0, sb = 0, sa = 0;
      for (let syi = 0; syi < SS; syi++) {
        for (let sxi = 0; sxi < SS; sxi++) {
          const px = Math.min(Math.max(x + (sxi + 0.5) / SS, 0), size - 1);
          const py = Math.min(Math.max(y + (syi + 0.5) / SS, 0), size - 1);

          // Rounded-rect mask with anti-aliased corners.
          const dx = Math.min(px, size - 1 - px);
          const dy = Math.min(py, size - 1 - py);
          if (dx < radius && dy < radius && Math.hypot(radius - dx, radius - dy) > radius) {
            continue; // subpixel outside the rounded corner
          }

          if (strokeDistSq(px, py, polylines) <= halfSq) {
            sr += 255;
            sg += 255;
            sb += 255;
          } else {
            sr += br;
            sg += bg;
            sb += bb;
          }
          sa += 255;
        }
      }

      const n = SS * SS;
      const i = (y * size + x) * 4;
      buf[i] = Math.round(sr / n);
      buf[i + 1] = Math.round(sg / n);
      buf[i + 2] = Math.round(sb / n);
      buf[i + 3] = Math.round(sa / n);
    }
  }

  return encodePng(size, size, buf);
}

mkdirSync(join(root, 'public'), { recursive: true });

writeFileSync(join(root, 'public', 'pwa-192.png'), drawIcon(192));
writeFileSync(join(root, 'public', 'pwa-512.png'), drawIcon(512));

const ico = [16, 32, 48, 256].map((s) => ({ width: s, height: s, data: drawIcon(s) }));
writeFileSync(join(root, 'public', 'favicon.ico'), encodeIco(ico));

console.log('Generated public/pwa-192.png, public/pwa-512.png and public/favicon.ico');