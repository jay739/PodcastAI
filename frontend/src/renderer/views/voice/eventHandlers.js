// eventHandlers.js

import { showProgressView } from "../progressView.js";
import { podcastAPI } from "../../api/apiToggle.js";
import { state } from "../../store/store.js";
import { renderSpeakerTable } from "./tableGenerator.js";

let currentMode = "table"; // default view mode

export function setupEventHandlers() {
  const status = document.getElementById("voice-status");
  const toggleBtn = document.getElementById("toggle-view-mode");
  const tableContainer = document.getElementById("speaker-table-container");

  // Handle toggle between table/form view
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      currentMode = currentMode === "table" ? "form" : "table";
      renderSpeakerTable(tableContainer);
    });
  }

  // Add Speaker Row
  document.getElementById("add-speaker")?.addEventListener("click", () => {
    if (state.speakers.length >= 5) {
      status.innerText = "⚠️ Maximum of 5 speakers allowed.";
      return;
    }
    state.speakers.push({ name: "", gender: "male", tone: "neutral" });
    renderSpeakerTable(tableContainer);
  });

  // Remove Speaker Row (delegated from tableGenerator via buttons)
  document.addEventListener("click", (e) => {
    if (e.target?.classList?.contains("remove-speaker-btn")) {
      const index = parseInt(e.target.dataset.index, 10);
      if (!isNaN(index)) {
        state.speakers.splice(index, 1);
        renderSpeakerTable(tableContainer);
      }
    }
  });

  // Generate Podcast
  document.getElementById("generate-voice")?.addEventListener("click", async () => {
    const speakerCount = state.speakers.length;
    const newSpeakers = [];
    let valid = true;

    for (let i = 0; i < speakerCount; i++) {
      const nameEl = document.getElementById(`table-name-${i}`);
      const genderEl = document.getElementById(`table-gender-${i}`);
      const toneEl = document.getElementById(`table-tone-${i}`);
      const warnId = `warn-${i}`;

      const name = nameEl?.value?.trim();
      const gender = genderEl?.value;
      const tone = toneEl?.value;

      // Clear old warnings
      document.getElementById(warnId)?.remove();

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
      status.innerText = "⏳ Generating podcast...";
      const result = await podcastAPI.podcast.generate({
        fileID: state.currentFile.id,
        speakers: newSpeakers,
        host,
        tts_model: model
      });
      status.innerText = `✅ Generation started (Job ID: ${result.jobId})`;
      window.currentJobId = result.jobId;
      showProgressView();
    } catch (err) {
      console.error("Error during generation:", err);
      status.innerText = "❌ Generation failed.";
    }
  });

  // Back Button
  document.getElementById("back-button")?.addEventListener("click", () => {
    import("./uploadView.js").then(({ showUploadView }) => showUploadView());
  });
}
