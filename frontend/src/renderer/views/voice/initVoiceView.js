import { loadTranscriptPreview } from "./transcriptPreview.js";
import { handleModelSelection } from "./modelSelector.js";
import { renderSpeakerTable } from "./tableGenerator.js";
import { setupEventHandlers } from "./eventHandlers.js";
import { renderVoiceViewLayout } from "./layout.js";
import { state } from "../../store/store.js";  

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

  // Load transcript preview (markdown)
  loadTranscriptPreview();

  // Set up TTS model selector logic
  handleModelSelection();

  // Set up dynamic speaker table (instead of block fields)
  const container = document.getElementById("speaker-table-container");
  if (container) renderSpeakerTable(container);

  // Handle generate, back, sample preview buttons
  setupEventHandlers();
}
