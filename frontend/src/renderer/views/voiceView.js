import { podcastAPI } from "../api/podcastAPI.js";
import { showProgressView } from "./progressView.js";
import { state } from "../store/store.js";

export function initVoiceView() {
  const voiceView = document.getElementById("voice-view");
  const fileID = state.currentFile?.id;

  if (!fileID) {
    voiceView.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #b00; font-weight: bold;">
        ❗ No file to generate voice for.
      </div>`;
    return;
  }

  voiceView.innerHTML = `
    <div style="max-width: 700px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <h2 style="text-align: center; color: #333;">🎤 Generate Podcast Voices</h2>

      <label for="character-count" style="display: block; margin-top: 1rem; font-weight: bold;">Number of Speakers:</label>
      <input type="number" id="character-count" min="1" max="10" value="2" style="padding: 0.5rem; width: 100%; border-radius: 6px; border: 1px solid #ccc; margin-bottom: 1rem;" />

      <button id="generate-fields" style="margin-bottom: 1.5rem; padding: 0.75rem 1.25rem; border: none; background-color: #4f46e5; color: white; border-radius: 6px; cursor: pointer;">➕ Generate Speaker Fields</button>

      <div id="character-inputs"></div>

      <div style="text-align: center; margin-top: 2rem;">
        <button id="generate-voice" style="padding: 0.75rem 2rem; font-size: 1rem; background-color: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">
          ▶️ Generate Podcast
        </button>
        <div id="voice-status" style="margin-top: 1rem; font-size: 0.95rem; color: #555;"></div>
      </div>
    </div>
  `;

  const inputsContainer = document.getElementById("character-inputs");
  const status = document.getElementById("voice-status");

  // Generate Speaker Fields
  document.getElementById("generate-fields").addEventListener("click", () => {
    const count = parseInt(document.getElementById("character-count").value, 10);
    inputsContainer.innerHTML = "";

    for (let i = 0; i < count; i++) {
      inputsContainer.innerHTML += `
        <div class="character-block" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
          <label style="font-weight: bold;">Speaker ${i + 1} Name:</label>
          <input type="text" id="character-name-${i}" placeholder="e.g., Alice" style="display: block; margin-top: 0.25rem; margin-bottom: 0.75rem; padding: 0.5rem; width: 100%; border: 1px solid #ccc; border-radius: 6px;" />

          <label style="font-weight: bold;">Gender:</label>
          <select id="character-gender-${i}" style="display: block; margin-bottom: 0.75rem; padding: 0.5rem; width: 100%; border-radius: 6px;">
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="neutral">Neutral</option>
          </select>

          <label style="font-weight: bold;">Tone/Alignment:</label>
          <select id="character-tone-${i}" style="display: block; padding: 0.5rem; width: 100%; border-radius: 6px;">
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      `;
    }
  });

  // Generate Podcast
  document.getElementById("generate-voice").addEventListener("click", async () => {
    const count = parseInt(document.getElementById("character-count").value, 10);
    const speakers = [];

    for (let i = 0; i < count; i++) {
      const name = document.getElementById(`character-name-${i}`).value;
      const gender = document.getElementById(`character-gender-${i}`).value;
      const tone = document.getElementById(`character-tone-${i}`).value;

      if (!name) {
        status.innerText = `❗ Please provide a name for speaker ${i + 1}.`;
        return;
      }

      speakers.push({ name, gender, tone });
    }

    try {
      status.innerText = "⏳ Generating voice...";
      const result = await podcastAPI.podcast.generate({ fileID: fileID, speakers });

      status.innerText = `✅ Podcast generation started. Job ID: ${result.jobId}`;
      console.log("VoiceView Job ID:", result.jobId);

      window.currentJobId = result.jobId;
      showProgressView();

      // Listen for real-time progress
      podcastAPI.on.progress(({ value, message }) => {
        if (window.updateProgress) {
          window.updateProgress(value, message);
        }
      });

    } catch (err) {
      console.error("Voice generation failed:", err);
      status.innerText = "❌ Voice generation failed. See console.";
    }
  });
}

export function showVoiceView() {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = true;
  });

  const voiceView = document.getElementById("voice-view");
  if (voiceView) {
    voiceView.hidden = false;
    initVoiceView();
    console.log("VoiceView HTML rendered.");
  } else {
    console.error("Voice view element not found!");
  }
}
