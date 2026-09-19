# Arbeitsanweisungen für ioBroker.device-monitoring

## Verbindlichkeit und Kontext

- Diese Datei enthält die verbindlichen Arbeitsanweisungen für diesen Adapter.
- `secondBrain/` enthält verifiziertes Projektwissen und frühere Entscheidungen, aber keine zusätzlichen Arbeitsanweisungen. Bei Widersprüchen gelten diese Datei und höherrangige Anweisungen.
- Zu Beginn `secondBrain/INDEX.md` als kurzen Wegweiser lesen. Verlinkte Detaildateien nur laden, wenn sie für die konkrete Aufgabe relevant sind.
- `../secondBrain/INDEX.md` nur bei adapterübergreifenden Fragen oder wenn gemeinsame Konventionen betroffen sind lesen. Ist der Pfad nicht erreichbar, nichts daraus annehmen und dies bei relevanten Aufgaben melden.

## Änderungen und Validierung

- Bestehende, nicht zur Aufgabe gehörende Änderungen des Benutzers erhalten; den Arbeitsbaum vor und nach der Bearbeitung prüfen.
- Änderungen auf den angeforderten Umfang begrenzen. Keine Commits, Pushes oder Releases ohne ausdrücklichen Auftrag.
- Nach Code- oder Konfigurationsänderungen die kleinste aussagekräftige Prüfung aus den tatsächlich in `package.json` vorhandenen Skripten ausführen; bei breiten oder riskanten Änderungen zusätzlich die umfassenderen passenden Prüfungen. Keine erfundenen Befehle verwenden.
- Nicht ausführbare oder fehlgeschlagene Prüfungen mit Ursache bei der Übergabe nennen. Reine Dokumentationsänderungen benötigen normalerweise keinen Build oder Test; Diff, Links und Pfade sind dennoch zu prüfen.
- Nach Adapteränderungen den Abschnitt `WORK IN PROGRESS` der README aktualisieren, sofern unreleaste, für Benutzer relevante Änderungen entstanden sind.

## Second Brain pflegen

Nach jeder abgeschlossenen Aufgabe prüfen, ob eine verifizierte, dauerhaft relevante Erkenntnis entstanden ist:

- Adapterspezifisches Wissen kurz, datiert und ohne Arbeitsanweisungen in `secondBrain/` dokumentieren. Den INDEX schlank halten und ausführliche Details in thematische Unterdateien auslagern.
- Adapterübergreifendes Wissen zusätzlich in `../secondBrain/` dokumentieren, sofern der Pfad erreichbar und die Aussage wirklich übertragbar ist.
- Vorübergehende Details, Vermutungen, Aufgabenprotokolle und bereits aus Code oder Standarddokumentation Offensichtliches nicht aufnehmen.
- Niemals Passwörter, Tokens, private Schlüssel oder andere Zugangsdaten speichern.
