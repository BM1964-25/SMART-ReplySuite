# SMART ReplySuite

SMART ReplySuite ist eine lokale App mit browserbasierter KI-Arbeitsoberflaeche fuer professionelle Antwortvorschlaege zu E-Mails, Briefen, PDFs und allgemeiner Geschaeftskorrespondenz.

Die Oberflaeche laeuft im Browser. Der mitgelieferte Starter startet eine lokale App-Umgebung mit Server, Dateiimport und optional gebuendelten OCR-Werkzeugen. Arbeitsdaten werden lokal im Browser-Speicher abgelegt und KI-Anfragen laufen ueber den eigenen API-Key des Nutzers.

## Produktpositionierung

- Lokale App fuer macOS und Windows mit browserbasierter KI-Arbeitsoberflaeche
- Lokale Speicherung im Browser
- Lokale Datei- und OCR-Verarbeitung ueber die App-Umgebung
- Eigener Anthropic API-Key des Nutzers
- Keine zentrale Projektdatenbank
- Kein klassisches SaaS mit zentralem Dokumentenspeicher
- Lizenz- und API-Verwaltung innerhalb der Web-App
- Fokus auf professionelle Geschaeftskommunikation

## Start

### Einfacher Start fuer Nutzer ohne Terminalfenster

macOS:

```text
SMART ReplySuite.app
```

Die App kann in das Dock gezogen werden. Sie enthaelt die fuer den Start benoetigten App-Dateien im Bundle und startet den lokalen Server im Hintergrund. Fuer nutzerfreundliche Auslieferungen sollte das macOS-Paket eine passende Node-Laufzeit sowie Poppler/Tesseract mit Sprachdaten enthalten.

Windows:

```text
SMART ReplySuite starten.vbs
```

Der Starter startet den lokalen Server im Hintergrund und oeffnet die App automatisch im Browser unter `http://127.0.0.1:8173`. Der Nutzer muss kein Terminalfenster offen halten. Fuer nutzerfreundliche Auslieferungen sollte das Windows-Paket eine passende Node-Laufzeit sowie Poppler/Tesseract mit Sprachdaten enthalten.

### Technischer Start

```bash
npm start
```

Danach im Browser oeffnen:

```text
http://127.0.0.1:8173
```

Der lokale Server liefert HTML, CSS, JavaScript, Bilder, Favicon und Webmanifest direkt aus. Fuer den normalen Betrieb reicht `npm start`.

## Aktueller Funktionsumfang

- Neue Antwort fuer E-Mails, Briefe, Nachrichten und Geschaeftsschreiben
- Quelle mit Betreff, Ziel, eingegangener Nachricht, eigenen Notizen und zusaetzlichen Hinweisen
- Dateiablage fuer PDF, DOCX, TXT, MD, CSV, HTML und RTF
- OCR-Fallback fuer gescannte PDFs ueber lokale Poppler-/Tesseract-Werkzeuge
- Copy & Paste sowie Drag & Drop von markiertem Text in die Quelle
- Beispielquelle zum schnellen Testen
- Antwortparameter fuer Antworttyp, Fokus, Tonalitaet, Grundstil, Laenge der Hauptantwort und Antwortsprache
- Stilprofile mit Corporate Voice, Stilakzenten, No-Gos und eigenen Regeln
- Vorlagen und Bibliothek fuer wiederverwendbare Antwortbausteine
- Verlauf fuer lokal gespeicherte Antwortvorgaenge
- KI-Analyse vor der Antwort
- Hauptantwort, alternative Antwort, kurze Version und diplomatische Version
- Qualitaetsbewertung fuer Konflikt, Hoeflichkeit, Klarheit und Verbindlichkeit
- Kopierfunktionen je Variante und fuer die gesamte Ausgabe
- Export und Import lokaler Arbeitsdaten als JSON
- Lizenz- und API-Key-Verwaltung

## Datenschutz und Speicherung

Arbeitsdaten wie Vorlagen, Verlauf, Stilprofile, Einstellungen, Lizenzdaten und optional der API-Key werden lokal im Browser-Speicher abgelegt. Eine zentrale Projektdatenbank ist nicht vorgesehen.

Inhalte aus E-Mails, Briefen oder Geschaeftsschreiben werden erst dann an den gewaehlten KI-Anbieter uebertragen, wenn der Nutzer aktiv eine KI-Antwort erstellt. Die Anfrage laeuft ueber den lokalen Node-Proxy.

## KI-Anbindung

SMART ReplySuite nutzt aktuell Anthropic Claude ueber den eigenen API-Key des Nutzers. OpenAI oder weitere Anbieter koennen spaeter ergaenzt werden.

