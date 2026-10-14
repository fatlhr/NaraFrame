// Repository-authored schematic objects, deliberately padded; no external artwork.

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const crc = (data) => {
  let c = 0xffffffff;
  for (const b of data) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const t = Buffer.from(type),
    length = Buffer.alloc(4),
    sum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  sum.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([length, t, data, sum]);
};
for (const [name, hand] of [
  ["pose-left", 100],
  ["pose-right", 220],
  ["note-prop", 160],
]) {
  const width = 320,
    height = 400;
  const pixels = Buffer.alloc((width * 4 + 1) * height);
  const rect = (x, y, w, h, color) => {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) {
        const at = yy * (width * 4 + 1) + 1 + xx * 4;
        pixels.set(color, at);
      }
  };
  if (name === "note-prop") {
    rect(110, 150, 100, 100, [242, 188, 70, 255]);
    rect(125, 174, 70, 8, [35, 42, 61, 255]);
    rect(125, 195, 48, 8, [35, 42, 61, 255]);
  } else {
    rect(110, 70, 100, 100, [53, 102, 191, 255]);
    rect(90, 180, 140, 150, [53, 102, 191, 255]);
    rect(hand - 20, 160, 40, 60, [53, 102, 191, 255]);
    rect(135, 107, 12, 12, [255, 255, 255, 255]);
    rect(175, 107, 12, 12, [255, 255, 255, 255]);
    rect(140, 140, 40, 8, [255, 255, 255, 255]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(pixels)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(new URL(`${name}.png`, import.meta.url), png);
  console.log(name, createHash("sha256").update(png).digest("hex"));
}
