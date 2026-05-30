import { execFile as execFileCallback } from "node:child_process";
import { chmod, copyFile, mkdir, realpath, rm } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const arch = process.arch;
const platformKey = `darwin-${arch}`;
const vendorRoot = join(root, "vendor");
const nodeRoot = join(vendorRoot, "node", platformKey);
const ocrRoot = join(vendorRoot, "ocr", platformKey);
const nodeLibDir = join(nodeRoot, "lib");
const ocrBinDir = join(ocrRoot, "bin");
const ocrLibDir = join(ocrRoot, "lib");
const tessdataDir = join(ocrRoot, "tessdata");
const appVendorRoot = join(root, "SMART ReplySuite.app", "Contents", "Resources", "app", "vendor");

const systemPrefixes = ["/usr/lib/", "/System/Library/"];
const homebrewPrefixes = ["/opt/homebrew/", "/usr/local/"];
const binaries = [
  { name: "node", target: join(nodeRoot, "bin", "node"), libDir: nodeLibDir, patch: true },
  { name: "pdftoppm", target: join(ocrBinDir, "pdftoppm"), libDir: ocrLibDir, patch: true },
  { name: "tesseract", target: join(ocrBinDir, "tesseract"), libDir: ocrLibDir, patch: true }
];
const tessdataFiles = ["deu.traineddata", "eng.traineddata"];
const copiedLibraries = new Map();

if (process.platform !== "darwin") {
  throw new Error("This script can only vendor the macOS runtime on macOS.");
}

await resetVendor();
for (const binary of binaries) {
  await copyBinary(binary);
}
for (const binary of binaries.filter((item) => item.patch)) {
  await collectAndPatchDependencies(binary.target, binary.libDir);
  await patchMachO(binary.target, "bin");
}
await signPatchedFiles();
await copyTessdata();
await mirrorVendorIntoAppBundle();

console.log(`Vendored macOS runtime for ${platformKey}.`);

async function resetVendor() {
  await rm(nodeRoot, { recursive: true, force: true });
  await rm(ocrRoot, { recursive: true, force: true });
  await mkdir(join(nodeRoot, "bin"), { recursive: true });
  await mkdir(nodeLibDir, { recursive: true });
  await mkdir(ocrBinDir, { recursive: true });
  await mkdir(ocrLibDir, { recursive: true });
  await mkdir(tessdataDir, { recursive: true });
}

async function copyBinary(binary) {
  const source = await resolveCommand(binary.name);
  await mkdir(dirname(binary.target), { recursive: true });
  await copyFile(source, binary.target);
  await chmod(binary.target, 0o755);
}

async function resolveCommand(command) {
  const { stdout } = await execFile("/bin/zsh", ["-lc", `command -v ${command}`]);
  return realpath(stdout.trim());
}

async function collectAndPatchDependencies(filePath, targetLibDir) {
  const deps = await readDependencies(filePath);
  for (const dep of deps) {
    const source = await resolveHomebrewDependency(dep);
    if (!source) continue;

    const libraryName = basename(source);
    const target = join(targetLibDir, libraryName);
    const libraryKey = target;
    if (!copiedLibraries.has(libraryKey)) {
      copiedLibraries.set(libraryKey, target);
      await copyFile(source, target);
      await chmod(target, 0o644);
      await collectAndPatchDependencies(target, targetLibDir);
      await patchMachO(target, "lib");
    }
  }
}

async function readDependencies(filePath) {
  const { stdout } = await execFile("otool", ["-L", filePath]);
  return stdout
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean)
    .filter((dep) => !dep.startsWith(systemPrefixes[0]) && !dep.startsWith(systemPrefixes[1]));
}

async function resolveHomebrewDependency(dep) {
  if (dep.startsWith("@rpath/") || dep.startsWith("@loader_path/") || dep.startsWith("@executable_path/")) {
    const libraryName = basename(dep);
    return findHomebrewLibrary(libraryName);
  }

  if (homebrewPrefixes.some((prefix) => dep.startsWith(prefix))) {
    return realpath(dep);
  }

  return null;
}

async function findHomebrewLibrary(libraryName) {
  const candidates = [
    join("/opt/homebrew/lib", libraryName),
    join("/usr/local/lib", libraryName),
    join("/opt/homebrew/opt/icu4c@78/lib", libraryName),
    join("/opt/homebrew/opt/icu4c/lib", libraryName),
    join("/usr/local/opt/icu4c@78/lib", libraryName),
    join("/usr/local/opt/icu4c/lib", libraryName)
  ];

  for (const candidate of candidates) {
    try {
      return await realpath(candidate);
    } catch {
      // Try the next common Homebrew location.
    }
  }

  try {
    const { stdout } = await execFile("/bin/zsh", [
      "-lc",
      `find -L /opt/homebrew/opt /usr/local/opt -name ${JSON.stringify(libraryName)} -print -quit 2>/dev/null`
    ]);
    const found = stdout.trim();
    if (found) return realpath(found);
  } catch {
    // Keep the explicit error below when Homebrew search paths are unavailable.
  }

  throw new Error(`Could not resolve ${libraryName} from Homebrew libraries.`);
}

async function patchMachO(filePath, kind) {
  const deps = await readDependencies(filePath);
  const loaderReference = kind === "bin" ? "@loader_path/../lib" : "@loader_path";

  for (const dep of deps) {
    const source = await resolveHomebrewDependency(dep);
    if (!source) continue;

    const libraryName = basename(source);
    await execFile("install_name_tool", [
      "-change",
      dep,
      `${loaderReference}/${libraryName}`,
      filePath
    ]);
  }

  if (kind === "lib") {
    await execFile("install_name_tool", ["-id", `@loader_path/${basename(filePath)}`, filePath]);
  }
}

async function signPatchedFiles() {
  const files = [
    ...binaries.filter((item) => item.patch).map((item) => item.target),
    ...copiedLibraries.values()
  ];

  for (const filePath of files) {
    await execFile("codesign", ["--force", "--sign", "-", filePath]);
  }
}

async function copyTessdata() {
  const tessdataRoot = process.env.TESSDATA_PREFIX || "/opt/homebrew/share/tessdata";
  for (const fileName of tessdataFiles) {
    await copyFile(join(tessdataRoot, fileName), join(tessdataDir, fileName));
  }
}

async function mirrorVendorIntoAppBundle() {
  await rm(appVendorRoot, { recursive: true, force: true });
  await copyDir(vendorRoot, appVendorRoot);
}

async function copyDir(source, target) {
  await mkdir(target, { recursive: true });
  await execFile("ditto", [source, target]);
}
