const LICENSE_STORAGE_KEY = "smart-mailresponse-license-key";
const LICENSE_EMAIL_KEY = "smart-mailresponse-license-email";
const LICENSE_SESSION_KEY = "smart-mailresponse-license-active";
const DEFAULT_LICENSE_ENDPOINT = "/api/license/verify";

export function loadStoredLicense() {
  return {
    key: localStorage.getItem(LICENSE_STORAGE_KEY) || "",
    email: localStorage.getItem(LICENSE_EMAIL_KEY) || "",
    active: sessionStorage.getItem(LICENSE_SESSION_KEY) === "true"
  };
}

export function saveLicense({ key, email }) {
  localStorage.setItem(LICENSE_STORAGE_KEY, normalizeLicenseKey(key));
  localStorage.setItem(LICENSE_EMAIL_KEY, email.trim().toLowerCase());
}

export function clearLicenseSession() {
  sessionStorage.removeItem(LICENSE_SESSION_KEY);
}

export function setLicenseSessionActive() {
  sessionStorage.setItem(LICENSE_SESSION_KEY, "true");
}

export async function verifyLicense({ key, email }, endpoint = DEFAULT_LICENSE_ENDPOINT) {
  const normalizedKey = normalizeLicenseKey(key);
  const normalizedEmail = email.trim().toLowerCase();

  if (!isPlausibleLicenseKey(normalizedKey)) {
    throw createLicenseError("Der Lizenzschlüssel muss im Format SMART-XXXX-XXXX-XXXX vorliegen.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw createLicenseError("Bitte gib die E-Mail-Adresse aus dem Kaufprozess ein.");
  }

  if (location.protocol === "file:") {
    return verifyOfflineDemoLicense(normalizedKey, normalizedEmail);
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        licenseKey: normalizedKey,
        email: normalizedEmail,
        product: "smart-mailresponse",
        deviceId: getDeviceId()
      })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload.valid !== true) {
      throw createLicenseError(payload.message || "Lizenz konnte nicht bestätigt werden.");
    }

    return {
      valid: true,
      licenseKey: normalizedKey,
      email: normalizedEmail,
      plan: payload.plan || "Standard",
      expiresAt: payload.expiresAt || "unbegrenzt",
      activations: payload.activations || null
    };
  } catch (error) {
    if (error.code === "LICENSE_INVALID") throw error;
    throw createLicenseError("Lizenz-API nicht erreichbar. Bitte später erneut prüfen.");
  }
}

export function normalizeLicenseKey(key) {
  return key.trim().toUpperCase();
}

export function isPlausibleLicenseKey(key) {
  return /^SMART-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}

function verifyOfflineDemoLicense(key, email) {
  if (key === "SMART-DEMO-2026-LOCAL") {
    return {
      valid: true,
      licenseKey: key,
      email,
      plan: "Demo",
      expiresAt: "2026-12-31",
      activations: { used: 1, max: 3 }
    };
  }

  throw createLicenseError("Lizenz lokal nicht gültig. Für produktive Verkäufe wird die Lizenz über die Lizenz-API geprüft.");
}

function getDeviceId() {
  const key = "smart-mailresponse-device-id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function createLicenseError(message) {
  const error = new Error(message);
  error.code = "LICENSE_INVALID";
  return error;
}
