import { initVoiceView } from "./voice/initVoiceView.js";

export function initResultsView() {
  const resultsView = document.getElementById("results-view");

  resultsView.innerHTML = `
    <div style="max-width: 800px; margin: 2rem auto;">
      <h2 style="text-align: center; color: #333;">📊 Podcast Results</h2>

      <div style="margin-top: 2rem;">
        <audio id="podcast-audio" controls style="width: 100%;">
          <source id="audio-src" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>

      <div id="transcript-lines" style="margin-top: 2rem; padding: 1rem; background: #f9fafb; border-radius: 10px; border: 1px solid #ddd; font-family: monospace; max-height: 300px; overflow-y: auto;">
        <p>🎙️ Transcript will appear here...</p>
      </div>

      <div id="results-container" style="margin-top: 2rem; font-size: 0.95rem; color: #555;">
        <p>📁 Awaiting status update...</p>
      </div>

      <div style="text-align: center; margin-top: 2rem;">
        <button id="back-button" style="background-color: #e5e7eb; color: #111827; border: none; padding: 0.6rem 1.5rem; border-radius: 6px; cursor: pointer;">
          ⬅️ Back to Voice Setup
        </button>
      </div>
    </div>
  `;

  const audioElem = document.getElementById("podcast-audio");
  const audioSrc = document.getElementById("audio-src");

  if (window.currentJobId) {
    audioSrc.src = `http://localhost:5001/audio/${window.currentJobId}.mp3`;
    audioElem.load();
  }

  fetch(`http://localhost:5001/arc/${window.currentJobId}.json`)
    .then((res) => res.json())
    .then((lines) => {
      const transcriptContainer = document.getElementById("transcript-lines");
      transcriptContainer.innerHTML = "";

      lines.forEach((entry) => {
        const div = document.createElement("div");
        div.innerText = `[${entry.timestamp}] ${entry.speaker}: ${entry.text}`;
        div.style.cursor = "pointer";
        div.style.marginBottom = "0.5rem";

        div.onclick = () => {
          const [min, sec] = entry.timestamp.replace("[", "").replace("]", "").split(":").map(Number);
          audioElem.currentTime = min * 60 + sec;
          audioElem.play();
        };

        transcriptContainer.appendChild(div);
      });
    })
    .catch((err) => {
      const transcriptContainer = document.getElementById("transcript-lines");
      transcriptContainer.innerHTML = `<p style="color: red;">❌ Transcript not found.</p>`;
      console.warn("Transcript not found:", err);
    });

  const backBtn = document.getElementById("back-button");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showVoiceView();
    });
  }

  window.displayResults = async () => {
    const jobId = window.currentJobId;
    if (!jobId) return;

    try {
      const response = await fetch(`http://localhost:5001/status/${jobId}`);
      const result = await response.json();

      const resultsContainer = document.getElementById("results-container");
      resultsContainer.innerText = JSON.stringify(result, null, 2);
    } catch (err) {
      document.getElementById("results-container").innerText = "⚠️ Failed to load results.";
    }
  };
}

export function showResultsView() {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = true;
  });

  const resultsView = document.getElementById("results-view");
  if (resultsView) {
    resultsView.hidden = false;

    initResultsView();

    if (typeof window.displayResults === "function") {
      window.displayResults();
    }
  } else {
    console.error("Results view element not found!");
  }
}
