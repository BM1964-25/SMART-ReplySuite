const {
  requestClaudeMailResponse = async () => {
    throw new Error("Der KI-Client konnte nicht geladen werden. Bitte Seite neu laden oder den lokalen Server prüfen.");
  },
  testClaudeConnection = async () => {
    throw new Error("Der KI-Client konnte nicht geladen werden. Bitte Seite neu laden oder den lokalen Server prüfen.");
  }
} = window.SMART_AI || {};
const {
  clearLicenseSession = () => {},
  loadStoredLicense = () => ({ key: "", email: "", active: false }),
  normalizeLicenseKey = (key = "") => key.trim().toUpperCase(),
  saveLicense = () => {},
  setLicenseSessionActive = () => {},
  verifyLicense = async () => {
    throw new Error("Der Lizenz-Client konnte nicht geladen werden. Bitte Seite neu laden oder den lokalen Server prüfen.");
  }
} = window.SMART_LICENSE || {};

const MAX_CHARS = 50000;
const RECOMMENDED_CHARS = 12000;
const STORAGE_KEY = "smart-mailresponse-anthropic-key";
const SESSION_KEY = "smart-mailresponse-session-active";
const DATA_KEY = "smart-mailresponse-data";
const SIDEBAR_COLLAPSED_KEY = "smart-mailresponse-sidebar-collapsed";
const DEFAULT_PROXY_URL = "/api/anthropic/messages";
const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-20250514";

const responseTypes = [
  "Zustimmung",
  "Ablehnung",
  "Rückfrage",
  "Terminabstimmung",
  "Angebotsantwort",
  "Beschwerdebeantwortung",
  "Eskalationsentschärfung",
  "Nachforderung",
  "Projektkommunikation",
  "Individuelle Antwort"
];

const tones = [
  "sachlich",
  "freundlich",
  "verbindlich",
  "diplomatisch",
  "direkt",
  "souverän",
  "wertschätzend",
  "bestimmt",
  "entschärfend",
  "geschäftlich-formell"
];

const focuses = [
  "Kernaussagen",
  "Handlungsempfehlungen",
  "Konfliktvermeidung",
  "Verbindlichkeit",
  "Entscheidungsvorbereitung",
  "Nächste Schritte",
  "Risikominimierung"
];

const apiKeyState = {
  value: "",
  isVisible: false,
  isConnected: false,
  isBusy: false
};

const licenseState = {
  key: "",
  email: "",
  active: false,
  isBusy: false
};

const dataState = loadData();
let currentResponseText = "Noch keine Antwort erstellt.";
let currentResponseData = null;
let currentMode = "reply";
let currentSections = [];
let editingTemplateId = null;
let editingStyleProfileId = null;
let selectedStyleAccents = Array.isArray(dataState.companyStyleAccents) ? [...dataState.companyStyleAccents] : [];
let selectedStyleNoGos = Array.isArray(dataState.companyStyleNoGos) ? [...dataState.companyStyleNoGos] : [];

