const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function resolveProxyUrl(proxyUrl) {
  if (proxyUrl) return proxyUrl;
  return window.location.protocol === "file:"
    ? "http://127.0.0.1:8173/api/anthropic/messages"
    : "/api/anthropic/messages";
}

function buildMailResponsePrompts({
  subject,
  inboundMessage,
  notes,
  responseGoal,
  extraHints,
  responseType,
  tone,
  length,
  focus,
  language,
  companyStyle,
  companyStyleNotes = "",
  companyStyleAccents = [],
  companyStyleNoGos = [],
  mode = "reply"
}) {
  const lengthMap = {
    kurz: "Kurz: maximal 120 Wörter, direkt nutzbar.",
    standard: "Standard: 160 bis 260 Wörter mit sauberer Struktur.",
    ausfuehrlich: "Ausführlich: 280 bis 420 Wörter, mit Kontext, Begründung und nächsten Schritten."
  };

  const companyStyleMap = {
    konservativ: "klassisch, präzise, zurückhaltend und formal",
    modern: "klar, effizient, freundlich und zeitgemäß",
    technisch: "faktenorientiert, präzise, fachlich und ohne unnötige Ausschmückung",
    "juristisch vorsichtig": "risikobewusst, nicht zusichernd, differenziert und belastbar",
    managementorientiert: "entscheidungsorientiert, souverän, knapp und verbindlich"
  };

  const focusRules = {
    Ausgewogen: "Berücksichtige Inhalt, Tonalität, nächste Schritte und Risiken ausgewogen, ohne einen einzelnen Schwerpunkt zu überbetonen.",
    Kernaussagen: "Priorisiere die Kernbotschaft, den Zweck der Antwort und die entscheidenden Fakten.",
    Handlungsempfehlungen: "Leite klare nächste Handlungen ab und formuliere sie verbindlich.",
    Konfliktvermeidung: "Reduziere Reibung, vermeide Schuldzuweisungen und deeskaliere konsequent.",
    Verbindlichkeit: "Schaffe klare Zusagen, Grenzen, Fristen und Verantwortlichkeiten.",
    Entscheidungsvorbereitung: "Bereite eine Entscheidung vor, inklusive Optionen, Auswirkungen und fehlender Informationen.",
    "Nächste Schritte": "Formuliere konkrete nächste Schritte mit Reihenfolge und Zuständigkeiten, soweit ableitbar.",
    Risikominimierung: "Vermeide riskante Zusagen, markiere Annahmen und adressiere offene Punkte vorsichtig."
  };

  const isOptimizeMode = mode === "optimize";
  const systemPrompt = [
    isOptimizeMode
      ? "Du bist ein Senior Communication Strategist und optimierst bestehende geschäftliche Antwortentwürfe für E-Mails, Briefe und Schriftverkehr."
      : "Du bist ein Senior Communication Strategist für professionelle schriftliche Geschäftskommunikation per E-Mail, Brief und allgemeinem Schriftverkehr.",
    "Arbeite diskret, präzise, souverän und nutzerorientiert.",
    "Erfinde keine Fakten, Termine, Zusagen, Beträge oder Rechtspositionen.",
    "Kennzeichne offene Punkte, wenn Informationen fehlen.",
    isOptimizeMode
      ? "Verbessere den vorhandenen Entwurf so, dass er direkt als E-Mail, Brief oder Geschäftsschreiben verwendet werden kann."
      : "Formuliere Antworten so, dass sie direkt als E-Mail, Brief oder Geschäftsschreiben verwendet werden können.",
    "Keine generischen KI-Floskeln, keine Meta-Erklärungen vor oder nach der Ausgabe.",
    `Zielsprache: ${language}.`,
    `Antworttyp: ${responseType}.`,
    `Tonalität: ${tone}.`,
    `Länge der Hauptantwort: ${lengthMap[length] || lengthMap.standard}`,
    `Fokus: ${focus}. ${focusRules[focus] || ""}`,
    `Grundstil des Stilprofils: ${companyStyleMap[companyStyle] || companyStyle}.`,
    companyStyleAccents.length ? `Zusätzliche Stilakzente: ${companyStyleAccents.join(", ")}.` : "",
    companyStyleNoGos.length ? `Verbindliche No-Gos: ${companyStyleNoGos.join("; ")}.` : "",
    companyStyleNotes ? `Eigene Stilprofil-Regeln: ${companyStyleNotes}.` : "",
    "Gib ausschließlich valides JSON aus. Keine Markdown-Codeblöcke, keine Einleitung, keine Kommentare.",
    "Das JSON muss exakt diese Struktur haben:",
    "{",
    '  "analysis": {',
    '    "topic": "string",',
    '    "senderExpectation": "string",',
    '    "risks": ["string"],',
    '    "strategy": "string",',
    '    "openPoints": ["string"]',
    "  },",
    '  "responses": {',
    '    "main": "string",',
    '    "alternative": "string",',
    '    "short": "string",',
    '    "diplomatic": "string"',
    "  },",
    '  "quality": {',
    '    "conflict": "niedrig|mittel|hoch",',
    '    "politeness": "niedrig|mittel|hoch|gut|sehr gut",',
    '    "clarity": "niedrig|mittel|hoch|gut|sehr gut",',
    '    "commitment": "niedrig|mittel|hoch|gut|sehr gut",',
    '    "notes": ["string"]',
    "  }",
    "}"
  ].join("\n");

  const userPrompt = [
    isOptimizeMode
      ? "Optimiere den vorhandenen Antwortentwurf auf Basis der eingegangenen Nachricht, des Schreibens und des Nutzerkontexts."
      : "Erstelle professionelle Antwortvorschläge auf Basis dieser Nachricht oder dieses Schreibens.",
    "",
    "Eingaben:",
    `Betreff: ${subject || "nicht angegeben"}`,
    `Antworttyp: ${responseType}`,
    `Tonalität: ${tone}`,
    `Länge der Hauptantwort: ${length}`,
    `Fokus: ${focus}`,
    `Grundstil: ${companyStyle}`,
    `Zusätzliche Stilakzente: ${companyStyleAccents.length ? companyStyleAccents.join(", ") : "keine"}`,
    `No-Gos: ${companyStyleNoGos.length ? companyStyleNoGos.join("; ") : "keine"}`,
    `Eigene Stilregeln: ${companyStyleNotes || "keine"}`,
    `Zielsprache: ${language}`,
    "",
    "Eingegangene Nachricht:",
    inboundMessage,
    "",
    "Eigene Notizen:",
    notes || "keine",
    "",
    "Ziel der Antwort:",
    responseGoal || "nicht angegeben",
    "",
    "Zusätzliche Hinweise:",
    extraHints || "keine",
    "",
    "Analysepflicht:",
    "- Worum geht es?",
    "- Welche Erwartung hat der Absender?",
    "- Gibt es Risiken, Konflikte, Eskalationssignale oder unklare Zusagen?",
    "- Welche Antwortstrategie wird empfohlen?",
    "- Welche offenen Punkte bestehen?",
    "",
    "Antwortpflicht:",
    isOptimizeMode
      ? "- Hauptantwort als optimierte Version des vorhandenen Entwurfs formulieren."
      : "- Hauptantwort direkt verwendbar formulieren.",
    "- Alternative Antwort mit anderer Akzentsetzung formulieren.",
    "- Kürzere Version kompakt und geschäftlich formulieren.",
    "- Diplomatische Version besonders deeskalierend formulieren.",
    "- Qualitätsbewertung mit Konfliktwarnung, Höflichkeit, Klarheit und Verbindlichkeit ausgeben. Verwende klare Werte wie niedrig, mittel, hoch, gut oder sehr gut.",
    "- Keine Fakten ergänzen, die nicht aus Nachricht, Notizen oder Ziel ableitbar sind.",
    "- Antworte ausschließlich als JSON mit der vorgegebenen Struktur."
  ].join("\n");

  return { systemPrompt, userPrompt };
}

