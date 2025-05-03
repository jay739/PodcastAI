import { state } from "../store/store.js";
import { showUploadView } from "./uploadView.js";
import { registerViewTransition } from "./common/backNavigation.js";

export function showAnalysisView() {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = true;
  });

  const analysisView = document.getElementById("analysis-view");
  if (analysisView) {
    analysisView.hidden = false;
    initAnalysisView();
  } else {
    console.error("Analysis view element not found!");
  }
}

export function initAnalysisView() {
  const view = document.getElementById("analysis-view");
  view.innerHTML = "";

  const fileID = state.currentFile?.id;

  if (!fileID) {
    view.innerHTML = `
      <div class="error-message centered">
        ❗ No file uploaded yet.
      </div>
      <div class="centered" style="margin-top: 2rem;">
        <button id="back-button" class="back-button">⬅️ Back</button>
      </div>`;
    document.getElementById("back-button")?.addEventListener("click", () => {
      showUploadView();
    });
    return;
  }

  const analysis = state.analysisResults;
  if (!analysis) {
    view.innerHTML = `
      <div class="info-message centered">
        🕵️ Analyzing PDF... Please wait.
      </div>
      <div class="centered" style="margin-top: 2rem;">
        <button id="back-button" class="back-button">⬅️ Back</button>
      </div>`;
    document.getElementById("back-button")?.addEventListener("click", () => {
      showUploadView();
    });
    return;
  }

  const { page_count, word_count, char_count, speakers, full_text } = analysis;

  view.innerHTML = `
    <button id="back-button" class="back-button">⬅️ Back</button>

    <div class="analysis-container">
      <h2 class="title">🧠 PDF Analysis</h2>

      <div class="analysis-details">
        <p><strong>📄 Page Count:</strong> ${page_count}</p>
        <p><strong>📝 Word Count:</strong> ${word_count}</p>
        <p><strong>🔠 Character Count:</strong> ${char_count}</p>
        <p><strong>🗣️ Speakers Detected:</strong> ${speakers.length > 0 ? speakers.join(", ") : "None"}</p>
      </div>

      <div class="text-preview">
        <h3>📚 Text Preview</h3>
        <div class="preview-box">
          ${full_text?.slice(0, 1500) || "No preview available..."}${full_text && full_text.length > 1500 ? "..." : ""}
        </div>
      </div>

      <div class="centered" style="margin-top: 2rem;">
        <button id="continue-to-voice" class="primary-btn">➡️ Continue to Voice Setup</button>
      </div>
    </div>
  `;

  document.getElementById("back-button")?.addEventListener("click", () => {
    showUploadView();
  });

  document.getElementById("continue-to-voice")?.addEventListener("click", async () => {
    const { initVoiceView } = await import("./voice/initVoiceView.js");
    const { showVoiceView } = await import("./voice/index.js");
    initVoiceView();
    showVoiceView();
  });

  registerViewTransition("analysis-view");
}