const elements = {
  appShell: document.querySelector("#appShell"),
  sidebarToggle: document.querySelector("#sidebarToggle"),
  navItems: document.querySelectorAll(".nav-item"),
  viewPanels: document.querySelectorAll("[data-view-panel]"),
  viewTargets: document.querySelectorAll("[data-view-target]"),
  subject: document.querySelector("#subject"),
  inboundMessage: document.querySelector("#inboundMessage"),
  notes: document.querySelector("#notes"),
  responseGoal: document.querySelector("#responseGoal"),
  extraHints: document.querySelector("#extraHints"),
  responseType: document.querySelector("#responseType"),
  tone: document.querySelector("#tone"),
  length: document.querySelector("#length"),
  focus: document.querySelector("#focus"),
  language: document.querySelector("#language"),
  companyStyle: document.querySelector("#companyStyle"),
  modeButtons: document.querySelectorAll("[data-mode]"),
  contextTabButtons: document.querySelectorAll("[data-context-tab]"),
  contextPanels: document.querySelectorAll("[data-context-panel]"),
  setupAlert: document.querySelector("#setupAlert"),
  templatePicker: document.querySelector("#templatePicker"),
  styleProfilePicker: document.querySelector("#styleProfilePicker"),
  styleProfileName: document.querySelector("#styleProfileName"),
  saveStyleProfileBtn: document.querySelector("#saveStyleProfileBtn"),
  styleProfileList: document.querySelector("#styleProfileList"),
  generateBtn: document.querySelector("#generateBtn"),
  responseOutput: document.querySelector("#responseOutput"),
  qualityStrip: document.querySelector("#qualityStrip"),
  resultTabs: document.querySelector("#resultTabs"),
  charCount: document.querySelector("#charCount"),
  mailQuality: document.querySelector("#mailQuality"),
  copyAllBtn: document.querySelector("#copyAllBtn"),
  saveTemplateFromOutputBtn: document.querySelector("#saveTemplateFromOutputBtn"),
  saveHistoryBtn: document.querySelector("#saveHistoryBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  templateTitle: document.querySelector("#templateTitle"),
  templateCategory: document.querySelector("#templateCategory"),
  templateTags: document.querySelector("#templateTags"),
  templateBody: document.querySelector("#templateBody"),
  templateFavorite: document.querySelector("#templateFavorite"),
  addTemplateBtn: document.querySelector("#addTemplateBtn"),
  templateList: document.querySelector("#templateList"),
  templateSearch: document.querySelector("#templateSearch"),
  templateTagFilter: document.querySelector("#templateTagFilter"),
  libraryList: document.querySelector("#libraryList"),
  librarySearch: document.querySelector("#librarySearch"),
  libraryTagFilter: document.querySelector("#libraryTagFilter"),
  historyList: document.querySelector("#historyList"),
  historySearch: document.querySelector("#historySearch"),
  historyTypeFilter: document.querySelector("#historyTypeFilter"),
  styleNotes: document.querySelector("#styleNotes"),
  styleAccentButtons: document.querySelectorAll("[data-style-accent]"),
  styleNoGoButtons: document.querySelectorAll("[data-style-nogo]"),
  defaultLanguage: document.querySelector("#defaultLanguage"),
  defaultTone: document.querySelector("#defaultTone"),
  exportDataBtn: document.querySelector("#exportDataBtn"),
  importDataBtn: document.querySelector("#importDataBtn"),
  importDataInput: document.querySelector("#importDataInput"),
  clearDataBtn: document.querySelector("#clearDataBtn"),
  diagnosticsOutput: document.querySelector("#diagnosticsOutput"),
  apiKey: document.querySelector("#apiKey"),
  rememberKey: document.querySelector("#rememberKey"),
  toggleKey: document.querySelector("#toggleKey"),
  apiKeyCard: document.querySelector("#apiKeyCard"),
  keyHint: document.querySelector("#keyHint"),
  keyFeedback: document.querySelector("#keyFeedback"),
  connectionBadge: document.querySelector("#connectionBadge"),
  saveKeyBtn: document.querySelector("#saveKeyBtn"),
  connectBtn: document.querySelector("#connectBtn"),
  testConnectionBtn: document.querySelector("#testConnectionBtn"),
  disconnectBtn: document.querySelector("#disconnectBtn"),
  licenseKey: document.querySelector("#licenseKey"),
  licenseEmail: document.querySelector("#licenseEmail"),
  saveLicenseBtn: document.querySelector("#saveLicenseBtn"),
  verifyLicenseBtn: document.querySelector("#verifyLicenseBtn"),
  licenseBadge: document.querySelector("#licenseBadge"),
  licenseFeedback: document.querySelector("#licenseFeedback"),
  statusText: document.querySelector("#statusText"),
  statusDot: document.querySelector("#statusDot"),
  sidebarLicenseStatus: document.querySelector("#sidebarLicenseStatus"),
  sidebarApiStatus: document.querySelector("#sidebarApiStatus"),
  sidebarStorageStatus: document.querySelector("#sidebarStorageStatus"),
  metricToday: document.querySelector("#metricToday"),
  metricTemplates: document.querySelector("#metricTemplates"),
  metricFocus: document.querySelector("#metricFocus"),
  metricApi: document.querySelector("#metricApi")
};

window.SMART_APP = {
  showView,
  toggleSidebar
};

init();

function init() {
  applySidebarState(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  fillSelect(elements.responseType, responseTypes);
  fillSelect(elements.tone, tones, "geschäftlich-formell");
  fillSelect(elements.focus, focuses, "Konfliktvermeidung");

  const savedKey = localStorage.getItem(STORAGE_KEY);
  const savedLicense = loadStoredLicense();
  licenseState.key = savedLicense.key;
  licenseState.email = savedLicense.email;
  licenseState.active = savedLicense.active;

  if (savedKey && isPlausibleApiKey(savedKey)) {
    apiKeyState.value = savedKey;
    apiKeyState.isConnected = sessionStorage.getItem(SESSION_KEY) === "true";
    elements.rememberKey.checked = true;
  } else if (savedKey) {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  elements.styleNotes.value = dataState.companyStyleNotes || "";
  elements.defaultLanguage.value = dataState.settings.defaultLanguage || "Deutsch";
  elements.defaultTone.value = dataState.settings.defaultTone || "geschäftlich-formell";
  elements.language.value = dataState.settings.defaultLanguage || "Deutsch";
  elements.tone.value = dataState.settings.defaultTone || "geschäftlich-formell";
  elements.companyStyle.value = dataState.companyStyle || "modern";
  document.querySelector(`input[name="stylePreset"][value="${dataState.companyStyle || "modern"}"]`)?.click();
  renderStyleChips();

  bindEvents();
  updateCharacterCount();
  renderApiKeyComponent();
  renderLicenseComponent();
  renderLists();
  updateDashboard();
  setKeyFeedback(apiKeyState.value ? "Gespeicherter API-Key geladen." : "Noch kein gültiger API-Key gespeichert.", apiKeyState.value ? "success" : "info");
  setStatus(apiKeyState.value ? "Bereit" : "API-Key fehlt", apiKeyState.value ? "ready" : "warn");
}

function bindEvents() {
  elements.navItems.forEach((item) => {
    if (item.dataset.view) item.addEventListener("click", () => showView(item.dataset.view));
  });
  elements.viewTargets.forEach((item) => item.addEventListener("click", () => showView(item.dataset.viewTarget)));
  elements.modeButtons.forEach((button) => button.addEventListener("click", () => setComposerMode(button.dataset.mode)));
  elements.contextTabButtons.forEach((button) => button.addEventListener("click", () => showContextPanel(button.dataset.contextTab)));
  elements.templatePicker.addEventListener("change", applySelectedTemplate);
  elements.resultTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-result-tab]");
    if (button) showResultSection(button.dataset.resultTab);
  });
  elements.historySearch.addEventListener("input", renderHistory);
  elements.historyTypeFilter.addEventListener("change", renderHistory);
  elements.inboundMessage.addEventListener("input", updateCharacterCount);
  elements.generateBtn.addEventListener("click", handleGenerate);
  elements.copyAllBtn.addEventListener("click", copyAll);
  elements.saveTemplateFromOutputBtn.addEventListener("click", saveCurrentAsTemplate);
  elements.saveHistoryBtn.addEventListener("click", saveCurrentHistory);
  elements.resetBtn.addEventListener("click", resetComposer);
  elements.addTemplateBtn.addEventListener("click", addTemplate);
  elements.templateSearch.addEventListener("input", renderTemplates);
  elements.templateTagFilter.addEventListener("change", renderTemplates);
  elements.librarySearch.addEventListener("input", renderLibrary);
  elements.libraryTagFilter.addEventListener("change", renderLibrary);
  document.querySelectorAll('input[name="stylePreset"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) elements.companyStyle.value = input.value;
    });
  });
  elements.defaultLanguage.addEventListener("change", saveSettings);
  elements.defaultTone.addEventListener("change", saveSettings);
  elements.clearDataBtn.addEventListener("click", clearWorkingData);
  elements.saveKeyBtn.addEventListener("click", handleSaveKey);
  elements.connectBtn.addEventListener("click", handleConnect);
  elements.testConnectionBtn.addEventListener("click", handleConnectionTest);
  elements.disconnectBtn.addEventListener("click", handleDisconnect);
  elements.toggleKey.addEventListener("click", () => {
    apiKeyState.isVisible = !apiKeyState.isVisible;
    renderApiKeyComponent();
  });
  elements.apiKey.addEventListener("input", () => {
    apiKeyState.value = elements.apiKey.value.trim();
    apiKeyState.isConnected = false;
    sessionStorage.removeItem(SESSION_KEY);
    renderApiKeyComponent({ keepInput: true });
    updateDashboard();
    setStatus(apiKeyState.value ? "Bereit" : "API-Key fehlt", apiKeyState.value ? "ready" : "warn");
  });
  elements.apiKey.addEventListener("focus", () => {
    if (!apiKeyState.isVisible && apiKeyState.value && elements.apiKey.value === maskApiKey(apiKeyState.value)) {
      elements.apiKey.value = "";
      elements.apiKey.type = "password";
      elements.apiKey.placeholder = "Neuen API-Key eingeben oder Auge zum Anzeigen nutzen";
      setKeyFeedback("Bearbeitungsmodus aktiv. Bestehender Key bleibt erhalten, bis du speicherst.", "info");
    }
  });
  elements.apiKey.addEventListener("blur", () => {
    if (!elements.apiKey.value.trim() && apiKeyState.value) renderApiKeyComponent();
  });
  elements.rememberKey.addEventListener("change", () => {
    persistApiKey();
    setKeyFeedback(elements.rememberKey.checked ? "Lokale Speicherung aktiviert." : "Lokale Speicherung deaktiviert.", "info");
  });
  elements.saveLicenseBtn.addEventListener("click", handleSaveLicense);
  elements.verifyLicenseBtn.addEventListener("click", handleVerifyLicense);
  elements.licenseKey.addEventListener("input", () => {
    licenseState.active = false;
    clearLicenseSession();
    renderLicenseComponent();
  });
}

function toggleSidebar() {
  const isCollapsed = !elements.appShell.classList.contains("is-sidebar-collapsed");
  applySidebarState(isCollapsed);
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
}

function applySidebarState(isCollapsed) {
  elements.appShell.classList.toggle("is-sidebar-collapsed", isCollapsed);
  elements.sidebarToggle.setAttribute("aria-pressed", String(isCollapsed));
  elements.sidebarToggle.setAttribute("aria-label", isCollapsed ? "Sidebar ausklappen" : "Sidebar einklappen");
}

async function handleGenerate() {
  const inboundMessage = elements.inboundMessage.value.trim();

  if (!ensureApiKeyForAction()) return;

  if (!inboundMessage) {
    setStatus("Nachricht fehlt", "danger");
    setResponseOutput("Bitte füge zuerst die eingegangene E-Mail ein.", true);
    return;
  }

  if (inboundMessage.length > MAX_CHARS) {
    setStatus("Nachricht zu lang", "danger");
    setResponseOutput(`Die Nachricht ist zu groß. Bitte auf maximal ${MAX_CHARS.toLocaleString("de-DE")} Zeichen kürzen.`, true);
    return;
  }

  elements.generateBtn.disabled = true;
  persistApiKey();

  try {
    setStatus("Analyse läuft", "warn");
    const result = await requestClaudeMailResponse({
      apiKey: apiKeyState.value,
      proxyUrl: DEFAULT_PROXY_URL,
      model: DEFAULT_CLAUDE_MODEL,
      subject: elements.subject.value.trim(),
      inboundMessage,
      notes: elements.notes.value.trim(),
      responseGoal: elements.responseGoal.value.trim(),
      extraHints: elements.extraHints.value.trim(),
      responseType: elements.responseType.value,
      tone: elements.tone.value,
      length: elements.length.value,
      focus: elements.focus.value,
      language: elements.language.value,
      companyStyle: elements.companyStyle.value,
      companyStyleNotes: elements.styleNotes.value.trim(),
      companyStyleAccents: getSelectedStyleChips("accent"),
      companyStyleNoGos: getSelectedStyleChips("nogo"),
      mode: currentMode
    });

    setResponseOutput(result);
    saveCurrentHistory({ silent: true });
    setStatus("Ausgabe fertig", "ready");
  } catch (error) {
    handleApiFailure(error);
    setResponseOutput([
      "Die Anfrage konnte nicht verarbeitet werden.",
      "",
      error.message,
      "",
      getApiRecoveryHint(error)
    ].join("\n"), true);
  } finally {
    elements.generateBtn.disabled = false;
  }
}