async function requestClaudeMailResponse(options) {
  const { systemPrompt, userPrompt } = buildMailResponsePrompts(options);

  const response = await fetch(resolveProxyUrl(options.proxyUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": options.apiKey
    },
    body: JSON.stringify({
      model: options.model || DEFAULT_MODEL,
      max_tokens: resolveTokenBudget(options.length),
      temperature: 0.25,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ]
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createAnthropicError(payload, response.status);
  }

  const textBlocks = Array.isArray(payload.content)
    ? payload.content.filter((block) => block.type === "text").map((block) => block.text)
    : [];

  const result = textBlocks.join("\n\n").trim();
  if (!result) {
    throw new Error("Claude hat keine lesbaren Antwortvorschläge zurückgegeben.");
  }

  return result;
}

async function testClaudeConnection({ apiKey, proxyUrl, model }) {
  const response = await fetch(resolveProxyUrl(proxyUrl), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      max_tokens: 12,
      temperature: 0,
      system: "Antworte ausschließlich mit OK.",
      messages: [{ role: "user", content: "Teste die Verbindung. Antworte nur mit OK." }]
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw createAnthropicError(payload, response.status);
  return true;
}

function resolveTokenBudget(length) {
  if (length === "ausfuehrlich") return 3600;
  if (length === "kurz") return 1800;
  return 2600;
}

function createAnthropicError(payload, status) {
  const rawMessage = payload?.error?.message || payload?.message || `API-Anfrage fehlgeschlagen (${status})`;
  const rawType = payload?.error?.type || "";
  const normalized = `${rawType} ${rawMessage}`.toLowerCase();
  const error = new Error(rawMessage);

  if (status === 401 || normalized.includes("invalid x-api-key") || normalized.includes("authentication")) {
    error.code = "INVALID_API_KEY";
    error.message = "Anthropic hat den API-Key abgelehnt. Bitte prüfe, ob der Schlüssel vollständig und aktiv ist.";
    return error;
  }

  if (status === 403 || normalized.includes("permission")) {
    error.code = "PERMISSION_DENIED";
    error.message = "Der API-Key ist gültig, hat aber keinen Zugriff auf dieses Modell oder diese Anfrage.";
    return error;
  }

  error.code = "ANTHROPIC_API_ERROR";
  return error;
}

window.SMART_AI = {
  DEFAULT_MODEL,
  buildMailResponsePrompts,
  requestClaudeMailResponse,
  resolveProxyUrl,
  testClaudeConnection
};
