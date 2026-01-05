// -------------------------------------------------
// 1️⃣ DOM-ELEMENTE ABFRAGEN
// -------------------------------------------------

// Step2-Container (Datum & Zeit), der erst später angezeigt wird
const step2 = document.getElementById("step2");

// "Weiter"-Button von Step1 → Step2
const nextBtn = document.getElementById("nextBtn");

// Das gesamte Formular für Fahrplansuche
const form = document.getElementById("fahrplanForm");

// Ergebnisse-Container, der erst sichtbar wird, wenn Ergebnisse geladen werden
const results = document.getElementById("results");

// UL-Element, in dem die Verbindungsliste angezeigt wird
const connectionsList = document.getElementById("connections");

// Loader-Element, für Animation während der API-Abfrage
const loader = document.getElementById("loader");

// Karussell-Track und Pfeile
const track = document.getElementById("carouselTrack");
const prevBtn = document.getElementById("prevBtn");
const nextBtn2 = document.getElementById("nextBtn2");

// Karussell-Index und Anzahl Slides
let currentIndex = 0;
const totalSlides = 3; // Wir haben 3 Items im Karussell

// -------------------------------------------------
// 2️⃣ HILFSFUNKTIONEN
// -------------------------------------------------

/**
 * formatTime
 * Wandelt Zeit in lesbares Format um ("HH:MM").
 * @param {*} time - String oder Date
 * @returns String - formatierte Zeit oder "–" wenn ungültig
 */
