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

  document.addEventListener("click", async (e) => {
    if(e.target?.classList?.contains("preview-voice-btn")) {
      const idx = parseInt(e.target.dataset.index, 10);
      if(!isNaN(idx)) {
        const speaker = state.speakers[idx];
        if(speaker && speaker.name) {
          // Prepare preview text (use the speaker's name in a sample sentence)
          const previewText = `Hello, my name is ${speaker.name}. This is a voice preview.`;
          const gender = speaker.gender || "male";
          const tone = speaker.tone || "neutral";
          const ttsModel = document.getElementById("tts-model-select")?.value || "bark";
          try {
            // Use the correct API for preview
            if (window.podcastAPI && window.podcastAPI.podcast && window.podcastAPI.podcast.previewVoice) {
              const audioBlob = await window.podcastAPI.podcast.previewVoice({
              text: previewText, 
              gender, tone, speaker: speaker.name, 
              tts_model: ttsModel
            });
            // Play the returned audio blob
            const url = URL.createObjectURL(audioBlob);
            const audio = new Audio(url);
            audio.play();
            } else {
              alert("Voice preview API is not available.");
            }
          } catch(err) {
            console.error("Voice preview failed:", err);
            alert("Voice preview failed. See console for details.");
          }
        }
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
      status.innerText = "✅ Audio generated successfully!";
      state.currentJobId = result.job_id;
      state.transcriptText = result.transcript;
      showResultsView();
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