function setResponseOutput(text, isPlaceholder = false) {
  currentResponseData = isPlaceholder ? null : normalizeResponsePayload(text);
  currentResponseText = isPlaceholder ? text : responseDataToText(currentResponseData);
  elements.responseOutput.classList.toggle("is-placeholder", isPlaceholder);
  elements.responseOutput.innerHTML = isPlaceholder ? renderEmptyOutput(text) : renderResponseData(currentResponseData);
  elements.resultTabs.hidden = isPlaceholder || currentSections.length === 0;
  elements.qualityStrip.hidden = isPlaceholder || currentSections.length === 0;
  if (!isPlaceholder) renderQualityStrip(currentResponseData);
}

function normalizeResponsePayload(value) {
  if (typeof value === "object" && value !== null) return value;
  const raw = String(value || "").trim();
  const jsonCandidate = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonCandidate);
    return {
      analysis: {
        topic: parsed.analysis?.topic || "",
        senderExpectation: parsed.analysis?.senderExpectation || "",
        risks: toArray(parsed.analysis?.risks),
        strategy: parsed.analysis?.strategy || "",
        openPoints: toArray(parsed.analysis?.openPoints)
      },
      responses: {
        main: parsed.responses?.main || "",
        alternative: parsed.responses?.alternative || "",
        short: parsed.responses?.short || "",
        diplomatic: parsed.responses?.diplomatic || ""
      },
      quality: {
        conflict: parsed.quality?.conflict || "offen",
        politeness: parsed.quality?.politeness || "offen",
        clarity: parsed.quality?.clarity || "offen",
        commitment: parsed.quality?.commitment || "offen",
        notes: toArray(parsed.quality?.notes)
      }
    };
  } catch {
    return markdownToResponseData(raw);
  }
}

function markdownToResponseData(markdownText) {
  const sections = splitSections(markdownText);
  const getSection = (title) => sections.find((section) => section.title.toLowerCase().includes(title))?.body.trim() || "";
  return {
    analysis: {
      topic: getSection("analyse") || "Analyse nicht strukturiert erkannt.",
      senderExpectation: "",
      risks: [],
      strategy: "",
      openPoints: []
    },
    responses: {
      main: getSection("hauptantwort") || markdownText,
      alternative: getSection("alternative"),
      short: getSection("kürzere") || getSection("kurz"),
      diplomatic: getSection("diplomatische") || getSection("diplomatisch")
    },
    quality: {
      conflict: "offen",
      politeness: "offen",
      clarity: "offen",
      commitment: "offen",
      notes: [getSection("qualität")].filter(Boolean)
    }
  };
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
}

function responseDataToText(data) {
  return [
    "## KI-Analyse",
    `Worum geht es? ${data.analysis.topic || "-"}`,
    `Erwartung des Absenders: ${data.analysis.senderExpectation || "-"}`,
    `Risiken/Konflikte: ${formatPlainList(data.analysis.risks)}`,
    `Empfohlene Strategie: ${data.analysis.strategy || "-"}`,
    `Offene Punkte: ${formatPlainList(data.analysis.openPoints)}`,
    "",
    "## Hauptantwort",
    data.responses.main || "-",
    "",
    "## Alternative Antwort",
    data.responses.alternative || "-",
    "",
    "## Kürzere Version",
    data.responses.short || "-",
    "",
    "## Diplomatische Version",
    data.responses.diplomatic || "-",
    "",
    "## Qualitätsbewertung",
    `Konflikt: ${data.quality.conflict || "offen"}`,
    `Höflichkeit: ${data.quality.politeness || "offen"}`,
    `Klarheit: ${data.quality.clarity || "offen"}`,
    `Verbindlichkeit: ${data.quality.commitment || "offen"}`,
    `Hinweise: ${formatPlainList(data.quality.notes)}`
  ].join("\n");
}

function formatPlainList(items) {
  return items?.length ? items.join("; ") : "-";
}

function renderResponseData(data) {
  currentSections = [
    {
      title: "KI-Analyse",
      body: [
        `**Worum geht es?** ${data.analysis.topic || "-"}`,
        `**Erwartung des Absenders:** ${data.analysis.senderExpectation || "-"}`,
        `**Risiken/Konflikte:** ${formatPlainList(data.analysis.risks)}`,
        `**Empfohlene Strategie:** ${data.analysis.strategy || "-"}`,
        `**Offene Punkte:** ${formatPlainList(data.analysis.openPoints)}`
      ].join("\n\n")
    },
    { title: "Hauptantwort", body: data.responses.main || "-" },
    { title: "Alternative Antwort", body: data.responses.alternative || "-" },
    { title: "Kürzere Version", body: data.responses.short || "-" },
    { title: "Diplomatische Version", body: data.responses.diplomatic || "-" },
    {
      title: "Qualitätsbewertung",
      body: [
        `Konflikt: ${data.quality.conflict || "offen"}`,
        `Höflichkeit: ${data.quality.politeness || "offen"}`,
        `Klarheit: ${data.quality.clarity || "offen"}`,
        `Verbindlichkeit: ${data.quality.commitment || "offen"}`,
        `Hinweise: ${formatPlainList(data.quality.notes)}`
      ].join("\n")
    }
  ];

  renderResultTabs(currentSections);
  return currentSections.map((section, index) => `
    <article class="response-section${index === 0 ? " is-active" : ""}" data-result-section="${escapeHtml(section.title)}">
      <h3>${escapeHtml(section.title)}</h3>
      <button type="button" class="copy-section" data-copy-section="${escapeHtml(section.title)}">Kopieren</button>
      ${renderMarkdown(section.body)}
    </article>
  `).join("");
}

function renderStructuredOutput(markdownText) {
  const sections = splitSections(markdownText);
  currentSections = sections;
  if (!sections.length) {
    currentSections = [{ title: "Antwort", body: markdownText }];
  }

  renderResultTabs(currentSections);
  return currentSections.map((section, index) => `
    <article class="response-section${index === 0 ? " is-active" : ""}" data-result-section="${escapeHtml(section.title)}">
      <h3>${escapeHtml(section.title)}</h3>
      <button type="button" class="copy-section" data-copy-section="${escapeHtml(section.title)}">Kopieren</button>
      ${renderMarkdown(section.body)}
    </article>
  `).join("");
}

function renderEmptyOutput(message) {
  currentSections = [];
  elements.resultTabs.hidden = true;
  elements.qualityStrip.hidden = true;
  return `
    <div class="empty-output">
      <strong>${escapeHtml(message)}</strong>
      <p>Füge eine E-Mail ein, wähle Antworttyp und Tonalität, und erstelle dann eine professionelle Antwort mit Analyse, Varianten und Qualitätscheck.</p>
    </div>
  `;
}

function renderResultTabs(sections) {
  elements.resultTabs.innerHTML = sections.map((section, index) => `
    <button type="button" class="${index === 0 ? "is-active" : ""}" data-result-tab="${escapeHtml(section.title)}">${escapeHtml(shortSectionTitle(section.title))}</button>
  `).join("");
}

