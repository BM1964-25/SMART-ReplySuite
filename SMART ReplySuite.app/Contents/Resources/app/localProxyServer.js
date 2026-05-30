import http from "node:http";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const PORT = Number(process.env.PORT || 8173);
const HOST = "127.0.0.1";
const ROOT = fileURLToPath(new URL(".", import.meta.url));
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const execFileAsync = promisify(execFile);
const OCR_MIN_TEXT_LENGTH = 120;
const OCR_MAX_PAGES = Number(process.env.SMART_OCR_MAX_PAGES || 20);
const OCR_DPI = Number(process.env.SMART_OCR_DPI || 220);
const OCR_LANGUAGES = process.env.SMART_OCR_LANGUAGES || "deu+eng";
const POPPLER_PDFTOPPM_CANDIDATES = getBinaryCandidates("SMART_PDFTOPPM_PATH", "pdftoppm");
const TESSERACT_CANDIDATES = getBinaryCandidates("SMART_TESSERACT_PATH", "tesseract", { usesTessdata: true });

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

export const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "OPTIONS") {
      response.writeHead(204, getCorsHeaders(request));
      response.end();
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/anthropic/messages") {
      await proxyAnthropicRequest(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/license/verify") {
      await verifyLicense(request, response);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/source/extract") {
      await extractSourceFile(request, response);
      return;
    }

    if (request.method === "GET") {
      await serveStatic(url.pathname, response);
      return;
    }

    sendJson(response, 405, { error: { message: "Methode nicht erlaubt." } }, request);
  } catch (error) {
    sendJson(response, 500, { error: { message: error.message || "Interner Serverfehler." } }, request);
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.warn(`SMART ReplySuite API-Proxy läuft bereits unter http://${HOST}:${PORT}`);
    openBrowserIfRequested();
    return;
  }
  console.error(error);
});

export function startServer() {
  if (server.listening) return server;
  server.listen(PORT, HOST, () => {
    console.log(`SMART ReplySuite läuft unter http://${HOST}:${PORT}`);
    openBrowserIfRequested();
  });
  return server;
}

function openBrowserIfRequested() {
  if (process.env.OPEN_BROWSER !== "1") return;
  const url = `http://${HOST}:${PORT}`;

  if (process.platform === "darwin") {
    execFile("open", [url], () => {});
    return;
  }

  if (process.platform === "win32") {
    execFile("cmd", ["/c", "start", "", url], () => {});
    return;
  }

  execFile("xdg-open", [url], () => {});
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  startServer();
}

async function proxyAnthropicRequest(request, response) {
  const apiKey = request.headers["x-api-key"];

  if (!apiKey || Array.isArray(apiKey)) {
    sendJson(response, 401, { error: { message: "Anthropic API-Key fehlt." } }, request);
    return;
  }

  const body = await readRequestBody(request);
  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": ANTHROPIC_VERSION,
      "x-api-key": apiKey
    },
    body
  });

  const payload = await upstream.text();
  response.writeHead(upstream.status, {
    ...getCorsHeaders(request),
    "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
  });
  response.end(payload);
}

async function extractSourceFile(request, response) {
  const fileName = decodeURIComponent(String(request.headers["x-file-name"] || "quelle").slice(0, 180));
  const extension = getExtension(String(request.headers["x-file-extension"] || fileName));
  const buffer = await readRequestBuffer(request);
  let text = "";

  if (!buffer.length) {
    sendJson(response, 400, { error: { message: "Die Datei enthält keine lesbaren Daten." } }, request);
    return;
  }

  if (extension === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value || "";
  } else if (extension === "pdf") {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    text = result.text || "";

    if (normalizeExtractedText(text).length < OCR_MIN_TEXT_LENGTH) {
      text = await extractPdfTextWithOcr(buffer, fileName);
    }
  } else {
    sendJson(response, 415, { error: { message: "Dieses Format wird vom lokalen Dateiimport nicht unterstützt." } }, request);
    return;
  }

  const normalizedText = normalizeExtractedText(text);
  if (!normalizedText) {
    sendJson(response, 422, {
      error: {
        message: extension === "pdf"
          ? "Aus dieser PDF konnte kein Text extrahiert werden. Für gescannte PDFs werden Poppler (pdftoppm) und Tesseract benötigt."
          : "Aus dieser Datei konnte kein Text extrahiert werden."
      }
    }, request);
    return;
  }

  sendJson(response, 200, {
    fileName,
    extension,
    text: normalizedText,
    characters: normalizedText.length
  }, request);
}

async function verifyLicense(request, response) {
  const body = JSON.parse(await readRequestBody(request) || "{}");
  const licenseKey = String(body.licenseKey || "").trim().toUpperCase();
  const email = String(body.email || "").trim().toLowerCase();

  if (licenseKey === "SMART-DEMO-2026-LOCAL") {
    sendJson(response, 200, {
      valid: true,
      plan: "Demo",
      email,
      expiresAt: "2026-12-31",
      activations: { used: 1, max: 3 }
    }, request);
    return;
  }

  sendJson(response, 402, {
    valid: false,
    message: "Lizenz nicht aktiv. In Produktion prüft die Lizenz-API Stripe-Kauf, Laufzeit und Aktivierungen."
  }, request);
}

