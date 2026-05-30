import { execFile as execFileCallback } from "node:child_process";
import { access, copyFile, mkdir, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = join(root, "dist");
const stageDir = join(distDir, "SMART ReplySuite Windows");
const zipPath = join(distDir, "SMART-ReplySuite-Windows-x64.zip");

const requiredWindowsRuntime = [
  "vendor/node/win32-x64/node.exe",
  "vendor/ocr/win32-x64/bin/pdftoppm.exe",
  "vendor/ocr/win32-x64/bin/tesseract.exe",
  "vendor/ocr/win32-x64/tessdata/deu.traineddata",
  "vendor/ocr/win32-x64/tessdata/eng.traineddata"
];

const appFiles = [
  "anthropicClient.js",
  "app.js",
  "index.html",
  "licenseClient.js",
  "localProxyServer.js",
  "manifest.webmanifest",
  "package.json",
  "package-lock.json",
  "styles.css",
  "SMART ReplySuite starten.vbs"
];

for (const filePath of requiredWindowsRuntime) {
  await mustExist(join(root, filePath), filePath);
}

await rm(stageDir, { recursive: true, force: true });
await mkdir(stageDir, { recursive: true });

for (const filePath of appFiles) {
  await copyPath(join(root, filePath), join(stageDir, filePath));
}
await copyPath(join(root, "assets"), join(stageDir, "assets"));
await copyPath(join(root, "build"), join(stageDir, "build"));
await copyPath(join(root, "node_modules"), join(stageDir, "node_modules"));
await copyPath(join(root, "vendor", "node", "win32-x64"), join(stageDir, "vendor", "node", "win32-x64"));
await copyPath(join(root, "vendor", "ocr", "win32-x64"), join(stageDir, "vendor", "ocr", "win32-x64"));

await rm(zipPath, { force: true });
if (process.platform === "win32") {
  await execFile("powershell.exe", [
    "-NoProfile",
    "-Command",
    `Compress-Archive -Path '${stageDir}' -DestinationPath '${zipPath}' -Force`
  ]);
} else {
  await execFile("ditto", ["-c", "-k", "--norsrc", "--keepParent", stageDir, zipPath]);
}

console.log(zipPath);

async function mustExist(absPath, label) {
  try {
    await access(absPath, constants.R_OK);
  } catch {
    throw new Error(`Missing Windows runtime file: ${label}`);
  }
}

async function copyPath(source, target) {
  await mkdir(dirname(target), { recursive: true });
  await execFile("ditto", [source, target]);
}