function showResultSection(title) {
  elements.resultTabs.querySelectorAll("[data-result-tab]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.resultTab === title);
  });
  elements.responseOutput.querySelectorAll("[data-result-section]").forEach((section) => {
    section.classList.toggle("is-active", section.dataset.resultSection === title);
  });
}

function shortSectionTitle(title) {
  return title
    .replace("KI-Analyse", "Analyse")
    .replace("Alternative Antwort", "Alternative")
    .replace("Kürzere Version", "Kurz")
    .replace("Diplomatische Version", "Diplomatisch")
    .replace("Qualitätsbewertung", "Qualität");
}

function renderQualityStrip(data) {
  const scores = {
    conflict: data.quality?.conflict || "offen",
    politeness: data.quality?.politeness || "offen",
    clarity: data.quality?.clarity || "offen",
    commitment: data.quality?.commitment || "offen"
  };

  updateScoreBadge("conflict", "Konflikt", scores.conflict);
  updateScoreBadge("politeness", "Höflichkeit", scores.politeness);
  updateScoreBadge("clarity", "Klarheit", scores.clarity);
  updateScoreBadge("commitment", "Verbindlichkeit", scores.commitment);
}

function updateScoreBadge(key, label, value) {
  const badge = elements.qualityStrip.querySelector(`[data-score="${key}"]`);
  if (!badge) return;
  badge.textContent = `${label}: ${value}`;
  const normalized = String(value).toLowerCase();
  const state = normalized === "hoch" || normalized === "prüfen"
    ? "warn"
    : ["gut", "sehr gut", "niedrig"].includes(normalized) ? "success" : "";
  badge.className = `score-badge ${state}`;
}

function splitSections(markdownText) {
  const lines = markdownText.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[1].trim(), body: "" };
    } else if (current) {
      current.body += `${line}\n`;
    }
  }

  if (current) sections.push(current);
  return sections.filter((section) => section.body.trim());
}

function renderMarkdown(markdownText) {
  const lines = markdownText.split(/\r?\n/);
  const blocks = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(`<li>${formatInline(lines[index].trim().replace(/^[-*]\s+/, ""))}</li>`);
        index += 1;
      }
      index -= 1;
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(`<li>${formatInline(lines[index].trim().replace(/^\d+\.\s+/, ""))}</li>`);
        index += 1;
      }
      index -= 1;
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const paragraphLines = [line];
    while (
      index + 1 < lines.length &&
      lines[index + 1].trim() &&
      !/^[-*]\s+/.test(lines[index + 1].trim()) &&
      !/^\d+\.\s+/.test(lines[index + 1].trim()) &&
      !/^##\s+/.test(lines[index + 1].trim())
    ) {
      paragraphLines.push(lines[index + 1].trim());
      index += 1;
    }
    blocks.push(`<p>${formatInline(paragraphLines.join(" "))}</p>`);
  }

  return blocks.join("");
}

function formatInline(value) {
  return escapeHtml(value).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

document.addEventListener("click", async (event) => {
  const copyButton = event.target.closest("[data-copy-section]");
  if (!copyButton) return;

  const article = copyButton.closest(".response-section");
  const title = article.querySelector("h3")?.textContent || "";
  const text = article.innerText.replace("Kopieren", "").trim();
  await navigator.clipboard.writeText(text);
  setStatus(`${title} kopiert`, "ready");
});

function updateCharacterCount() {
  const count = elements.inboundMessage.value.length;
  elements.charCount.textContent = `${count.toLocaleString("de-DE")} Zeichen`;

  if (!count) {
    elements.mailQuality.textContent = "Noch keine Nachricht";
    elements.mailQuality.className = "quality-badge";
    return;
  }

  if (count > MAX_CHARS) {
    elements.mailQuality.textContent = "Nachricht zu groß";
    elements.mailQuality.className = "quality-badge danger";
    return;
  }

  if (count > RECOMMENDED_CHARS) {
    elements.mailQuality.textContent = "Sehr lang, ggf. kürzen";
    elements.mailQuality.className = "quality-badge warn";
    return;
  }

  if (count < 80) {
    elements.mailQuality.textContent = "Sehr kurz";
    elements.mailQuality.className = "quality-badge warn";
    return;
  }

  elements.mailQuality.textContent = "Ausreichender Kontext";
  elements.mailQuality.className = "quality-badge success";
}

function addTemplate() {
  const title = elements.templateTitle.value.trim();
  const body = elements.templateBody.value.trim();
  if (!title || !body) {
    setStatus("Vorlage unvollständig", "danger");
    return;
  }

  if (editingTemplateId) {
    const item = dataState.templates.find((template) => template.id === editingTemplateId);
    if (item) {
      item.title = title;
      item.category = elements.templateCategory.value.trim() || "Allgemein";
      item.tags = parseTags(elements.templateTags.value);
      item.body = body;
      item.favorite = elements.templateFavorite.checked;
      item.updatedAt = new Date().toISOString();
    }
    editingTemplateId = null;
    elements.addTemplateBtn.textContent = "Vorlage speichern";
  } else {
    dataState.templates.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title,
    category: elements.templateCategory.value.trim() || "Allgemein",
    tags: parseTags(elements.templateTags.value),
    body,
    favorite: elements.templateFavorite.checked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  elements.templateTitle.value = "";
  elements.templateCategory.value = "";
  elements.templateTags.value = "";
  elements.templateBody.value = "";
  elements.templateFavorite.checked = false;
  saveData();
  renderLists();
  updateDashboard();
  setStatus("Vorlage gespeichert", "ready");
}

function saveCurrentAsTemplate() {
  if (!currentResponseText || currentResponseText === "Noch keine Antwort erstellt.") return;
  dataState.templates.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: elements.subject.value.trim() || "Antwortvorschlag",
    category: elements.responseType.value,
    tags: parseTags([elements.responseType.value, elements.tone.value, elements.focus.value].join(",")),
    body: currentResponseText,
    favorite: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  saveData();
  renderLists();
  updateDashboard();
  setStatus("Als Vorlage gespeichert", "ready");
}

function saveCurrentHistory(options = {}) {
  if (!currentResponseText || currentResponseText === "Noch keine Antwort erstellt.") return;

  dataState.history.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    subject: elements.subject.value.trim() || "Ohne Betreff",
    responseType: elements.responseType.value,
    tone: elements.tone.value,
    focus: elements.focus.value,
    createdAt: new Date().toISOString(),
    inboundMessage: elements.inboundMessage.value.trim(),
    inputPreview: elements.inboundMessage.value.trim().slice(0, 420),
    output: currentResponseText,
    outputData: currentResponseData
  });
  dataState.history = dataState.history.slice(0, 50);
  saveData();
  renderLists();
  updateDashboard();
  if (!options.silent) setStatus("Im Verlauf gespeichert", "ready");
}

function renderLists() {
  renderTemplates();
  renderLibrary();
  renderHistory();
  renderTemplatePicker();
  renderStyleProfilePicker();
  renderStyleProfileList();
  renderTemplateTagFilters();
  renderHistoryFilter();
}

function renderTemplates() {
  const items = filterTemplates(dataState.templates, elements.templateSearch.value, elements.templateTagFilter.value);
  if (!items.length) {
    elements.templateList.innerHTML = `<div class="empty-state">Noch keine Vorlagen gespeichert.</div>`;
    return;
  }

  elements.templateList.innerHTML = items.map((item) => dataCard(item, "template")).join("");
}

function renderLibrary() {
  const items = filterTemplates(dataState.templates, elements.librarySearch.value, elements.libraryTagFilter.value)
    .sort((a, b) => Number(b.favorite) - Number(a.favorite));
  if (!items.length) {
    elements.libraryList.innerHTML = `<div class="empty-state">Die Bibliothek füllt sich mit gespeicherten Vorlagen und Favoriten.</div>`;
    return;
  }

  elements.libraryList.innerHTML = items.map((item) => dataCard(item, "library")).join("");
}