async function extractPdfTextWithOcr(buffer, fileName) {
  const tempDir = await mkdtemp(join(tmpdir(), "smart-replysuite-ocr-"));
  const pdfPath = join(tempDir, sanitizeTempFileName(fileName || "source.pdf"));
  const imagePrefix = join(tempDir, "page");

  try {
    await writeFile(pdfPath, buffer);
    await execFirstAvailable(POPPLER_PDFTOPPM_CANDIDATES, [
      "-r",
      String(OCR_DPI),
      "-png",
      "-f",
      "1",
      "-l",
      String(OCR_MAX_PAGES),
      pdfPath,
      imagePrefix
    ], { timeout: 120000, maxBuffer: 1024 * 1024 * 8 });

    const imageFiles = (await readdir(tempDir))
      .filter((entry) => /^page-\d+\.png$/i.test(entry))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (!imageFiles.length) return "";

    const pages = [];
    for (const imageFile of imageFiles) {
      const imagePath = join(tempDir, imageFile);
      const { stdout } = await execFirstAvailable(TESSERACT_CANDIDATES, [
        imagePath,
        "stdout",
        "-l",
        OCR_LANGUAGES,
        "--psm",
        "6"
      ], { timeout: 120000, maxBuffer: 1024 * 1024 * 8 });
      const pageText = normalizeExtractedText(stdout);
      if (pageText) pages.push(pageText);
    }

    return pages.join("\n\n");
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error("OCR ist noch nicht eingerichtet. Bitte ein App-Paket mit OCR-Werkzeugen verwenden oder die Pfade über SMART_PDFTOPPM_PATH und SMART_TESSERACT_PATH setzen.");
    }
    throw new Error(`OCR konnte diese PDF nicht verarbeiten: ${error.message || "Unbekannter Fehler"}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function serveStatic(pathname, response) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const target = normalize(join(ROOT, safePath));

  if (!target.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(target);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(target)] || "application/octet-stream"
    });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function readRequestBuffer(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function getExtension(fileName) {
  return String(fileName || "").split(".").pop().toLowerCase();
}

function getBinaryCandidates(envName, binaryName, options = {}) {
  const executable = process.platform === "win32" ? `${binaryName}.exe` : binaryName;
  const bundledRoot = join(ROOT, "vendor", "ocr");
  const platformDir = `${process.platform}-${process.arch}`;
  const platformOnlyDir = process.platform;
  const bundledCandidates = [
    getBundledBinaryCandidate(join(bundledRoot, platformDir), executable, options),
    getBundledBinaryCandidate(join(bundledRoot, platformOnlyDir), executable, options),
    getBundledBinaryCandidate(join(ROOT, "bin", platformDir), executable, options),
    getBundledBinaryCandidate(join(ROOT, "bin", platformOnlyDir), executable, options)
  ];

  return [
    process.env[envName] ? { path: process.env[envName] } : null,
    ...bundledCandidates,
    { path: executable },
    { path: binaryName },
    { path: `/opt/homebrew/bin/${binaryName}` },
    { path: `/usr/local/bin/${binaryName}` },
    process.platform === "win32" && binaryName === "tesseract"
      ? { path: "C:\\Program Files\\Tesseract-OCR\\tesseract.exe" }
      : null
  ].filter(Boolean);
}

function getBundledBinaryCandidate(toolRoot, executable, options) {
  const candidate = { path: join(toolRoot, "bin", executable) };
  if (options.usesTessdata) {
    candidate.env = { TESSDATA_PREFIX: join(toolRoot, "tessdata") };
  }
  return candidate;
}

async function execFirstAvailable(candidates, args, options) {
  let lastMissingError = null;
  for (const candidate of candidates) {
    const command = typeof candidate === "string" ? candidate : candidate.path;
    const env = typeof candidate === "string" ? null : candidate.env;
    try {
      return await execFileAsync(command, args, env ? { ...options, env: { ...process.env, ...env } } : options);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      lastMissingError = error;
    }
  }

  const error = new Error(lastMissingError?.message || "OCR-Werkzeug nicht gefunden.");
  error.code = "ENOENT";
  throw error;
}

function sanitizeTempFileName(fileName) {
  const normalized = String(fileName || "source.pdf").replace(/[/\\:]/g, "-");
  return normalized.toLowerCase().endsWith(".pdf") ? normalized : `${normalized}.pdf`;
}

function normalizeExtractedText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/^--\s*\d+\s+of\s+\d+\s*--$/gim, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getCorsHeaders(request) {
  const origin = request?.headers?.origin;
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key, x-api-key, X-File-Name, X-File-Extension",
    "Vary": "Origin"
  };
}

function sendJson(response, status, payload, request = null) {
  response.writeHead(status, {
    ...getCorsHeaders(request),
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}
