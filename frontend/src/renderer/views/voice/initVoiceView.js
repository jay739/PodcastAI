import { loadTranscriptPreview } from "./transcriptPreview.js";
import { handleModelSelection } from "./modelSelector.js";
import { renderSpeakerTable } from "./tableGenerator.js";
import { setupEventHandlers } from "./eventHandlers.js";
import { renderVoiceViewLayout } from "./layout.js";
import { state } from "../../store/store.js";
import { setupBackButton } from "../common/backNavigation.js";

let isTableView = true;

export function initVoiceView() {
  const voiceView = document.getElementById("voice-view");
  const fileID = state.currentFile?.id;

  if (!fileID) {
    voiceView.innerHTML = `
      <div style="padding: 2rem; color: #b91c1c; font-weight: bold; text-align: center;">
        ❗ No file selected. Please upload a PDF to proceed.
      </div>`;
    return;
  }

  // Inject base layout HTML
  voiceView.innerHTML = renderVoiceViewLayout();

  // ✅ Ensure at least one blank row exists
  if (!state.speakers || state.speakers.length === 0) {
    state.speakers = [{ name: "", gender: "male", tone: "neutral" }];
  }

  // Set up TTS model selector logic
  handleModelSelection();

  // Render speaker input table
  const container = document.getElementById("speaker-table-container");
  renderSpeakerTable(container, "table");

  // Set up event listeners
  setupEventHandlers();

  // Toggle View Mode Logic
  const toggleViewBtn = document.getElementById("toggle-view-mode");
  toggleViewBtn.disabled = false;  

  toggleViewBtn?.addEventListener("click", () => {
    document.activeElement?.blur();

    setTimeout(() => {
      const rows = Array.from(document.querySelectorAll("#speaker-table-body tr"));

      if (isTableView) {
        // Save speaker data from table
        state.speakers = rows.map((row, i) => ({
          name: row.querySelector('input')?.value.trim() || "",
          gender: row.querySelector(`#table-gender-${i}`)?.value || "neutral",
          tone: row.querySelector(`#table-tone-${i}`)?.value || "neutral"
        }));
      }

      // Always keep one empty row
      if (!state.speakers || state.speakers.length === 0) {
        state.speakers = [{ name: "", gender: "male", tone: "neutral" }];
      }

      isTableView = !isTableView;
      renderSpeakerTable(container, isTableView ? "table" : "text");

      toggleViewBtn.textContent = isTableView
        ? "🧮 Switch to Text Mode"
        : "📋 Switch to Table Mode";
    }, 0);
  });
  setupBackButton("back-button");

}
