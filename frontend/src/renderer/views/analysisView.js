import { state } from "../store/store.js";
import { showUploadView } from "./uploadView.js";

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
      <div style="text-align: center; padding: 2rem; color: #b00; font-weight: bold;">
        ❗ No file uploaded yet.
      </div>
      <div style="text-align: center; margin-top: 2rem;">
        <button id="back-button" style="background-color: #e5e7eb; color: #111827; border: none; padding: 0.6rem 1.5rem; border-radius: 6px; cursor: pointer;">
          ⬅️ Back
        </button>
      </div>`;
    document.getElementById("back-button")?.addEventListener("click", () => {
      showUploadView();
    });
    return;
  }

  const analysis = state.analysisResults;
  if (!analysis) {
    view.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #999;">
        🕵️ Analyzing PDF... Please wait.
      </div>
      <div style="text-align: center; margin-top: 2rem;">
        <button id="back-button" style="background-color: #e5e7eb; color: #111827; border: none; padding: 0.6rem 1.5rem; border-radius: 6px; cursor: pointer;">
          ⬅️ Back
        </button>
      </div>`;
    document.getElementById("back-button")?.addEventListener("click", () => {
      showUploadView();
    });
    return;
  }

  const { page_count, word_count, char_count, speakers, full_text } = analysis;

  view.innerHTML = `
    <button id="back-button" class="back-button" style="margin-bottom: 1rem;">⬅️ Back</button>

    <div style="max-width: 800px; margin: 2rem auto; background: #fff; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
      <h2 style="text-align: center; color: #333;">🧠 PDF Analysis</h2>

      <div style="margin-top: 1.5rem; font-size: 1rem;">
        <p><strong>📄 Page Count:</strong> ${page_count}</p>
        <p><strong>📝 Word Count:</strong> ${word_count}</p>
        <p><strong>🔠 Character Count:</strong> ${char_count}</p>
        <p><strong>🗣️ Speakers Detected:</strong> ${speakers.length > 0 ? speakers.join(", ") : "None"}</p>
      </div>

      <div style="margin-top: 2rem;">
        <h3 style="margin-bottom: 0.5rem; color: #555;">📚 Text Preview</h3>
        <div style="max-height: 300px; overflow-y: auto; border: 1px solid #ccc; padding: 1rem; border-radius: 6px; background: #fafafa; font-family: monospace;">
          ${full_text?.slice(0, 1500) || "No preview available..."}${full_text && full_text.length > 1500 ? "..." : ""}
        </div>
      </div>

      <div style="text-align: center; margin-top: 2rem;">
        <button id="continue-to-voice" style="padding: 0.75rem 1.5rem; background-color: #28a745; color: white; font-weight: bold; border: none; border-radius: 8px; cursor: pointer;">
          ➡️ Continue to Voice Setup
        </button>
      </div>
    </div>
  `;

  document.getElementById("back-button")?.addEventListener("click", () => {
    showUploadView();
  });

  const continueButton = document.getElementById("continue-to-voice");
  if (continueButton) {
    continueButton.addEventListener("click", () => {
      import("./voiceView.js").then(({ showVoiceView }) => {
        showVoiceView();
      });
    });
  }
}
