import { showVoiceView } from "./voice/index.js";
import { registerViewTransition } from "../views/common/backNavigation.js";

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
        <button id="back-button" class="back-button">⬅️ Back to Voice Setup</button>
      </div>
    </div>
  `;

  const audioElem = document.getElementById("podcast-audio");
  const audioSrc = document.getElementById("audio-src");

  const jobId = window.currentJobId;

  if (jobId) {
    audioSrc.src = `http://localhost:5001/audio/${jobId}.mp3`;
    audioElem.load();

    fetch(`http://localhost:5001/arc/${jobId}.json`)
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
        console.warn("Transcript fetch failed:", err);
      });

    fetch(`http://localhost:5001/status/${jobId}`)
      .then((res) => res.json())
      .then((result) => {
        const resultsContainer = document.getElementById("results-container");
        resultsContainer.innerText = JSON.stringify(result, null, 2);
      })
      .catch(() => {
        document.getElementById("results-container").innerText = "⚠️ Failed to load results.";
      });
  }

  document.getElementById("back-button")?.addEventListener("click", () => {
    showVoiceView();
  });

  registerViewTransition("results-view");
}

export function showResultsView() {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = true;
  });

  const resultsView = document.getElementById("results-view");
  if (resultsView) {
    resultsView.hidden = false;
    initResultsView();
  } else {
    console.error("Results view element not found!");
  }
}
