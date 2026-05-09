let words = [];
let categoryColours = {};
let voices = [];
let selectedVoice = null;

let welcomePlayed = false;

// ---- GUARANTEED ONE-TIME WELCOME ----
function playWelcome() {
  if (welcomePlayed) return;
  welcomePlayed = true;
  speak("Hello Hazel");
}

// Trigger welcome - to prevent later delay on tile click
window.addEventListener("pointerdown", playWelcome, { once: true });


// ---- VOICE LOADING ----
function loadVoices() {
  voices = speechSynthesis.getVoices();

  selectedVoice =
    voices.find(v => v.name.includes("Hazel")) ||
    voices.find(v => v.lang === "en-GB") ||
    voices[0];
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();


// ---- SPEAK FUNCTION ----
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-GB";
  utterance.rate = 0.8;
  utterance.pitch = 1.2;

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}


// ---- LOAD MAP DATA ----
async function loadMatData() {
  const response = await fetch("mat-data.txt");
  const text = await response.text();

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  let currentCategory = null;
  let currentColour = null;

  const data = {
    subtitle: "",
    categories: {},
    words: []
  };

  lines.forEach(line => {
    if (line.startsWith("SUBTITLE:")) {
      data.subtitle = line.replace("SUBTITLE:", "").trim();
    } else if (line.startsWith("CATEGORY:")) {
      const parts = line.replace("CATEGORY:", "").trim().split("|");
      currentCategory = parts[0].trim();
      currentColour = parts[1] ? parts[1].trim() : "#ffffff";
      data.categories[currentCategory] = currentColour;
    } else {
      const [word, icon] = line.split("|").map(s => s.trim());
      data.words.push({ word, icon, category: currentCategory });
    }
  });

  return data;
}


// ---- RENDER PANELS ----
function renderPanels() {
  const panelContainer = document.getElementById("panels");
  panelContainer.innerHTML = "";

  const dropdown = document.getElementById("categoryFilter");
  dropdown.innerHTML = `<option value="all">All categories</option>`;

  const containers = {};

  Object.keys(categoryColours).forEach(cat => {
    const safeId = cat.replace(/\s+/g, "-").toLowerCase();

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.id = `panel-${safeId}`;
    panel.style.background = categoryColours[cat];

    panel.innerHTML = `
      <h2>${cat}</h2>
      <div class="mat" id="mat-${safeId}"></div>
    `;

    panelContainer.appendChild(panel);
    containers[cat] = panel.querySelector(`#mat-${safeId}`);

    dropdown.innerHTML += `<option value="${safeId}">${cat}</option>`;
  });

  words.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.tabIndex = 0;

    card.innerHTML = `
      <div class="icon">${item.icon}</div>
      <div class="word">${item.word}</div>
    `;

    card.addEventListener("click", () => {
      card.classList.toggle("selected");
      speak(item.word);
    });

    containers[item.category].appendChild(card);
  });
}


// ---- FILTER ----
function applyHighlight(filter) {
  const panels = document.querySelectorAll(".panel");

  if (filter === "all") {
    panels.forEach(panel => panel.style.display = "block");
    return;
  }

  panels.forEach(panel => {
    if (panel.id === `panel-${filter}`) {
      panel.style.display = "block";
    } else {
      panel.style.display = "none";
    }
  });
}


// ---- RESET ----
function resetAll() {
  speak("Reset");
  document.querySelectorAll(".card").forEach(c => c.classList.remove("selected"));
  document.querySelectorAll(".panel").forEach(p => p.style.display = "block");
  document.getElementById("categoryFilter").value = "all";
  document.getElementById("status").textContent = "";
}

document.getElementById("categoryFilter").addEventListener("change", e => {
  applyHighlight(e.target.value);
});

document.getElementById("resetBtn").addEventListener("click", resetAll);


// ---- INIT ----
loadMatData().then(data => {
  document.getElementById("subTitle").textContent = data.subtitle;

  words = data.words;
  categoryColours = data.categories;

  renderPanels();
});
