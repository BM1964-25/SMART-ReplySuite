const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function resolveProxyUrl(proxyUrl) {
  if (proxyUrl) return proxyUrl;
  return isLocalBrowserHost()
    ? "/api/anthropic/messages"
    : "http://127.0.0.1:8173/api/anthropic/messages";
}

function isLocalBrowserHost() {
  return ["127.0.0.1", "localhost", "::1"].includes(window.location.hostname);
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
    Verbindlichkeit: "Formuliere klare Zuständigkeiten, Grenzen, Prüfschritte und nächste Schritte, ohne ungeprüfte Zusagen zu machen.",
    Entscheidungsvorbereitung: "Bereite eine Entscheidung vor, inklusive Optionen, Auswirkungen und fehlender Informationen.",
    "Nächste Schritte": "Formuliere konkrete nächste Schritte mit Reihenfolge und Zuständigkeiten, soweit ableitbar.",
    Risikominimierung: "Vermeide riskante Zusagen, markiere Annahmen und adressiere offene Punkte vorsichtig."
  };

  const responseTypeRules = {
    Zustimmung: "Stimme klar zu und formuliere, was konkret bestätigt wird. Vermeide weitergehende Zusagen, die nicht ausdrücklich gedeckt sind.",
    Ablehnung: "Lehne sachlich, nachvollziehbar und respektvoll ab. Begründe knapp und biete, falls sinnvoll, eine alternative Vorgehensweise an.",
    Bestätigung: "Bestätige Eingang, Verständnis oder Vereinbarung präzise. Halte offene Punkte und nächste Schritte getrennt.",
    Rückfrage: "Stelle gezielte Rückfragen, die für eine belastbare Antwort oder Entscheidung notwendig sind. Priorisiere die wichtigsten Punkte.",
    Information: "Informiere klar, strukturiert und ohne unnötige Wertung. Trenne Fakten, Einschätzung und nächste Schritte.",
    Terminabstimmung: "Formuliere eine klare Terminabstimmung mit Optionen, Rückmeldewunsch und gegebenenfalls Frist.",
    Erinnerung: "Erinnere freundlich, aber bestimmt. Verweise auf Anlass, offene Rückmeldung und nächsten Schritt.",
    Nachforderung: "Fordere fehlende Informationen oder Unterlagen präzise nach. Begründe, warum sie benötigt werden.",
    Angebotsantwort: "Reagiere auf ein Angebot strukturiert. Kläre Annahme, Rückfrage, Ablehnung oder Prüfbedarf ohne ungeprüfte Bindung.",
    Beschwerdebeantwortung: "Nimm das Anliegen ernst, deeskaliere und trenne Verständnis von Anerkennung einer Pflicht oder Schuld.",
    Stellungnahme: "Formuliere eine sachliche Position mit Begründung, Abgrenzung und offenen Punkten.",
    Fristantwort: "Behandle Fristen sorgfältig. Keine Fristzusagen ohne Grundlage; falls nötig, um Prüfung oder Verlängerung bitten.",
    "Schriftliche Klärung": "Kläre Sachverhalt, Verständnis und weitere Vorgehensweise schriftlich belastbar.",
    Eskalationsentschärfung: "Deeskaliere konsequent, vermeide Schuldzuweisungen und führe zurück auf Fakten, Klärung und nächste Schritte.",
    "Bitte um Entscheidung": "Bereite die Entscheidung klar vor, benenne benötigte Entscheidung, Optionen und Konsequenzen.",
    Zusammenfassung: "Fasse strukturiert zusammen und schließe mit einem klaren nächsten Schritt.",
    Projektkommunikation: "Kommuniziere projektbezogen, sachlich, termin- und zuständigkeitsorientiert.",
    "Individuelle Antwort": "Richte dich besonders eng nach Ziel, Notizen und zusätzlichen Hinweisen."
  };

  const toneRules = {
    sachlich: "Neutral, faktenorientiert und ohne emotionale Verstärkung formulieren.",
    freundlich: "Wertschätzend und zugänglich formulieren, ohne an Präzision zu verlieren.",
    verbindlich: "Klar, zuverlässig und handlungsorientiert formulieren, ohne ungeprüfte Zusagen zu machen.",
    diplomatisch: "Ausgleichend, respektvoll und gesichtswahrend formulieren.",
    direkt: "Kurz, klar und ohne Umwege formulieren, dabei professionell bleiben.",
    souverän: "Ruhig, kontrolliert und entscheidungsfähig formulieren.",
    wertschätzend: "Anerkennend und respektvoll formulieren, ohne rechtliche oder sachliche Positionen zu verwässern.",
    bestimmt: "Klar abgrenzen und Position beziehen, ohne eskalierend zu wirken.",
    entschärfend: "Spannung reduzieren, Schuldzuweisungen vermeiden und auf Lösung ausrichten.",
    "geschäftlich-formell": "Professionell, formal und sauber strukturiert formulieren."
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
    `Antworttyp: ${responseType}. ${responseTypeRules[responseType] || ""}`,
    `Tonalität: ${tone}. ${toneRules[tone] || ""}`,
    `Länge der Hauptantwort: ${lengthMap[length] || lengthMap.standard}`,
    `Fokus: ${focus}. ${focusRules[focus] || ""}`,
    `Grundstil des Stilprofils: ${companyStyleMap[companyStyle] || companyStyle}.`,
    companyStyleAccents.length ? `Zusätzliche Stilakzente: ${companyStyleAccents.join(", ")}.` : "",
    companyStyleNoGos.length ? `Verbindliche No-Gos: ${companyStyleNoGos.join("; ")}.` : "",
    companyStyleNotes ? `Eigene Stilprofil-Regeln: ${companyStyleNotes}.` : "",
    "Priorität bei Vorgaben: 1. Eingegangene Nachricht und belastbare Fakten, 2. Ziel der Antwort, eigene Notizen und zusätzliche Hinweise, 3. verbindliche No-Gos, 4. Stilprofil und Stilregeln, 5. Antwortparameter, 6. Vorlage. Bei Widersprüchen keine Fakten erfinden, sondern den Konflikt als offenen Punkt markieren.",
    "Die Hauptantwort muss Antworttyp, Ziel, Fokus, Tonalität, Grundstil, Länge der Hauptantwort und No-Gos gleichzeitig berücksichtigen.",
    "Prüfe vor der finalen Formulierung intern, ob die Antwort keine ungeprüften Zusagen, Anerkenntnisse, Schuldzuweisungen oder vertraulichen Informationen enthält.",
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
    "- Hauptantwort nach der gewählten Länge der Hauptantwort ausrichten; alternative, kurze und diplomatische Version dürfen davon abweichen, müssen aber zum gleichen Sachverhalt passen.",
    "- Antworttyp, Fokus, Tonalität, Grundstil, Ziel, Notizen, Hinweise, No-Gos und Stilregeln bewusst gegeneinander abgleichen.",
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

  if (status === 405) {
    error.code = "PROXY_METHOD_NOT_ALLOWED";
    error.message = "Die API-Anfrage wurde vom falschen Server abgelehnt. Starte SMART ReplySuite über den lokalen Server und prüfe, ob http://127.0.0.1:8173 erreichbar ist.";
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
