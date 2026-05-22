import { readFile, writeFile } from "node:fs/promises";

const images = [
  { size: 16, path: "build/replysuite-icon-16.png" },
  { size: 32, path: "build/replysuite-icon-32.png" },
  { size: 48, path: "build/replysuite-icon-48.png" },
  { size: 64, path: "build/replysuite-icon-64.png" },
  { size: 128, path: "build/replysuite-icon-128.png" },
  { size: 256, path: "build/replysuite-icon-256.png" }
];

const pngs = await Promise.all(images.map(async (image) => ({
  ...image,
  bytes: await readFile(image.path)
})));

const headerSize = 6;
const entrySize = 16;
let offset = headerSize + pngs.length * entrySize;
const header = Buffer.alloc(offset);

header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);

pngs.forEach((image, index) => {
  const entryOffset = headerSize + index * entrySize;
  const iconSize = image.size >= 256 ? 0 : image.size;
  header.writeUInt8(iconSize, entryOffset);
  header.writeUInt8(iconSize, entryOffset + 1);
  header.writeUInt8(0, entryOffset + 2);
  header.writeUInt8(0, entryOffset + 3);
  header.writeUInt16LE(1, entryOffset + 4);
  header.writeUInt16LE(32, entryOffset + 6);
  header.writeUInt32LE(image.bytes.length, entryOffset + 8);
  header.writeUInt32LE(offset, entryOffset + 12);
  offset += image.bytes.length;
});

await writeFile("build/replysuite-icon.ico", Buffer.concat([header, ...pngs.map((image) => image.bytes)]));
