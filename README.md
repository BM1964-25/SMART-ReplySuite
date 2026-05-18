# SMART ReplySuite

SMART ReplySuite ist eine lokale KI-Arbeitsoberfläche für professionelle Antwortvorschläge zu E-Mails, Briefen und allgemeiner Geschäftskorrespondenz. Die App übernimmt bewusst Design, Farbwelt, Statuslogik und API-Key-Darstellung aus dem SMART Summary Assistant, baut die Produktlogik aber neu auf.

## Einschätzung zur Wiederverwendung

Übernehmen:

- Premium-Design mit blauem Hintergrund, hellen Karten, ruhiger Typografie und 8px-Radien
- API-Key-Komponente mit Maskierung, Sichtbarkeitsschalter, lokaler Speicherung und Verbindungstest
- Lokaler Node-Proxy für Anthropic Claude
- Lizenz-Demo-Flow und Struktur für eine spätere Lizenz-API
- Markdown-Rendering, Kopierfunktionen, Status- und Fehlerzustände

Neu aufbauen:

- Korrespondenz-Domain mit Betreff, Nachricht, Schreiben, Notizen, Antwortziel und Hinweisen
- Sidebar-Menüstruktur
- Antworttypen, Tonalität, Länge, Fokus und Stilprofile
- Prompt-Architektur für Analyse plus vier Antwortvarianten
- Bibliothek, Vorlagen, Favoriten und Verlauf
- Zielarchitektur für Electron, React, SQLite, verschlüsselte Einstellungen und Stripe-Lizenzierung

Fazit: Kein kompletter Neubau des visuellen Systems nötig. Die technische Basis ist aber ein Browser-Prototyp, nicht die geforderte finale Electron/React-App. Für den MVP wurde deshalb eine eigenständige lokale Version erstellt; die marktfähige Zielversion sollte als Electron/React-Refactor folgen.

## Start

```bash
npm start
```

Danach im Browser öffnen:

```text
http://127.0.0.1:8173
```

Demo-Lizenz:

```text
SMART-DEMO-2026-LOCAL
```

## Desktop-App und Icon

Für die Desktop-Verpackung sind App-Icons vorbereitet:

- macOS Dock/App: `build/icon.icns`
- Windows EXE/Taskleiste/Startmenü: `build/icon.ico`
- Linux AppImage/Deb: `build/icon.png`

Die Electron-Konfiguration liegt in `electron/main.cjs`, die Packaging-Konfiguration in `package.json`.

```bash
npm install
npm run desktop
npm run build:desktop
```

Wenn das Icon geändert wird, können die Plattform-Icons lokal neu erzeugt werden:

```bash
npm run icon:ico
npm run icon:icns
```

## Funktionsumfang im aktuellen MVP

- Dashboard
- Neue Antwort mit Betreff, Nachricht oder Schreiben, Notizen, Ziel und Hinweisen
- Inline-Onboarding, wenn noch kein API-Key eingerichtet ist
- Permanenter Systemstatus für Lizenz, Claude und lokale Speicherung
- Kompakter Composer mit Moduswahl für neue Antworten oder Entwurfsoptimierung
- Direkte Vorlagenauswahl im Composer
- Auswahl von Antworttyp, Tonalität, Länge, Fokus, Sprache und Stilprofilen
- Anthropic-Claude-Anbindung über lokalen Proxy
- KI-Analyse vor der Antwort
- Hauptantwort, alternative Antwort, kürzere Version und diplomatische Version
- Tabbare Antwortkarten mit Kopieren je Abschnitt und Gesamtantwort
- Qualitätsbadges für Konflikt, Höflichkeit, Klarheit und Verbindlichkeit
- Robuste JSON-Antwortstruktur für Analyse, Antwortvarianten und Qualitätswerte
- Vorlagen speichern, bearbeiten, löschen, kategorisieren, taggen und favorisieren
- Bibliothek mit Suche und Tag-Filter
- Verlauf mit Suche, Antworttyp-Filter, erneut verwenden, kopieren und löschen
- Stilprofile
- Einstellungen für Export, Import, lokale Sicherung und Diagnose
- Lokale Datenexport- und Import-Funktion
- Diagnosebereich für lokale Daten, API-Key, Lizenz und Speicherstatus
- Lizenz- und API-Key-Verwaltung im übernommenen Premium-Stil

Weitere technische Vorbereitungen liegen unter `desktop-blueprint/` und `docs/`.

## Vollständige Zielarchitektur

```text
smart-mailresponse/
  apps/
    desktop/
      electron/
        main.ts
        preload.ts
        security.ts
        updater.ts
      renderer/
        src/
          app/
          components/
          features/
          routes/
          styles/
  packages/
    ai/
      anthropicClient.ts
      openaiClient.ts
      promptBuilder.ts
      responseParser.ts
    data/
      db.ts
      migrations/
      repositories/
    license/
      licenseClient.ts
      deviceFingerprint.ts
    crypto/
      secureSettings.ts
  services/
    license-api/
      src/
        stripeWebhook.ts
        licenseController.ts
        activationController.ts
        repositories/
```

## UI-Konzept

Die App nutzt eine moderne Desktop-Shell mit linker Sidebar, fokussiertem Arbeitsbereich und ruhigen Karten. Der erste produktive Screen ist das Dashboard, die Hauptarbeit findet in "Neue Antwort" statt. Die Gestaltung bleibt Apple-inspiriert: klare Abstände, dezente Schatten, helle Karten auf dunklem Premium-Hintergrund, wenige Akzentfarben und stark reduzierte visuelle Ablenkung.

