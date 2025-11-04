const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const nextBtn = document.getElementById('nextBtn');
const form = document.getElementById('fahrplanForm');
const results = document.getElementById('results');
const connectionsList = document.getElementById('connections');

// --- Vorschläge laden ---
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

// --- Autocomplete aktivieren ---
document.getElementById("from").addEventListener("input", (e) => {
  fetchSuggestions(e.target.value, document.getElementById("fromSuggestions"));
});

document.getElementById("to").addEventListener("input", (e) => {
  fetchSuggestions(e.target.value, document.getElementById("toSuggestions"));
});

// --- Schritt 1 → Schritt 2 ---
nextBtn.addEventListener('click', () => {
  const from = document.getElementById('from');
  const to = document.getElementById('to');
  const fromError = document.getElementById('fromError');
  const toError = document.getElementById('toError');

  let valid = true;

  if (from.value.length < 3) {
    fromError.style.display = 'block';
    valid = false;
  } else fromError.style.display = 'none';

  if (to.value.length < 3) {
    toError.style.display = 'block';
    valid = false;
  } else toError.style.display = 'none';

  if (valid) {
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
  }
});

// --- API Abfrage ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const from = document.getElementById('from').value.trim();
  const to = document.getElementById('to').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

  if (!from || !to || !date || !time) {
    alert("Bitte alle Felder ausfüllen.");
    return;
  }

  // URL nach search.ch-Doku aufbauen
  const url = `https://fahrplan.search.ch/api/route.json?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&time=${time}&num=4`;

  connectionsList.innerHTML = "<li>Lade Verbindungen...</li>";
  results.classList.remove('hidden');

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();

    if (!data.connections || data.connections.length === 0) {
      connectionsList.innerHTML = "<li>Keine Verbindung gefunden.</li>";
      return;
    }

    connectionsList.innerHTML = "";
    data.connections.forEach((conn) => {
      const li = document.createElement('li');
      const depTime = conn.from.departure.split("T")[1].substring(0,5);
      const arrTime = conn.to.arrival.split("T")[1].substring(0,5);
      const duration = conn.duration.replace('00d', '').trim();

      li.innerHTML = `
        <strong>${conn.from.location.name}</strong> → <strong>${conn.to.location.name}</strong><br>
        🕒 Abfahrt: ${depTime}<br>
        🕕 Ankunft: ${arrTime}<br>
        ⏱️ Dauer: ${duration}
      `;
      connectionsList.appendChild(li);
    });
  } catch (err) {
    console.error("API Fehler:", err);
    connectionsList.innerHTML = `<li style="color:red;">Fehler beim Abrufen der Fahrplandaten.</li>`;
  }
});