function filterTemplates(templates, queryValue, tagValue) {
  const query = queryValue?.trim().toLowerCase() || "";
  const tag = tagValue || "";
  return templates.filter((item) => {
    const tags = getTemplateTags(item);
    const haystack = [item.title, item.category, item.body, tags.join(" ")].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (!tag || tags.includes(tag));
  });
}

function renderTemplateTagFilters() {
  const currentTemplateTag = elements.templateTagFilter.value;
  const currentLibraryTag = elements.libraryTagFilter.value;
  const tags = [...new Set(dataState.templates.flatMap(getTemplateTags))].sort((a, b) => a.localeCompare(b, "de"));
  const options = [`<option value="">Alle Tags</option>`, ...tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`)].join("");
  elements.templateTagFilter.innerHTML = options;
  elements.libraryTagFilter.innerHTML = options;
  if (tags.includes(currentTemplateTag)) elements.templateTagFilter.value = currentTemplateTag;
  if (tags.includes(currentLibraryTag)) elements.libraryTagFilter.value = currentLibraryTag;
}

function renderHistory() {
  const query = elements.historySearch?.value?.trim().toLowerCase() || "";
  const type = elements.historyTypeFilter?.value || "";
  const items = dataState.history.filter((item) => {
    const haystack = [item.subject, item.responseType, item.focus, item.inputPreview, item.output].join(" ").toLowerCase();
    return (!query || haystack.includes(query)) && (!type || item.responseType === type);
  });

  if (!items.length) {
    elements.historyList.innerHTML = `<div class="empty-state">Noch kein Verlauf vorhanden.</div>`;
    return;
  }

  elements.historyList.innerHTML = items.map((item) => `
    <article class="data-card">
      <h3>${escapeHtml(item.subject)}</h3>
      <small>${formatDate(item.createdAt)} · ${escapeHtml(item.responseType)} · ${escapeHtml(item.focus)}</small>
      <p>${escapeHtml(item.inputPreview || "")}</p>
      <div class="card-actions">
        <button type="button" data-reuse-history="${item.id}">Erneut verwenden</button>
        <button type="button" data-copy-history="${item.id}">Antwort kopieren</button>
        <button type="button" data-delete-history="${item.id}" class="danger-action">Löschen</button>
      </div>
    </article>
  `).join("");
}

function renderTemplatePicker() {
  const currentValue = elements.templatePicker.value;
  elements.templatePicker.innerHTML = [
    `<option value="">Keine Vorlage ausgewählt</option>`,
    ...dataState.templates.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.favorite ? `Favorit: ${item.title}` : item.title)}</option>`)
  ].join("");
  if (dataState.templates.some((item) => item.id === currentValue)) {
    elements.templatePicker.value = currentValue;
  }
}

function renderStyleProfilePicker() {
  const currentValue = elements.styleProfilePicker.value;
  const profiles = dataState.styleProfiles || [];
  elements.styleProfilePicker.innerHTML = [
    `<option value="">Kein Stilprofil zugrunde gelegt</option>`,
    ...profiles.map((profile) => `<option value="${escapeHtml(profile.id)}">${escapeHtml(profile.name)}</option>`)
  ].join("");
  if (profiles.some((profile) => profile.id === currentValue)) {
    elements.styleProfilePicker.value = currentValue;
  }
}

function renderStyleProfileList() {
  const profiles = dataState.styleProfiles || [];
  if (!profiles.length) {
    elements.styleProfileList.innerHTML = `<div class="empty-state">Noch keine Stilprofile gespeichert.</div>`;
    return;
  }

  elements.styleProfileList.innerHTML = profiles.map((profile) => `
    <article class="data-card compact-card style-profile-card">
      <div class="style-profile-title">
        <h3>${escapeHtml(profile.name)}</h3>
        <small>${escapeHtml(profile.companyStyle)} · ${(profile.companyStyleAccents || []).length} Akzente · ${(profile.companyStyleNoGos || []).length} No-Gos</small>
      </div>
      <div class="card-actions">
        <button type="button" data-apply-style-profile="${escapeHtml(profile.id)}">Anwenden</button>
        <button type="button" data-edit-style-profile="${escapeHtml(profile.id)}">Bearbeiten</button>
        <button type="button" data-duplicate-style-profile="${escapeHtml(profile.id)}">Duplizieren</button>
        <button type="button" data-delete-style-profile="${escapeHtml(profile.id)}" class="danger-action">Löschen</button>
      </div>
    </article>
  `).join("");
}

function renderHistoryFilter() {
  const currentValue = elements.historyTypeFilter.value;
  const types = [...new Set(dataState.history.map((item) => item.responseType).filter(Boolean))];
  elements.historyTypeFilter.innerHTML = [
    `<option value="">Alle Antworttypen</option>`,
    ...types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`)
  ].join("");
  if (types.includes(currentValue)) elements.historyTypeFilter.value = currentValue;
}

function dataCard(item, type) {
  const tags = getTemplateTags(item);
  return `
    <article class="data-card">
      <h3>${escapeHtml(item.favorite ? `★ ${item.title}` : item.title)}</h3>
      <small>${escapeHtml(item.category)} · ${formatDate(item.createdAt)}</small>
      ${tags.length ? `<div class="tag-list">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
      <p>${escapeHtml(item.body.slice(0, 360))}${item.body.length > 360 ? "..." : ""}</p>
      <div class="card-actions">
        <button type="button" data-use-template="${item.id}">In Antwort übernehmen</button>
        <button type="button" data-copy-template="${item.id}">Kopieren</button>
        ${type === "template" ? `<button type="button" data-edit-template="${item.id}">Bearbeiten</button>` : ""}
        ${type === "template" ? `<button type="button" data-toggle-favorite="${item.id}">${item.favorite ? "Favorit entfernen" : "Favorit"}</button>` : ""}
        ${type === "template" ? `<button type="button" data-delete-template="${item.id}" class="danger-action">Löschen</button>` : ""}
      </div>
    </article>
  `;
}

function parseTags(value) {
  return [...new Set(String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.length > 32 ? tag.slice(0, 32) : tag))];
}

function getTemplateTags(item) {
  return Array.isArray(item.tags) ? item.tags : parseTags(item.tags || "");
}

function applySelectedTemplate() {
  const item = dataState.templates.find((template) => template.id === elements.templatePicker.value);
  if (!item) return;
  applyTemplateToComposer(item);
  setStatus("Vorlage übernommen", "ready");
}

function applyTemplateToComposer(item) {
  const existing = elements.extraHints.value.trim();
  elements.extraHints.value = existing ? `${existing}\n\nVorlage: ${item.body}` : item.body;
  showContextPanel("hints");
}

function setComposerMode(mode) {
  currentMode = mode === "optimize" ? "optimize" : "reply";
  elements.modeButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.mode === currentMode));
  elements.generateBtn.textContent = currentMode === "optimize" ? "Entwurf optimieren" : "Antwortvorschläge erstellen";
  elements.inboundMessage.placeholder = currentMode === "optimize"
    ? "Eingegangene E-Mail und vorhandenen Antwortentwurf hier einfügen..."
    : "E-Mail aus Outlook, Gmail oder einem anderen Mailprogramm hier einfügen...";
}

function showContextPanel(name) {
  elements.contextTabButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.contextTab === name));
  elements.contextPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.contextPanel === name));
}