Die Prompt-Architektur beruecksichtigt:

- Eingegangene Nachricht und belastbare Fakten
- Ziel der Antwort
- Eigene Notizen und zusaetzliche Hinweise
- Verbindliche No-Gos
- Stilprofil und Stilregeln
- Antwortparameter
- Vorlage

## Lizenzmodell

Die App ist fuer ein Lizenzmodell vorbereitet. Lizenzschluessel und Kauf-E-Mail koennen lokal gespeichert und geprueft werden. Eine spaetere kleine Lizenz-API kann Aktivierung, Laufzeit und Verlaengerung verwalten.

## Technische Struktur

```text
index.html              Browser-App-Oberflaeche
styles.css              Designsystem und Layout
app.js                  App-Logik, lokale Daten, UI-Aktionen
anthropicClient.js      Prompt-Aufbau und Claude-Anbindung
licenseClient.js        Lizenzlogik
localProxyServer.js     Lokaler Server und Anthropic-Proxy
manifest.webmanifest    Web-App-Metadaten fuer Browser-Shortcuts
assets/                 App-Icon und visuelle Assets
scripts/                Icon-Hilfsskripte
```

## Plattformpakete und OCR fuer gescannte PDFs

PDFs mit eingebettetem Text werden direkt ueber `pdf-parse` gelesen. Wenn aus einer PDF kein ausreichend langer Text extrahiert werden kann, versucht der lokale Server automatisch eine OCR-Erkennung:

1. Poppler `pdftoppm` rendert PDF-Seiten als PNG.
2. Tesseract liest die erzeugten Seitenbilder lokal aus.
3. Der erkannte Text wird in die Quelle uebernommen.

Fuer fertige Nutzerpakete werden plattformspezifische Werkzeuge im App-Ordner erwartet. Die App sucht zuerst nach gebuendelten Tools und nutzt danach Umgebungsvariablen oder Systeminstallationen als Fallback:

```text
vendor/
  node/
    darwin-arm64/bin/node
    darwin-x64/bin/node
    win32-x64/node.exe
  ocr/
    darwin-arm64/bin/pdftoppm
    darwin-arm64/bin/tesseract
    darwin-arm64/tessdata/deu.traineddata
    darwin-arm64/tessdata/eng.traineddata
    win32-x64/bin/pdftoppm.exe
    win32-x64/bin/tesseract.exe
    win32-x64/tessdata/deu.traineddata
    win32-x64/tessdata/eng.traineddata
```

Fuer Entwicklung oder Fallback koennen die benoetigten Werkzeuge auch lokal installiert werden, z. B. unter macOS mit Homebrew:

```bash
brew install poppler tesseract tesseract-lang
```

Standardmaessig nutzt die App Deutsch und Englisch (`deu+eng`) und verarbeitet maximal 20 Seiten pro OCR-Import. Bei Bedarf koennen Pfade und Parameter weiterhin ueber Umgebungsvariablen gesetzt werden:

```bash
SMART_PDFTOPPM_PATH=/opt/homebrew/bin/pdftoppm
SMART_TESSERACT_PATH=/opt/homebrew/bin/tesseract
SMART_OCR_LANGUAGES=deu+eng
SMART_OCR_MAX_PAGES=20
SMART_OCR_DPI=220
```

## Pakete erstellen

macOS-Paket fuer Apple Silicon erstellen:

```bash
npm run package:macos
```

Das Skript vendort Node, Poppler, Tesseract und Tessdata, kompiliert den macOS-Starter, signiert die App ad hoc und erstellt:

```text
dist/SMART-ReplySuite-macOS-arm64.zip
```

Windows-Paket erstellen, sobald die Windows-Binaries in `vendor/node/win32-x64` und `vendor/ocr/win32-x64` liegen:

```bash
npm run package:windows
```

Das Windows-Skript bricht bewusst ab, wenn `node.exe`, `pdftoppm.exe`, `tesseract.exe` oder die Sprachdaten fehlen.

## Wichtige Abgrenzung

SMART ReplySuite soll keine Electron-App und kein Cloud-SaaS mit zentralem Dokumentenspeicher werden. Das Ziel ist eine lokale App-Umgebung mit hochwertiger browserbasierter Arbeitsoberflaeche, lokaler Speicherung und eigenem API-Key.

macOS- und Windows-Pakete koennen unterschiedliche Starter, Laufzeiten und OCR-Binaries enthalten, teilen sich aber dieselbe App-Oberflaeche und Serverlogik.
