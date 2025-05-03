import { showVoiceView } from "./voice/index.js";
import { registerViewTransition } from "./common/backNavigation.js";

export function initProgressView(stats = null) {
  const progressView = document.getElementById("progress-view");

  progressView.innerHTML = `
    <div class="progress-container">
      <h2>🎧 Generating Podcast...</h2>
      <progress id="progress-bar" value="0" max="100"></progress>
      <p id="progress-status" class="progress-status">Initializing...</p>

      <div class="centered" style="margin-top: 2rem;">
        <button id="back-button" class="back-button">⬅️ Back</button>
      </div>

      <div id="pdf-stats" class="pdf-stats" hidden>
        <h3>📊 PDF Stats:</h3>
        <p id="stat-pages"></p>
        <p id="stat-words"></p>
        <p id="stat-keywords"></p>
      </div>
    </div>
  `;

  // Back button navigation
  document.getElementById("back-button")?.addEventListener("click", () => {
    showVoiceView();
  });

  // If stats are available, populate them
  if (stats) {
    const statsContainer = document.getElementById("pdf-stats");
    document.getElementById("stat-pages").innerText = `📄 Pages: ${stats.pageCount}`;
    document.getElementById("stat-words").innerText = `📝 Words: ${stats.wordCount}`;
    document.getElementById("stat-keywords").innerText = `🔍 Keywords: ${stats.topKeywords?.join(", ")}`;
    statsContainer.hidden = false;
  }

  registerViewTransition("progress-view");
}

export function updateProgress(value, message = "") {
  const progressEl = document.getElementById("progress-bar");
  const statusEl = document.getElementById("progress-status");

  if (progressEl) progressEl.value = value;
  if (statusEl) statusEl.innerText = message;
}

export function showProgressView(stats = null) {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = true;
  });

  const progressView = document.getElementById("progress-view");
  if (progressView) {
    progressView.hidden = false;
    initProgressView(stats);
  } else {
    console.error("Progress view element not found!");
  }
}
