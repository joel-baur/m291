// -------------------------------------------------
// DOM-ELEMENTE
// -------------------------------------------------
const step2 = document.getElementById("step2");
const nextBtn = document.getElementById("nextBtn");
const form = document.getElementById("fahrplanForm");
const results = document.getElementById("results");
const connectionsList = document.getElementById("connections");
const loader = document.getElementById("loader");

// -------------------------------------------------
// HILFSFUNKTIONEN
// -------------------------------------------------
function formatTime(time) {
  if (!time) return "–";
  const d = new Date(time);
  return isNaN(d)
    ? "–"
    : d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return "–";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

const safeArray = v => Array.isArray(v) ? v : [];

// -------------------------------------------------
// AUTOCOMPLETE
// -------------------------------------------------
async function fetchSuggestions(term, target) {
  if (term.length < 3) {
    target.innerHTML = "";
    return;
  }

  const res = await fetch(
    `https://fahrplan.search.ch/api/completion.json?term=${encodeURIComponent(term)}`
  );
  const data = await res.json();

  target.innerHTML = "";
  data.forEach(item => {
    const div = document.createElement("div");
    div.textContent = item.label;
    div.onclick = () => {
      target.previousElementSibling.value = item.label;
      target.innerHTML = "";
    };
    target.appendChild(div);
  });
}

document.getElementById("from").addEventListener("input", e =>
  fetchSuggestions(e.target.value, document.getElementById("fromSuggestions"))
);
document.getElementById("to").addEventListener("input", e =>
  fetchSuggestions(e.target.value, document.getElementById("toSuggestions"))
);

// -------------------------------------------------
// VALIDIERUNG
// -------------------------------------------------
async function isValidPlace(term) {
  const res = await fetch(
    `https://fahrplan.search.ch/api/completion.json?term=${encodeURIComponent(term)}`
  );
  const data = await res.json();
  return data.some(i => i.label.toLowerCase() === term.toLowerCase());
}

function setInputValidity(input, valid) {
  input.classList.toggle("valid", valid);
  input.classList.toggle("invalid", !valid);
}

// -------------------------------------------------
// STEP 1 → STEP 2
// -------------------------------------------------
nextBtn.addEventListener("click", async () => {
  const from = document.getElementById("from");
  const to = document.getElementById("to");

  const fromValid = await isValidPlace(from.value.trim());
  const toValid = await isValidPlace(to.value.trim());

  setInputValidity(from, fromValid);
  setInputValidity(to, toValid);

  if (fromValid && toValid) {
    step2.classList.remove("hidden");
    nextBtn.style.display = "none";
  }
});

// -------------------------------------------------
// FAHRPLAN
// -------------------------------------------------
form.addEventListener("submit", async e => {
  e.preventDefault();

  const from = document.getElementById("from").value.trim();
  const to = document.getElementById("to").value.trim();
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;

  const url =
    `https://fahrplan.search.ch/api/route.json` +
    `?from=${encodeURIComponent(from)}` +
    `&to=${encodeURIComponent(to)}` +
    `&date=${date}&time=${time}` +
    `&time_type=depart&num=4`;

  connectionsList.innerHTML = "";
  results.classList.remove("hidden");
  loader.classList.remove("hidden");

  try {
    const res = await fetch(url);
    const data = await res.json();
    loader.classList.add("hidden");

    const connections = safeArray(data.connections);
    if (!connections.length) {
      connectionsList.innerHTML = "<li>Keine Verbindung gefunden.</li>";
      return;
    }

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
          // Ankunft zuverlässig aus 'to.time' oder 'leg.arrival'
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

      // Ankunft auf Gesamtverbindung: letzte Ankunft des letzten Legs
      const overallArrival = formatTime(conn.arrival || rideLegs[rideLegs.length - 1]?.to?.time);

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
// KARUSSELL
// -------------------------------------------------
const track = document.getElementById("carouselTrack");
const prevBtn = document.getElementById("prevBtn");
const nextBtn2 = document.getElementById("nextBtn2");

let currentIndex = 0;
const totalSlides = 3;

function updateSlide() {
  track.style.transform = `translateX(-${currentIndex * 100}%)`;
}

prevBtn.onclick = () => {
  currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
  updateSlide();
};

nextBtn2.onclick = () => {
  currentIndex = (currentIndex + 1) % totalSlides;
  updateSlide();
};
