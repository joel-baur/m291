// --- DOM-Elemente ---
const step2 = document.getElementById('step2');
const nextBtn = document.getElementById('nextBtn');
const form = document.getElementById('fahrplanForm');
const results = document.getElementById('results');
const connectionsList = document.getElementById('connections');
const loader = document.getElementById('loader');

// --- Vorschläge laden (Autocomplete) ---
async function fetchSuggestions(term, target) {
  if (term.length < 3) {
    target.innerHTML = "";
    return;
  }

  try {
    const url = `https://fahrplan.search.ch/api/completion.json?term=${encodeURIComponent(term)}`;
    const response = await fetch(url);
    const data = await response.json();

    target.innerHTML = "";
    data.forEach(item => {
      const div = document.createElement("div");
      div.textContent = item.label;
      div.addEventListener("click", () => {
        const input = target.previousElementSibling;
        input.value = item.label;
        target.innerHTML = "";
      });
      target.appendChild(div);
    });
  } catch (err) {
    console.error("Fehler beim Laden der Vorschläge:", err);
  }
}

// --- Autocomplete ---
document.getElementById("from").addEventListener("input", (e) => {
  fetchSuggestions(e.target.value, document.getElementById("fromSuggestions"));
});
document.getElementById("to").addEventListener("input", (e) => {
  fetchSuggestions(e.target.value, document.getElementById("toSuggestions"));
});

// --- Ort-Validierung ---
async function isValidPlace(term) {
  if (!term) return false;
  try {
    const url = `https://fahrplan.search.ch/api/completion.json?term=${encodeURIComponent(term)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.some(item => item.label.toLowerCase() === term.toLowerCase());
  } catch {
    return false;
  }
}

// --- Validierungs-Farben ---
function setInputValidity(input, isValid) {
  if (isValid) {
    input.classList.add('valid');
    input.classList.remove('invalid');
  } else {
    input.classList.add('invalid');
    input.classList.remove('valid');
  }
}

// --- Schritt 1 → Schritt 2 ---
nextBtn.addEventListener('click', async () => {
  const from = document.getElementById('from');
  const to = document.getElementById('to');
  const fromError = document.getElementById('fromError');
  const toError = document.getElementById('toError');

  fromError.style.display = 'none';
  toError.style.display = 'none';

  let valid = true;

  const fromValid = await isValidPlace(from.value.trim());
  const toValid = await isValidPlace(to.value.trim());

  if (!fromValid) {
    fromError.textContent = "Bitte einen gültigen Startort auswählen.";
    fromError.style.display = 'block';
    setInputValidity(from, false);
    valid = false;
  } else setInputValidity(from, true);

  if (!toValid) {
    toError.textContent = "Bitte einen gültigen Zielort auswählen.";
    toError.style.display = 'block';
    setInputValidity(to, false);
    valid = false;
  } else setInputValidity(to, true);

  if (valid) {
    step2.classList.remove('hidden');
    nextBtn.style.display = 'none';
  }
});

// --- API-Abfrage inkl. Umstiegsdetails ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const from = document.getElementById('from').value.trim();
  const to = document.getElementById('to').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

  if (!from || !to || !date || !time) {

    // Fehlerstyle setzen
    if (!date) document.getElementById("date").classList.add("invalid");
    else document.getElementById("date").classList.remove("invalid");

    if (!time) document.getElementById("time").classList.add("invalid");
    else document.getElementById("time").classList.remove("invalid");

    alert("Bitte alle Felder ausfüllen.");
    return;
}

// Wenn alles korrekt ist → grün markieren
document.getElementById("date").classList.add("valid");
document.getElementById("time").classList.add("valid");


  const fromValid = await isValidPlace(from);
  const toValid = await isValidPlace(to);

  if (!fromValid || !toValid) {
    alert("Bitte gültige Orte auswählen.");
    return;
  }

  const url = `https://fahrplan.search.ch/api/route.json?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&time=${time}&num=4`;

  connectionsList.innerHTML = "";
  results.classList.remove('hidden');

  loader.classList.remove("hidden");

  try {
    const response = await fetch(url);
    const data = await response.json();

    loader.classList.add("hidden");

    const connections = data.connections || data.trips;
    if (!connections || connections.length === 0) {
      connectionsList.innerHTML = "<li>Keine Verbindung gefunden.</li>";
      return;
    }

    const formatTime = (time) => {
      if (!time) return "–";
      try {
        const d = new Date(time);
        if (!isNaN(d)) {
          return d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
        }
        return time.substring(0, 5);
      } catch {
        return "–";
      }
    };

    connectionsList.innerHTML = "";

    connections.forEach((conn) => {
      const li = document.createElement('li');

      const fromName = conn.from?.location?.name || conn.legs?.[0]?.from?.name || "–";
      const toName = conn.to?.location?.name || conn.legs?.[conn.legs.length - 1]?.to?.name || "–";

      const depTime = formatTime(conn.legs?.[0]?.departure);
      const arrTime = formatTime(conn.legs?.[conn.legs.length - 1]?.arrival);

      // --- UMSTIEGE / DETAILS ---
      let transferHTML = "";

      if (conn.legs && conn.legs.length > 1) {
        transferHTML += `<br><strong>Umstiege (${conn.legs.length - 1}×):</strong><br>`;

        conn.legs.forEach((leg, i) => {
          const legFrom = leg.from?.name || "–";
          const legTo = leg.to?.name || "–";
          const legDep = formatTime(leg.departure);
          const legArr = formatTime(leg.arrival);
          const transport = leg.journey?.category || leg.type || "Verkehrsmittel";

          transferHTML += `
            <div style="margin:6px 0 12px; padding:8px; background:#fff; border-radius:8px;">
              <strong>${transport}</strong><br>
              ${legFrom} (${legDep}) → ${legTo} (${legArr})
            </div>
          `;
        });
      } else {
        transferHTML = `<br><em>Direktverbindung ohne Umstieg</em>`;
      }

      li.innerHTML = `
        <strong>${fromName}</strong> → <strong>${toName}</strong><br>
        🕒 Abfahrt: ${depTime}<br>
        🕕 Ankunft: ${arrTime}<br>
        ⏱️ Dauer: ${conn.duration || "–"}
        ${transferHTML}
      `;

      connectionsList.appendChild(li);
    });

  } catch (err) {
    loader.classList.add("hidden");
    connectionsList.innerHTML = `<li style="color:red;">Fehler beim Abrufen der Fahrplandaten.</li>`;
  }
});

/* -----------------------------------
   KARUSSELL MIT PFEILEN
----------------------------------- */

const track = document.getElementById("carouselTrack");
const prevBtn = document.getElementById("prevBtn");
const nextBtn2 = document.getElementById("nextBtn2");

let currentIndex = 0;
const totalSlides = 3;

function updateSlide() {
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
}

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
  updateSlide();
});

nextBtn2.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % totalSlides;
  updateSlide();
});
