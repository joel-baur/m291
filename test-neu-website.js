// Hilfsfunktionen
const byId = (id) => document.getElementById(id);

function showError(msg){
  const box = byId("errorSummary");
  box.textContent = msg;
  box.classList.remove("is-hidden");
}

function clearError(){
  const box = byId("errorSummary");
  box.textContent = "";
  box.classList.add("is-hidden");
}

const fmt2 = (n) => n.toString().padStart(2, "0");

function ensureDefaults(){
  const dateEl = byId("date");
  const timeEl = byId("time");
  const now = new Date();

  if(!dateEl.value){
    const y = now.getFullYear();
    const m = fmt2(now.getMonth() + 1);
    const d = fmt2(now.getDate());
    dateEl.value = y + "-" + m + "-" + d;
  }
  if(!timeEl.value){
    const hh = fmt2(now.getHours());
    const mm = fmt2(now.getMinutes());
    timeEl.value = hh + ":" + mm;
  }
}

function formatDateForApi(yyyyMmDd){
  const parts = yyyyMmDd.split("-");
  if(parts.length !== 3) return "";
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  return d + "." + m + "." + y; // DD.MM.YYYY
}

function formatTimeLabel(dateTimeString){
  if(!dateTimeString || typeof dateTimeString !== "string") return "–";
  if(dateTimeString.length >= 16){
    return dateTimeString.slice(11, 16);
  }
  return dateTimeString;
}

function humanDurationFromSeconds(seconds){
  if(!seconds || isNaN(seconds)) return "–";
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return (h ? h + " h " : "") + m + " min";
}

// Elemente
const form = byId("routeForm");
const searchBtn = byId("searchBtn");
const fromInput = byId("from");
const toInput = byId("to");
const fromSuggest = byId("from-suggest");
const toSuggest = byId("to-suggest");
const resultsSection = byId("results");
const resultsList = byId("resultsList");

const ROUTE_ENDPOINT = "https://search.ch/timetable/api/route.json";
const COMPLETION_ENDPOINT = "https://search.ch/timetable/api/completion.json";

// Autocomplete
function handleAutocomplete(kind){
  const input = kind === "from" ? fromInput : toInput;
  const datalist = kind === "from" ? fromSuggest : toSuggest;

  if(!input || !datalist) return;
  const term = input.value.trim();
  if(term.length < 2){
    datalist.innerHTML = "";
    return;
  }

  const xhr = new XMLHttpRequest();
  const url = COMPLETION_ENDPOINT + "?term=" + encodeURIComponent(term);
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function(){
    if(xhr.readyState === 4 && xhr.status === 200){
      try{
        const data = JSON.parse(xhr.responseText);
        datalist.innerHTML = "";
        if(Array.isArray(data)){
          data.forEach(function(item){
            if(!item.label) return;
            const opt = document.createElement("option");
            opt.value = item.label;
            datalist.appendChild(opt);
          });
        }
      }catch(e){
        console.error("Fehler beim Lesen der Vorschläge", e);
      }
    }
  };
  xhr.send();
}

fromInput.addEventListener("input", () => handleAutocomplete("from"));
toInput.addEventListener("input", () => handleAutocomplete("to"));

// Resultate rendern
function clearResults(){
  resultsList.innerHTML = "";
}

function renderConnections(data){
  clearResults();

  if(!data || !Array.isArray(data.connections) || data.connections.length === 0){
    const li = document.createElement("li");
    li.className = "result-item";
    li.textContent = "Keine Verbindungen gefunden.";
    resultsList.appendChild(li);
    resultsSection.classList.remove("is-hidden");
    return;
  }

  data.connections.forEach(function(c){
    const legs = Array.isArray(c.legs) ? c.legs : [];
    const first = legs[0];
    const last = legs[legs.length - 1];

    const dep = c.from_time || (first && first.departure) || "";
    const arr = c.to_time || (last && last.arrival) || "";

    const depLabel = formatTimeLabel(dep);
    const arrLabel = formatTimeLabel(arr);

    const transfers = legs.length ? Math.max(legs.length - 1, 0) : 0;
    const durationText = humanDurationFromSeconds(c.duration);

    // Haupt-Item
    const li = document.createElement("li");
    li.className = "result-item";

    const title = document.createElement("p");
    title.className = "result-title";
    title.textContent = depLabel + " → " + arrLabel;

    const meta = document.createElement("p");
    meta.className = "result-meta";
    meta.textContent = "Dauer: " + durationText + " · Umstiege: " + transfers;

    li.appendChild(title);
    li.appendChild(meta);

    // Details-Container
    const details = document.createElement("div");
    details.className = "connection-details is-hidden";

    legs.forEach(function(leg){
      const legDiv = document.createElement("div");
      const depTime = formatTimeLabel(leg.departure);
      const arrTime = formatTimeLabel(leg.arrival);
      const from = leg.from || "–";
      const to = leg.to || "–";
      const line = leg.line || "–";
      const platform = leg.platform ? `Gleis ${leg.platform}` : "";

      legDiv.textContent = `${depTime} ${from} → ${arrTime} ${to} (${line}) ${platform}`;
      details.appendChild(legDiv);
    });

    li.appendChild(details);

    // Klick für Details ein-/ausblenden
    li.addEventListener("click", () => {
      details.classList.toggle("is-hidden");
    });

    resultsList.appendChild(li);
  });

  resultsSection.classList.remove("is-hidden");
}

// Formular-Submit
form.addEventListener("submit", function(e){
  e.preventDefault();
  clearError();
  clearResults();

  const from = fromInput.value.trim();
  const to = toInput.value.trim();

  if(from.length < 2 || to.length < 2){
    showError('Bitte geben Sie "Von" und "Bis" ein (mindestens 2 Zeichen).');
    return;
  }

  ensureDefaults();
  const dateValue = byId("date").value;
  const timeValue = byId("time").value;

  const dateForApi = formatDateForApi(dateValue);
  const timeForApi = timeValue ? timeValue.replace(":", "") : "";

  let url = ROUTE_ENDPOINT +
    "?from=" + encodeURIComponent(from) +
    "&to=" + encodeURIComponent(to);

  if(dateForApi){
    url += "&date=" + encodeURIComponent(dateForApi);
  }
  if(timeForApi){
    url += "&time=" + encodeURIComponent(timeForApi);
  }
  url += "&num=5";

  searchBtn.disabled = true;
  const oldLabel = searchBtn.textContent;
  searchBtn.textContent = "Suchen…";

  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function(){
    if(xhr.readyState === 4){
      searchBtn.disabled = false;
      searchBtn.textContent = oldLabel;

      if(xhr.status === 200){
        try{
          const data = JSON.parse(xhr.responseText);
          renderConnections(data);
        }catch(err){
          console.error(err);
          clearResults();
          const li = document.createElement("li");
          li.className = "result-item";
          li.textContent = "Die Antwort der API konnte nicht gelesen werden.";
          resultsList.appendChild(li);
          resultsSection.classList.remove("is-hidden");
        }
      }else{
        clearResults();
        const li = document.createElement("li");
        li.className = "result-item";
        li.textContent = "Die Abfrage ist fehlgeschlagen (Status " + xhr.status + "). Bitte später erneut versuchen.";
        resultsList.appendChild(li);
        resultsSection.classList.remove("is-hidden");
      }
    }
  };
  xhr.send();
});