document.addEventListener("click", async (event) => {
  const templateId = event.target.dataset.copyTemplate;
  const useTemplateId = event.target.dataset.useTemplate;
  const editTemplateId = event.target.dataset.editTemplate;
  const favoriteId = event.target.dataset.toggleFavorite;
  const deleteTemplateId = event.target.dataset.deleteTemplate;
  const historyId = event.target.dataset.copyHistory;
  const reuseHistoryId = event.target.dataset.reuseHistory;
  const deleteHistoryId = event.target.dataset.deleteHistory;
  const applyStyleProfileId = event.target.dataset.applyStyleProfile;
  const editStyleProfileId = event.target.dataset.editStyleProfile;
  const duplicateStyleProfileId = event.target.dataset.duplicateStyleProfile;
  const deleteStyleProfileId = event.target.dataset.deleteStyleProfile;

  if (templateId) {
    const item = dataState.templates.find((template) => template.id === templateId);
    if (item) await navigator.clipboard.writeText(item.body);
    setStatus("Vorlage kopiert", "ready");
  }

  if (useTemplateId) {
    const item = dataState.templates.find((template) => template.id === useTemplateId);
    if (item) {
      applyTemplateToComposer(item);
      showView("composer");
      setStatus("Vorlage übernommen", "ready");
    }
  }

  if (editTemplateId) {
    const item = dataState.templates.find((template) => template.id === editTemplateId);
    if (item) {
      editingTemplateId = item.id;
      elements.templateTitle.value = item.title;
      elements.templateCategory.value = item.category;
      elements.templateTags.value = getTemplateTags(item).join(", ");
      elements.templateBody.value = item.body;
      elements.templateFavorite.checked = Boolean(item.favorite);
      elements.addTemplateBtn.textContent = "Vorlage aktualisieren";
      showView("templates");
      setStatus("Vorlage im Bearbeitungsmodus", "ready");
    }
  }

  if (favoriteId) {
    const item = dataState.templates.find((template) => template.id === favoriteId);
    if (item) item.favorite = !item.favorite;
    saveData();
    renderLists();
  }

  if (deleteTemplateId) {
    const index = dataState.templates.findIndex((template) => template.id === deleteTemplateId);
    if (index >= 0) dataState.templates.splice(index, 1);
    if (editingTemplateId === deleteTemplateId) editingTemplateId = null;
    saveData();
    renderLists();
    updateDashboard();
    setStatus("Vorlage gelöscht", "ready");
  }

  if (historyId) {
    const item = dataState.history.find((history) => history.id === historyId);
    if (item) await navigator.clipboard.writeText(item.output);
    setStatus("Antwort kopiert", "ready");
  }

  if (reuseHistoryId) {
    const item = dataState.history.find((history) => history.id === reuseHistoryId);
    if (item) {
      elements.subject.value = item.subject || "";
      elements.inboundMessage.value = item.inboundMessage || item.inputPreview || "";
      elements.responseType.value = item.responseType || elements.responseType.value;
      elements.tone.value = item.tone || elements.tone.value;
      elements.focus.value = item.focus || elements.focus.value;
      if (item.outputData) setResponseOutput(item.outputData);
      else if (item.output) setResponseOutput(item.output);
      updateCharacterCount();
      showView("composer");
      setStatus("Verlauf übernommen", "ready");
    }
  }

  if (deleteHistoryId) {
    const index = dataState.history.findIndex((history) => history.id === deleteHistoryId);
    if (index >= 0) dataState.history.splice(index, 1);
    saveData();
    renderLists();
    updateDashboard();
    setStatus("Verlaufseintrag gelöscht", "ready");
  }

  if (applyStyleProfileId) applyStyleProfile(applyStyleProfileId);
  if (editStyleProfileId) editStyleProfile(editStyleProfileId);
  if (duplicateStyleProfileId) duplicateStyleProfile(duplicateStyleProfileId);
  if (deleteStyleProfileId) deleteStyleProfile(deleteStyleProfileId);
});

async function copyAll() {
  if (!currentResponseText || currentResponseText === "Noch keine Antwort erstellt.") return;
  await navigator.clipboard.writeText(currentResponseText);
  setStatus("Alles kopiert", "ready");
}

function resetComposer() {
  elements.subject.value = "";
  elements.inboundMessage.value = "";
  elements.notes.value = "";
  elements.responseGoal.value = "";
  elements.extraHints.value = "";
  setResponseOutput("Noch keine Antwort erstellt.", true);
  updateCharacterCount();
  setStatus(apiKeyState.value ? "Bereit" : "API-Key fehlt", apiKeyState.value ? "ready" : "warn");
}

function renderStyleChips() {
  elements.styleAccentButtons.forEach((button) => {
    button.classList.toggle("is-active", selectedStyleAccents.includes(button.dataset.styleAccent));
  });
  elements.styleNoGoButtons.forEach((button) => {
    button.classList.toggle("is-active", selectedStyleNoGos.includes(button.dataset.styleNogo));
  });
}

function getSelectedStyleChips(type) {
  const selector = type === "accent" ? "[data-style-accent].is-active" : "[data-style-nogo].is-active";
  const key = type === "accent" ? "styleAccent" : "styleNogo";
  return [...document.querySelectorAll(selector)].map((button) => button.dataset[key]);
}

function applyStyleProfile(id) {
  const profile = dataState.styleProfiles.find((item) => item.id === id);
  if (!profile) return;
  document.querySelector(`input[name="stylePreset"][value="${profile.companyStyle}"]`)?.click();
  elements.companyStyle.value = profile.companyStyle || elements.companyStyle.value;
  elements.styleNotes.value = profile.companyStyleNotes || "";
  selectedStyleAccents = [...(profile.companyStyleAccents || [])];
  selectedStyleNoGos = [...(profile.companyStyleNoGos || [])];
  renderStyleChips();
  elements.styleProfilePicker.value = id;
  editingStyleProfileId = null;
  elements.saveStyleProfileBtn.textContent = "Als Stilprofil speichern";
  setStatus("Stilprofil zugrunde gelegt", "ready");
}

function editStyleProfile(id) {
  const profile = dataState.styleProfiles.find((item) => item.id === id);
  if (!profile) return;
  applyStyleProfile(id);
  elements.styleProfileName.value = profile.name;
  editingStyleProfileId = id;
  elements.saveStyleProfileBtn.textContent = "Stilprofil aktualisieren";
  showView("style");
  setStatus("Stilprofil im Bearbeitungsmodus", "ready");
}

function getUniqueStyleProfileCopyName(baseName) {
  let candidate = `${baseName} Kopie`;
  let counter = 2;
  while (dataState.styleProfiles.some((profile) => profile.name.toLowerCase() === candidate.toLowerCase())) {
    candidate = `${baseName} Kopie ${counter}`;
    counter += 1;
  }
  return candidate;
}

function duplicateStyleProfile(id) {
  const source = dataState.styleProfiles.find((item) => item.id === id);
  if (!source) return;
  const copy = {
    ...source,
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name: getUniqueStyleProfileCopyName(source.name)
  };
  dataState.styleProfiles.unshift(copy);
  saveData();
  renderStyleProfilePicker();
  renderStyleProfileList();
  applyStyleProfile(copy.id);
  elements.styleProfileName.value = copy.name;
  editingStyleProfileId = copy.id;
  elements.saveStyleProfileBtn.textContent = "Stilprofil aktualisieren";
  showView("style");
  setStatus("Stilprofil dupliziert", "ready");
}

function deleteStyleProfile(id) {
  const index = dataState.styleProfiles.findIndex((item) => item.id === id);
  if (index < 0) return;
  dataState.styleProfiles.splice(index, 1);
  if (editingStyleProfileId === id) {
    editingStyleProfileId = null;
    elements.saveStyleProfileBtn.textContent = "Als Stilprofil speichern";
  }
  saveData();
  renderStyleProfilePicker();
  renderStyleProfileList();
  if (elements.styleProfilePicker.value === id) elements.styleProfilePicker.value = "";
  setStatus("Stilprofil gelöscht", "ready");
}

