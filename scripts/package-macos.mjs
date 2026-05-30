import { execFile as execFileCallback } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const appPath = join(root, "SMART ReplySuite.app");
const launcherSource = join(root, "launcher", "macos-launcher.c");
const launcherTarget = join(appPath, "Contents", "MacOS", "SMART ReplySuite");
const distDir = join(root, "dist");
const zipPath = join(distDir, `SMART-ReplySuite-macOS-${process.arch}.zip`);

if (process.platform !== "darwin") {
  throw new Error("macOS packages can only be created on macOS.");
}

await execFile("node", [join(root, "scripts", "vendor-macos-runtime.mjs")]);
await execFile("clang", [launcherSource, "-framework", "CoreFoundation", "-o", launcherTarget]);
await execFile("codesign", ["--force", "--deep", "--sign", "-", appPath]);
await execFile("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);
await mkdir(distDir, { recursive: true });
await rm(zipPath, { force: true });
await execFile("ditto", ["-c", "-k", "--norsrc", "--keepParent", appPath, zipPath]);

console.log(zipPath);
