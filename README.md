# SMART ReplySuite

SMART ReplySuite ist eine browserbasierte lokale KI-Arbeitsoberflaeche fuer professionelle Antwortvorschlaege zu E-Mails, Briefen und allgemeiner Geschaeftskorrespondenz.

Die Anwendung ist ausdruecklich keine Desktop-App. Sie laeuft im Browser, speichert Arbeitsdaten lokal im Browser-Speicher und nutzt den eigenen API-Key des Nutzers fuer KI-Anfragen.

## Produktpositionierung

- Browserbasierte KI-Arbeitsoberflaeche
- Lokale Speicherung im Browser
- Eigener Anthropic API-Key des Nutzers
- Keine zentrale Projektdatenbank
- Kein klassisches SaaS mit zentralem Dokumentenspeicher
- Lizenz- und API-Verwaltung innerhalb der Web-App
- Fokus auf professionelle Geschaeftskommunikation

## Start

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
- Dateiablage fuer TXT, MD, CSV, HTML und RTF
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

## Wichtige Abgrenzung

SMART ReplySuite soll keine Electron-App und keine klassische Desktop-Anwendung werden. Das Ziel ist eine hochwertige browserbasierte Arbeitsoberflaeche mit lokaler Speicherung und eigenem API-Key.

Ein Dock- oder Desktop-Shortcut kann nur als Browser-/Web-App-Verknuepfung erfolgen. Favicon, Apple-Touch-Icon und Webmanifest sind fuer ein passendes Browser-Shortcut-Icon hinterlegt. Je nach Browser und macOS-Version kann das angezeigte Dock-Icon trotzdem vom Browser verwaltet oder zwischengespeichert werden.
