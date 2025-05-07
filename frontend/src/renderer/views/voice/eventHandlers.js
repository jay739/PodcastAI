import { showProgressView } from "../progressView.js";
import { podcastAPI } from "../../api/apiToggle.js";
import { state } from "../../store/store.js";
import { renderSpeakerTable } from "./tableGenerator.js";
import { loadTranscriptPreview } from "./transcriptPreview.js";

let currentMode = "table";

export function setupEventHandlers() {
  const status = document.getElementById("voice-status");
  const toggleBtn = document.getElementById("toggle-view-mode");
  const tableContainer = document.getElementById("speaker-table-container");

  // Toggle view mode
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      currentMode = currentMode === "table" ? "form" : "table";
      renderSpeakerTable(tableContainer);
    });
  }

  // Add speaker
  document.getElementById("add-speaker")?.addEventListener("click", () => {
    if (state.speakers.length >= 5) {
      status.innerText = "⚠️ Maximum of 5 speakers allowed.";
      return;
    }
    state.speakers.push({ name: "", gender: "male", tone: "neutral" });
    renderSpeakerTable(tableContainer);
  });

  // Remove speaker
  document.addEventListener("click", (e) => {
    if (e.target?.classList?.contains("remove-speaker-btn")) {
      const index = parseInt(e.target.dataset.index, 10);
      if (!isNaN(index)) {
        state.speakers.splice(index, 1);
        renderSpeakerTable(tableContainer);
      }
    }
  });

  // Generate podcast
  document.getElementById("generate-voice")?.addEventListener("click", async () => {
    const speakerCount = state.speakers.length;
    const newSpeakers = [];
    let valid = true;

    for (let i = 0; i < speakerCount; i++) {
      const nameEl = document.getElementById(`table-name-${i}`);
      const genderEl = document.getElementById(`table-gender-${i}`);
      const toneEl = document.getElementById(`table-tone-${i}`);
      const warnId = `warn-${i}`;

      document.getElementById(warnId)?.remove();

      const name = nameEl?.value?.trim();
      const gender = genderEl?.value;
      const tone = toneEl?.value;

      if (!name) {
        const warn = document.createElement("div");
        warn.innerText = "❗ Name required";
        warn.id = warnId;
        warn.style.color = "#b91c1c";
        warn.style.fontSize = "0.8rem";
        nameEl?.parentElement?.appendChild(warn);
        valid = false;
        continue;
      }

      newSpeakers.push({ name, gender, tone });
    }

    if (!valid) {
      status.innerText = "❗ Please fix errors before proceeding.";
      return;
    }

    const host = document.getElementById("host-selector")?.value;
    if (!host) {
      status.innerText = "❗ Please select a host.";
      return;
    }

    const model = document.getElementById("tts-model-select")?.value || "bark";

    try {
      // Add spinner
      status.innerHTML = `<span class="spinner"></span> 🧠 Synthesizing audio...`;

      const result = await podcastAPI.podcast.generate({
        fileID: state.currentFile.id,
        speakers: newSpeakers,
        host,
        tts_model: model
      });

      status.innerHTML = "✅ Audio generated! Loading transcript...";

      setTimeout(async () => {
        const preview = document.getElementById("transcript-preview");
        preview.style.display = "block";

        await loadTranscriptPreview();

        // Scroll to transcript section
        preview.scrollIntoView({ behavior: "smooth", block: "start" });

        status.innerHTML += "<br>📖 Transcript loaded below.";
      }, 1500);
    } catch (err) {
      console.error("Error during generation:", err);
      status.innerText = "❌ Generation failed. Check console.";
    }
  });

  // Back
  document.getElementById("back-button")?.addEventListener("click", () => {
    import("./uploadView.js").then(({ showUploadView }) => showUploadView());
  });
}
