import http from "node:http";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

const PORT = Number(process.env.PORT || 8173);
const HOST = "127.0.0.1";
const ROOT = fileURLToPath(new URL(".", import.meta.url));
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

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
  } else {
    sendJson(response, 415, { error: { message: "Dieses Format wird vom lokalen Dateiimport nicht unterstützt." } }, request);
    return;
  }

  const normalizedText = normalizeExtractedText(text);
  if (!normalizedText) {
    sendJson(response, 422, {
      error: {
        message: extension === "pdf"
          ? "Aus dieser PDF konnte kein Text extrahiert werden. Vermutlich handelt es sich um einen Scan ohne Texterkennung."
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