function saveSettings() {
  dataState.settings.defaultLanguage = elements.defaultLanguage.value;
  dataState.settings.defaultTone = elements.defaultTone.value;
  elements.language.value = elements.defaultLanguage.value;
  elements.tone.value = elements.defaultTone.value;
  saveData();
  setStatus("Einstellungen gespeichert", "ready");
}

function exportData() {
  const fileName = `smart-mailresponse-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(dataState, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus(".json-Export erstellt", "ready");
  if (elements.diagnosticsOutput) {
    renderDiagnostics();
    elements.diagnosticsOutput.insertAdjacentHTML(
      "afterbegin",
      `<div class="diagnostic-row ready"><strong>Letzter Export</strong><span>${escapeHtml(fileName)} im Download-Ordner</span></div>`
    );
  }
}

async function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const isJsonFile = file.name.toLowerCase().endsWith(".json") || file.type === "application/json";
    if (!isJsonFile) {
      throw new Error("Bitte eine .json-Datei auswählen.");
    }
    const imported = JSON.parse(await file.text());
    dataState.templates = Array.isArray(imported.templates) ? imported.templates : dataState.templates;
    dataState.history = Array.isArray(imported.history) ? imported.history : dataState.history;
    dataState.companyStyle = imported.companyStyle || dataState.companyStyle;
    dataState.companyStyleNotes = imported.companyStyleNotes || dataState.companyStyleNotes;
    dataState.companyStyleAccents = Array.isArray(imported.companyStyleAccents) ? imported.companyStyleAccents : dataState.companyStyleAccents;
    dataState.companyStyleNoGos = Array.isArray(imported.companyStyleNoGos) ? imported.companyStyleNoGos : dataState.companyStyleNoGos;
    dataState.styleProfiles = Array.isArray(imported.styleProfiles) ? imported.styleProfiles : dataState.styleProfiles;
    selectedStyleAccents = [...dataState.companyStyleAccents];
    selectedStyleNoGos = [...dataState.companyStyleNoGos];
    dataState.settings = { ...dataState.settings, ...(imported.settings || {}) };
    saveData();
    renderLists();
    renderStyleChips();
    updateDashboard();
    renderDiagnostics();
    setStatus(".json-Datei importiert", "ready");
    elements.diagnosticsOutput.insertAdjacentHTML(
      "afterbegin",
      `<div class="diagnostic-row ready"><strong>Letzter Import</strong><span>${escapeHtml(file.name)}</span></div>`
    );
  } catch (error) {
    setStatus("Import fehlgeschlagen", "danger");
    elements.diagnosticsOutput.innerHTML = `<div class="diagnostic-row danger"><strong>Import</strong><span>${escapeHtml(error.message)}</span></div>`;
  } finally {
    elements.importDataInput.value = "";
  }
}

function clearWorkingData() {
  dataState.templates = [];
  dataState.history = [];
  saveData();
  renderLists();
  updateDashboard();
  renderDiagnostics();
  setStatus("Arbeitsdaten geleert", "ready");
}

function showView(name) {
  elements.viewPanels.forEach((panel) => panel.classList.toggle("is-visible", panel.dataset.viewPanel === name));
  elements.navItems.forEach((item) => item.classList.toggle("is-active", item.dataset.view === name));
}

function handleSaveLicense() {
  const key = normalizeLicenseKey(elements.licenseKey.value);
  const email = elements.licenseEmail.value.trim().toLowerCase();
  licenseState.key = key;
  licenseState.email = email;
  licenseState.active = false;
  clearLicenseSession();
  saveLicense({ key, email });
  setLicenseFeedback(key && email ? "Lizenzdaten gespeichert. Bitte Lizenz prüfen." : "Bitte Lizenzschlüssel und E-Mail-Adresse eingeben.", key && email ? "info" : "error");
  renderLicenseComponent();
}

async function handleVerifyLicense() {
  licenseState.isBusy = true;
  renderLicenseComponent();
  setLicenseFeedback("Lizenz wird geprüft...", "loading");

  try {
    const result = await verifyLicense({
      key: elements.licenseKey.value || licenseState.key,
      email: elements.licenseEmail.value || licenseState.email
    });
    licenseState.key = result.licenseKey;
    licenseState.email = result.email;
    licenseState.active = true;
    saveLicense({ key: result.licenseKey, email: result.email });
    setLicenseSessionActive();
    setLicenseFeedback(`Lizenz aktiv (${result.plan}, gültig bis ${result.expiresAt}).`, "success");
  } catch (error) {
    licenseState.active = false;
    clearLicenseSession();
    setLicenseFeedback(error.message, "error");
  } finally {
    licenseState.isBusy = false;
    renderLicenseComponent();
  }
}

function handleSaveKey() {
  const candidate = normalizeKeyInput(elements.apiKey.value);

  if (!candidate && !apiKeyState.value) {
    setKeyFeedback("Bitte gib zuerst einen Anthropic API-Key ein.", "error");
    setStatus("API-Key fehlt", "warn");
    showView("license");
    return;
  }

  if (candidate) {
    if (!isPlausibleApiKey(candidate)) {
      apiKeyState.isConnected = false;
      sessionStorage.removeItem(SESSION_KEY);
      setKeyFeedback("Der eingegebene Wert sieht nicht wie ein Anthropic API-Key aus. Er muss mit sk-ant- beginnen.", "error");
      setStatus("API-Key fehlt", "warn");
      return;
    }
    apiKeyState.value = candidate;
  }

  apiKeyState.isConnected = false;
  sessionStorage.removeItem(SESSION_KEY);
  persistApiKey();
  renderApiKeyComponent();
  updateDashboard();
  setKeyFeedback(elements.rememberKey.checked ? "API-Key lokal gespeichert." : "API-Key für diese Sitzung übernommen.", "success");
  setStatus("Bereit", "ready");
}

async function handleConnect() {
  if (!ensureApiKeyForAction()) return;
  setApiBusy(true, "Verbindung wird vorbereitet...");
  await shortPause();
  apiKeyState.isConnected = true;
  sessionStorage.setItem(SESSION_KEY, "true");
  setApiBusy(false);
  renderApiKeyComponent();
  updateDashboard();
  setKeyFeedback("Verbindung aktiv. Für technische Prüfung nutze Verbindung überprüfen.", "success");
  setStatus("Bereit", "ready");
}

async function handleConnectionTest() {
  if (!ensureApiKeyForAction()) return;
  setApiBusy(true, "Verbindung wird überprüft...");
  setStatus("Analyse läuft", "warn");

  try {
    await testClaudeConnection({
      apiKey: apiKeyState.value,
      proxyUrl: DEFAULT_PROXY_URL,
      model: DEFAULT_CLAUDE_MODEL
    });
    apiKeyState.isConnected = true;
    sessionStorage.setItem(SESSION_KEY, "true");
    setKeyFeedback("Verbindung erfolgreich geprüft.", "success");
    setStatus("Bereit", "ready");
  } catch (error) {
    handleApiFailure(error);
  } finally {
    setApiBusy(false);
    renderApiKeyComponent();
    updateDashboard();
  }
}

function handleDisconnect() {
  apiKeyState.isConnected = false;
  sessionStorage.removeItem(SESSION_KEY);
  renderApiKeyComponent();
  updateDashboard();
  setKeyFeedback("Verbindung getrennt. Der gespeicherte API-Key bleibt erhalten.", "info");
  setStatus(apiKeyState.value ? "Bereit" : "API-Key fehlt", apiKeyState.value ? "ready" : "warn");
}

function renderApiKeyComponent(options = {}) {
  if (!options.keepInput) {
    elements.apiKey.type = apiKeyState.isVisible || apiKeyState.value ? "text" : "password";
    elements.apiKey.value = apiKeyState.isVisible ? apiKeyState.value : maskApiKey(apiKeyState.value);
    elements.apiKey.placeholder = apiKeyState.value ? "" : "sk-ant-...";
  }

  elements.toggleKey.setAttribute("aria-pressed", String(apiKeyState.isVisible));
  elements.toggleKey.setAttribute("aria-label", apiKeyState.isVisible ? "API-Key verbergen" : "API-Key anzeigen");
  elements.toggleKey.classList.toggle("is-active", apiKeyState.isVisible);
  elements.connectionBadge.textContent = apiKeyState.isConnected ? "Verbunden" : "Nicht verbunden";
  elements.connectionBadge.classList.toggle("is-connected", apiKeyState.isConnected);
  elements.connectBtn.textContent = apiKeyState.isConnected ? "Verbindung OK" : "Verbindung";
  elements.connectBtn.classList.toggle("is-connected", apiKeyState.isConnected);
  elements.connectBtn.disabled = apiKeyState.isBusy || !apiKeyState.value;
  elements.testConnectionBtn.disabled = apiKeyState.isBusy || !apiKeyState.value;
  elements.disconnectBtn.disabled = apiKeyState.isBusy || !apiKeyState.isConnected;
  elements.saveKeyBtn.disabled = apiKeyState.isBusy;
  elements.keyHint.textContent = apiKeyState.value
    ? "Gespeicherter Key wird teilweise angezeigt. Das Auge zeigt den vollständigen Schlüssel."
    : "Gib deinen Anthropic API-Key ein. Ohne Key wird keine KI-Anfrage gesendet.";
  updateSystemHealth();
}

function renderLicenseComponent() {
  if (licenseState.key && elements.licenseKey.value !== licenseState.key) elements.licenseKey.value = licenseState.key;
  if (licenseState.email && elements.licenseEmail.value !== licenseState.email) elements.licenseEmail.value = licenseState.email;
  elements.licenseBadge.textContent = licenseState.active ? "Lizenz aktiv" : "Nicht aktiviert";
  elements.licenseBadge.classList.toggle("is-connected", licenseState.active);
  elements.saveLicenseBtn.disabled = licenseState.isBusy;
  elements.verifyLicenseBtn.disabled = licenseState.isBusy || !elements.licenseKey.value.trim();
  updateSystemHealth();
}

function ensureApiKeyForAction() {
  const candidate = normalizeKeyInput(elements.apiKey.value);
  if (candidate) {
    if (!isPlausibleApiKey(candidate)) {
      setKeyFeedback("Der eingegebene Wert sieht nicht wie ein Anthropic API-Key aus. Bitte prüfen und speichern.", "error");
      setStatus("API-Key fehlt", "warn");
      return false;
    }
    apiKeyState.value = candidate;
  }

  if (!apiKeyState.value || !isPlausibleApiKey(apiKeyState.value)) {
    setKeyFeedback("Bitte speichere zuerst einen Anthropic API-Key.", "error");
    setStatus("API-Key fehlt", "warn");
    showView("license");
    renderApiKeyComponent();
    return false;
  }

  return true;
}

function handleApiFailure(error) {
  apiKeyState.isConnected = false;
  sessionStorage.removeItem(SESSION_KEY);
  setStatus("Fehler bei API-Anfrage", "danger");
  setKeyFeedback(getApiFeedbackMessage(error), "error");
  showView("license");
}

function getApiFeedbackMessage(error) {
  if (error?.code === "INVALID_API_KEY") return "API-Key ungültig. Bitte neuen Schlüssel einfügen, speichern und Verbindung überprüfen.";
  return `Verbindung fehlgeschlagen: ${error.message}`;
}

function getApiRecoveryHint(error) {
  if (error?.code === "INVALID_API_KEY") return "Hinweis: Ersetze den API-Key im Bereich Lizenz & API und prüfe danach die Verbindung.";
  if (error?.code === "PERMISSION_DENIED") return "Hinweis: Prüfe im Anthropic-Konto, ob dein Key Zugriff auf Claude Sonnet 4 hat.";
  return "Hinweis: Prüfe lokalen Proxy, Internetverbindung, API-Key und Modellzugriff.";
}

function setApiBusy(isBusy, message = "") {
  apiKeyState.isBusy = isBusy;
  if (message) setKeyFeedback(message, "loading");
  renderApiKeyComponent({ keepInput: true });
}

function persistApiKey() {
  if (elements.rememberKey.checked && apiKeyState.value) {
    localStorage.setItem(STORAGE_KEY, apiKeyState.value);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function setStatus(label, type) {
  elements.statusText.textContent = label === "Bereit" ? "System bereit" : label;
  elements.statusDot.classList.toggle("warn", type === "warn");
  elements.statusDot.classList.toggle("danger", type === "danger");
  updateSystemHealth();
}

function setKeyFeedback(message, type) {
  elements.keyFeedback.textContent = message;
  elements.keyFeedback.classList.remove("success", "error", "loading", "info");
  elements.keyFeedback.classList.add(type);
}

function setLicenseFeedback(message, type) {
  elements.licenseFeedback.textContent = message;
  elements.licenseFeedback.classList.remove("success", "error", "loading", "info");
  elements.licenseFeedback.classList.add(type);
}

function updateDashboard() {
  const today = new Date().toDateString();
  elements.metricToday.textContent = dataState.history.filter((item) => new Date(item.createdAt).toDateString() === today).length;
  elements.metricTemplates.textContent = dataState.templates.length;
  elements.metricFocus.textContent = dataState.history[0]?.focus || elements.focus.value || "-";
  elements.metricApi.textContent = apiKeyState.isConnected ? "Verbunden" : apiKeyState.value ? "Bereit" : "Fehlt";
  updateSystemHealth();
  renderDiagnostics();
}

function renderDiagnostics() {
  if (!elements.diagnosticsOutput) return;
  const rows = [
    ["Vorlagen", `${dataState.templates.length} gespeichert`, "success"],
    ["Verlauf", `${dataState.history.length} lokale Vorgänge`, dataState.history.length ? "success" : ""],
    ["API-Key", apiKeyState.value ? "vorhanden" : "fehlt", apiKeyState.value ? "success" : "warn"],
    ["Lizenz", licenseState.active ? "aktiv" : "nicht aktiviert", licenseState.active ? "success" : "warn"],
    ["Speicher", "Browser-Prototyp, Desktop-Blueprint vorhanden", ""]
  ];

  elements.diagnosticsOutput.innerHTML = rows.map(([label, value, state]) => `
    <div class="diagnostic-row ${state}">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(value)}</span>
    </div>
  `).join("");
}

function updateSystemHealth() {
  if (!elements.sidebarApiStatus) return;
  elements.sidebarLicenseStatus.textContent = licenseState.active ? "Aktiv" : "Nicht aktiviert";
  elements.sidebarApiStatus.textContent = apiKeyState.isConnected ? "Verbunden" : apiKeyState.value ? "Gespeichert" : "Fehlt";
  elements.sidebarStorageStatus.textContent = elements.rememberKey?.checked ? "Lokal + Key" : "Lokal";
  elements.setupAlert.hidden = Boolean(apiKeyState.value);
}

function loadData() {
  const fallback = {
    templates: [],
    history: [],
    companyStyle: "modern",
    companyStyleNotes: "",
    companyStyleAccents: [],
    companyStyleNoGos: [],
    styleProfiles: [],
    settings: {
      defaultLanguage: "Deutsch",
      defaultTone: "geschäftlich-formell"
    }
  };

  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(DATA_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

function saveData() {
  localStorage.setItem(DATA_KEY, JSON.stringify(dataState));
}

function fillSelect(select, values, selected = values[0]) {
  select.innerHTML = values.map((value) => `<option${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
}

function maskApiKey(key) {
  if (!key) return "";
  return `${key.slice(0, Math.min(7, key.length))}••••••••`;
}

function normalizeKeyInput(value) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("•")) return "";
  return trimmed;
}

function isPlausibleApiKey(value) {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(value.trim());
}

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shortPause() {
  return new Promise((resolve) => window.setTimeout(resolve, 250));
}
