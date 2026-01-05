Klar! Ich erstelle dir ein strukturiertes, professionelles und leicht verständliches README für dein SBB Fahrplan Projekt. Ich passe es so an, dass jemand dein Projekt schnell versteht, lokal ausführen kann und die Features erkennt.

SBB Fahrplan Web-App

Eine interaktive Web-Anwendung zur schnellen Suche von SBB-Verbindungen mit Echtzeitdaten, Autocomplete-Funktion und einer übersichtlichen Darstellung von Abfahrts- und Ankunftszeiten, Dauer und Umstiegen.

Inhaltsverzeichnis

Features

Vorschau

Installation & Nutzung

Technologien

Dateistruktur

Funktionalität

Responsive Design

Lizenz

Features

Autocomplete für Start- und Zielhaltestellen (ab 3 Zeichen)

Mehrstufiges Formular: Schritt 1 (Von/Bis), Schritt 2 (Datum & Zeit)

Echtzeit-Fahrplanabfrage über die API von fahrplan.search.ch

Anzeige von Verbindungen mit Abfahrt, Ankunft, Dauer und Umstiegen

Ladeanimation während der Datenabfrage

Karussell auf der Startseite mit Informationen & Highlights

Responsives Design für Tablets und mobile Geräte

Vorschau

Installation & Nutzung

Repository klonen oder Dateien herunterladen:

git clone https://github.com/dein-benutzername/sbb-fahrplan.git
cd sbb-fahrplan


Dateien lokal öffnen:
Öffne index.html in deinem Browser.

Autocomplete & Fahrplanabfrage nutzen:

Schritt 1: Start- und Zielhaltestelle eingeben

Schritt 2: Datum & Uhrzeit wählen

Fahrplan anzeigen lassen

Hinweis: Für Echtzeitdaten wird eine Internetverbindung benötigt.

Technologien

HTML5 – Struktur der Seite

CSS3 – Styling, Grid-Layout und Responsive Design

JavaScript (ES6) – Autocomplete, Validierung, API-Abfrage, Karussell

API – fahrplan.search.ch

Dateistruktur
sbb-fahrplan/
│
├─ index.html          # Hauptseite
├─ formular-css.css    # Stylesheet
├─ formular-js.js      # JavaScript für Formulare, API & Karussell
├─ SBB.png             # Logo
└─ README.md           # Projektbeschreibung

Funktionalität
Karussell

Wechselbare Slides mit Pfeilen

Animiertes Scrollen zwischen Infos

Hintergrund: Radialer Farbverlauf

Formular

Step 1: Von/Bis

Autocomplete Vorschläge ab 3 Zeichen

Validierung der Eingaben über API

Step 2: Datum & Zeit

Eingabe von Abfahrtsdatum und Uhrzeit

Nach Klick auf „Fahrplan suchen“ werden Verbindungen geladen

Fahrplan-Anzeige

Liste der Verbindungen:

Abfahrt & Ankunft

Dauer

Umstiege (inkl. Details zu jeder Linie, Abfahrt & Ankunft pro Abschnitt)

Ladeanimation während der API-Abfrage

Fehlerhandling bei fehlenden Verbindungen

Responsive Design

Desktop: Grid mit zwei Spalten

Tablets: Breite 80% & Spalten-Anpassung

Mobile: Einspaltige Darstellung, größere Buttons und optimierte Schriftgrößen

Lizenz

Dieses Projekt ist frei nutzbar und modifizierbar.
Nicht kommerzielle Nutzung empfohlen.