function formatTime(time) {
  if (!time) return "–"; // Kein Wert → Platzhalter

  // Wenn schon "HH:MM" String, direkt zurückgeben
  if (typeof time === "string" && /^\d{1,2}:\d{2}$/.test(time)) return time;

  // Sonst in Date konvertieren
  const d = new Date(time);
  return isNaN(d)
    ? "–"
    : d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

/**
 * formatDuration
 * Wandelt Sekunden in Stunden & Minuten um.
 * @param {*} seconds 
 * @returns String
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "–";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

/**
 * safeArray
 * Sichert Arrays ab → falls undefined, wird ein leeres Array zurückgegeben
 */
const safeArray = v => Array.isArray(v) ? v : [];

// -------------------------------------------------
// 3️⃣ AUTOCOMPLETE FÜR START & ZIEL
// -------------------------------------------------

/**
 * fetchSuggestions
 * Ruft Vorschläge von Search.ch API ab und zeigt sie im Vorschlags-Div an
 * @param {string} term - Eingabe des Users
 * @param {HTMLElement} target - Vorschlagscontainer
 */
async function fetchSuggestions(term, target) {
  // Weniger als 3 Buchstaben → keine Vorschläge
  if (term.length < 3) {
    target.innerHTML = "";
    return;
  }

  // API-Aufruf
  const res = await fetch(
    `https://fahrplan.search.ch/api/completion.json?term=${encodeURIComponent(term)}`
  );
  const data = await res.json();

  // Vorschläge leeren
  target.innerHTML = "";

  // Für jedes Ergebnis ein <div> erstellen
  data.forEach(item => {
    const div = document.createElement("div");
    div.textContent = item.label;

    // Klick auf Vorschlag → Input-Feld wird gefüllt, Vorschläge verschwinden
    div.onclick = () => {
      target.previousElementSibling.value = item.label;
      target.innerHTML = "";
    };

    target.appendChild(div);
  });
}

// EventListener für Inputfelder
document.getElementById("from").addEventListener("input", e =>
  fetchSuggestions(e.target.value, document.getElementById("fromSuggestions"))
);
document.getElementById("to").addEventListener("input", e =>
  fetchSuggestions(e.target.value, document.getElementById("toSuggestions"))
);

// -------------------------------------------------
// 4️⃣ VALIDIERUNG DER ORTE
// -------------------------------------------------

/**
 * isValidPlace
 * Prüft, ob der eingegebene Ort in der API existiert
 * @param {string} term
 * @returns boolean
 */
async function isValidPlace(term) {
  const res = await fetch(
    `https://fahrplan.search.ch/api/completion.json?term=${encodeURIComponent(term)}`
  );
  const data = await res.json();

  // Vergleich: exakter Treffer in der API
  return data.some(i => i.label.toLowerCase() === term.toLowerCase());
}

/**
 * setInputValidity
 * Fügt CSS-Klassen "valid"/"invalid" hinzu, um Eingaben optisch zu markieren
 */
function setInputValidity(input, valid) {
  input.classList.toggle("valid", valid);
  input.classList.toggle("invalid", !valid);
}

// -------------------------------------------------
// 5️⃣ STEP 1 → STEP 2 LOGIK
// -------------------------------------------------

nextBtn.addEventListener("click", async () => {
  const from = document.getElementById("from");
  const to = document.getElementById("to");

  // Prüfen, ob Start- und Zielort gültig sind
  const fromValid = await isValidPlace(from.value.trim());
  const toValid = await isValidPlace(to.value.trim());

  // Eingaben visuell markieren
  setInputValidity(from, fromValid);
  setInputValidity(to, toValid);

  // Nur wenn beide gültig → Step2 anzeigen
  if (fromValid && toValid) {
    step2.classList.remove("hidden"); // Step2 sichtbar
    nextBtn.style.display = "none";    // Button ausblenden
  }
});

// -------------------------------------------------
// 6️⃣ FAHRPLAN-ABFRAGE UND ERGEBNISSE
// -------------------------------------------------

form.addEventListener("submit", async e => {
  e.preventDefault(); // Verhindert Seiten-Reload

  const from = document.getElementById("from").value.trim();
  const to = document.getElementById("to").value.trim();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  // API URL zusammenbauen
  const url = `https://fahrplan.search.ch/api/route.json?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&time=${time}&time_type=depart&num=4`;

  // Alte Ergebnisse löschen & Loader anzeigen
  connectionsList.innerHTML = "";
  results.classList.remove("hidden");
  loader.classList.remove("hidden");

  try {
    const res = await fetch(url);
    const data = await res.json();
    loader.classList.add("hidden"); // Loader ausblenden

    const connections = safeArray(data.connections);

    if (!connections.length) {
      connectionsList.innerHTML = "<li>Keine Verbindung gefunden.</li>";
      return;
    }

    // Jede Verbindung darstellen
    connections.forEach(conn => {
      const li = document.createElement("li");

      const legs = safeArray(conn.legs);
      const rideLegs = legs.filter(l => l.line && l.departure);

      let legsHTML = "";

      if (rideLegs.length <= 1) {
        legsHTML = `<br><em>Direktverbindung ohne Umstieg</em>`;
      } else {
        legsHTML = `<br><strong>Umstiege (${rideLegs.length - 1}×):</strong>`;
        rideLegs.forEach(leg => {
          const dep = formatTime(leg.departure);
          const arr = formatTime(leg.to?.time || leg.arrival);

          legsHTML += `
            <div style="margin:8px 0;padding:8px;background:#fff;border-radius:8px;">
              <strong>${leg.line}</strong><br>
              ${leg.from?.name || "–"} (${dep}) →
              ${leg.to?.name || "–"} (${arr})
            </div>
          `;
        });
      }

      const overallArrival = formatTime(conn.arrival);

      li.innerHTML = `
        <strong>${conn.from}</strong> → <strong>${conn.to}</strong><br>
        🕒 Abfahrt: ${formatTime(conn.departure)}<br>
        🕕 Ankunft: ${overallArrival}<br>
        ⏱️ Dauer: ${formatDuration(conn.duration)}
        ${legsHTML}
      `;
      connectionsList.appendChild(li);
    });
  } catch (err) {
    loader.classList.add("hidden");
    connectionsList.innerHTML = "<li>Fehler beim Laden der Verbindung.</li>";
    console.error(err);
  }
});

// -------------------------------------------------
// 7️⃣ KARUSSELL
// -------------------------------------------------

/**
 * updateSlide
 * Verschiebt das Karussell zum aktuellen Index
 */
function updateSlide() {
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
}

// Pfeil links → vorherige Slide
prevBtn.onclick = () => {
  currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
  updateSlide();
};

// Pfeil rechts → nächste Slide
nextBtn2.onclick = () => {
  currentIndex = (currentIndex + 1) % totalSlides;
  updateSlide();
};
