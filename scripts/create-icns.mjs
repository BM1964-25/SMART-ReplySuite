import { readFile, writeFile } from "node:fs/promises";

const chunks = [
  { type: "icp4", path: "build/icon-16.png" },
  { type: "icp5", path: "build/icon-32.png" },
  { type: "icp6", path: "build/icon-64.png" },
  { type: "ic07", path: "build/icon-128.png" },
  { type: "ic08", path: "build/icon-256.png" },
  { type: "ic09", path: "build/icon-512.png" },
  { type: "ic10", path: "build/icon.png" }
];

const parts = await Promise.all(chunks.map(async (chunk) => {
  const data = await readFile(chunk.path);
  const header = Buffer.alloc(8);
  header.write(chunk.type, 0, 4, "ascii");
  header.writeUInt32BE(data.length + 8, 4);
  return Buffer.concat([header, data]);
}));

const totalLength = 8 + parts.reduce((sum, part) => sum + part.length, 0);
const header = Buffer.alloc(8);
header.write("icns", 0, 4, "ascii");
header.writeUInt32BE(totalLength, 4);

await writeFile("build/icon.icns", Buffer.concat([header, ...parts]));