## Datenmodell

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  encrypted INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE mail_responses (
  id TEXT PRIMARY KEY,
  subject TEXT,
  inbound_message TEXT NOT NULL,
  notes TEXT,
  response_goal TEXT,
  response_type TEXT NOT NULL,
  tone TEXT NOT NULL,
  length TEXT NOT NULL,
  focus TEXT NOT NULL,
  language TEXT NOT NULL,
  company_style TEXT,
  ai_analysis TEXT,
  main_response TEXT,
  alternative_response TEXT,
  short_response TEXT,
  diplomatic_response TEXT,
  quality_score TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  body TEXT NOT NULL,
  favorite INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE licenses (
  id TEXT PRIMARY KEY,
  license_key TEXT NOT NULL,
  email TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  expires_at TEXT,
  activation_id TEXT,
  checked_at TEXT NOT NULL
);
```

## Komponentenstruktur

- `AppShell`
- `SidebarNavigation`
- `Dashboard`
- `MailComposer`
- `ResponseControls`
- `AiAnalysisPanel`
- `ResponseVariantCard`
- `TemplateManager`
- `HistoryView`
- `CompanyStyleEditor`
- `SettingsView`
- `LicensePanel`
- `ApiKeyPanel`
- `PrivacyNotice`
- `EmptyState`
- `StatusBadge`

## Lizenzarchitektur

Die Desktop-App speichert Lizenzdaten lokal und prüft sie periodisch gegen eine kleine Lizenz-API. Die API verwaltet Lizenzen, Aktivierungen und Laufzeiten. Pro Gerät wird eine pseudonyme Device-ID registriert. Deaktivierungen setzen Aktivierungsslots frei.

```text
Desktop App -> License API -> License DB
Stripe Webhook -> License API -> License DB -> E-Mail mit Lizenzschlüssel
```

Lizenztypen:

- Monatslizenz
- Jahreslizenz
- Lifetime-Lizenz

## Stripe-Workflow

1. Nutzer kauft über Stripe Checkout.
2. Stripe sendet `checkout.session.completed` an die Lizenz-API.
3. Lizenz-API erzeugt Lizenzschlüssel.
4. Lizenz wird mit E-Mail, Plan, Laufzeit und Aktivierungslimit gespeichert.
5. E-Mail mit Lizenzschlüssel wird versendet.
6. App prüft Lizenzschlüssel, E-Mail und Device-ID.
7. API bestätigt Status, Laufzeit und Aktivierungen.

## API-Key-Verwaltung

Im Prototyp wird der API-Key optional in `localStorage` gespeichert. In der Electron-Version sollte er über `keytar` oder die native OS-Keychain verschlüsselt abgelegt werden. SQLite speichert nur Metadaten, nie Klartext-Schlüssel.

## Prompt-Architektur

Die Prompt-Architektur trennt:

- Systemrolle: Senior Communication Strategist
- Sicherheitsregeln: keine erfundenen Fakten, keine riskanten Zusagen
- Steuerparameter: Antworttyp, Tonalität, Länge, Fokus, Sprache und Stilprofil
- Analysepflicht: Erwartung, Risiken, Konflikte, Strategie, offene Punkte
- Antwortpflicht: Hauptantwort, Alternative, Kurzversion, diplomatische Version, Qualitätsbewertung

## Designsystem

- Hintergrund: dunkles Blau mit subtiler Tiefe
- Karten: weiße bis leicht blaue Premium-Flächen
- Akzent: Business-Blau
- Status: Grün, Warn-Gelb, Rot
- Radius: 8px
- Typografie: System UI / Apple-nahe Sans-Serif
- Buttons: klare Primäraktion, ruhige Sekundäraktionen
- Eingaben: helle Felder, sichtbarer Fokus, große Schreibflächen

## Dashboard-Konzept

Das Dashboard zeigt:

- heutige Antwortvorgänge
- gespeicherte Vorlagen
- zuletzt genutzten Fokus
- API-Status
- Schnellaktionen
- Qualitätsprofil für Premium-Funktionen

## MVP-Definition

MVP ist erreicht, wenn:

- E-Mails, Briefe oder Geschäftsschreiben per Copy-and-Paste verarbeitet werden
- Claude mit eigenem API-Key Antwortvorschläge erstellt
- Analyse und vier Varianten ausgegeben werden
- Antworten kopierbar sind
- Vorlagen und Verlauf lokal gespeichert werden
- Lizenz-/API-Bereich vorhanden ist
- Nutzer ohne Schulung eine Antwort erzeugen kann

## Entwicklungs-Roadmap

1. Prototyp stabilisieren: UI, Prompt, lokale Speicherung, Export.
2. Electron-Shell ergänzen: Main/Preload, sichere IPC-Grenzen, Auto-Update vorbereiten.
3. React/Tailwind-Refactor: Komponenten, Routing, State-Management.
4. SQLite integrieren: Migrationen, Repositories, Import/Export.
5. Sichere Einstellungen: OS-Keychain, Verschlüsselung, Backups.
6. Lizenz-API und Stripe-Webhooks produktiv machen.
7. OpenAI optional als zweiten Provider vorbereiten.
8. QA: Offline-Verhalten, Fehlerfälle, lange Nachrichten und Schreiben, Datenschutztexte.
9. Packaging für macOS und Windows.
10. Vertriebsreife: Website, Checkout, Onboarding, Lizenzmails.

## Erweiterungsstrategie SaaS

Eine spätere SaaS-Version kann Team-Vorlagen, Rollen, zentrale Stilprofile, Admin-Policies, Audit-Logs und geteilte Bibliotheken anbieten. Sensible Inhalte aus E-Mails, Briefen und Geschäftsschreiben sollten weiterhin nur nach expliziter Freigabe synchronisiert werden. Die lokale Desktop-App bleibt als Datenschutz- und Professional-Power-User-Variante bestehen.
