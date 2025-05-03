// import { podcastAPI } from "../api/podcastAPI.js";
// import { showProgressView } from "./progressView.js";
// import { showUploadView } from "./uploadView.js"; // or the correct view to go back to
// import { state } from "../store/store.js";

// export 
//   const steps = ["step1", "step2", "step3", "step4"];
//   const currentStep = window.location.hash.includes("voice") ? 2 :
//                       window.location.hash.includes("results") ? 3 :
//                       window.location.hash.includes("analysis") ? 1 : 0;
//   steps.forEach((id, i) => {
//     const el = document.getElementById(id);
//     if (el) {
//       el.style.color = i === currentStep ? "#4f46e5" : "#6b7280";
//       el.style.fontWeight = i === currentStep ? "bold" : "normal";
//     }
//   });

// function initVoiceView() {

//   fetch(`http://localhost:5001/transcript/${window.currentJobId}.md`)
//     .then(res => res.text())
//     .then(data => {
//       document.getElementById("transcript-text").innerText = data.slice(0, 3000);
//     })
//     .catch(() => {
//       document.getElementById("transcript-text").innerText = "Transcript preview not available.";
//     });

//   const voiceView = document.getElementById("voice-view");
//   const fileID = state.currentFile?.id;

//   if (!fileID) {
//     voiceView.innerHTML = `

// <div id="step-progress" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; font-weight: bold; font-size: 0.9rem; color: #6b7280;">
//   <div id="step1">1️⃣ Upload</div>
//   <div id="step2">2️⃣ Analyze</div>
//   <div id="step3">3️⃣ Voices</div>
//   <div id="step4">4️⃣ Results</div>
// </div>


// <div id="transcript-preview" style="margin-top: 2rem;">
//   <h3>📝 Transcript Preview</h3>
//   <pre id="transcript-text" style="max-height: 200px; overflow-y: auto; background: #f9fafb; border: 1px solid #ccc; padding: 1rem; border-radius: 6px;"></pre>
// </div>

//       <div style="text-align: center; padding: 2rem; color: #b00; font-weight: bold;">
//         ❗ No file to generate voice for.
//       </div>`;
//     return;
//   }

//   voiceView.innerHTML = `

// <div id="step-progress" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; font-weight: bold; font-size: 0.9rem; color: #6b7280;">
//   <div id="step1">1️⃣ Upload</div>
//   <div id="step2">2️⃣ Analyze</div>
//   <div id="step3">3️⃣ Voices</div>
//   <div id="step4">4️⃣ Results</div>
// </div>


// <div id="transcript-preview" style="margin-top: 2rem;">
//   <h3>📝 Transcript Preview</h3>
//   <pre id="transcript-text" style="max-height: 200px; overflow-y: auto; background: #f9fafb; border: 1px solid #ccc; padding: 1rem; border-radius: 6px;"></pre>
// </div>

//     <div style="max-width: 700px; margin: 2rem auto; padding: 2rem; background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
//       <h2 style="text-align: center; color: #333;">🎤 Generate Podcast Voices</h2>

//       <label for="tts-model-select" style="display: block; margin-top: 1rem; font-weight: bold;">Select TTS Model:</label>
//       <select id="tts-model-select" style="padding: 0.5rem; width: 100%; border-radius: 6px; border: 1px solid #ccc;">
//         <option value="bark">Bark (balanced - default)</option>
//         <option value="xtts">Coqui XTTS (fast)</option>
//         <option value="kokoro">Kokoro (natural)</option>
//       </select>
//       <p id="model-info" style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;"></p>

//       <label for="character-count" style="display: block; margin-top: 1rem; font-weight: bold;">Number of Speakers (max 5):</label>
//       <input type="number" id="character-count" min="1" max="5" value="2" style="padding: 0.5rem; width: 100%; border-radius: 6px; border: 1px solid #ccc; margin-bottom: 1rem;" />

//       <button id="generate-fields" style="margin-bottom: 1.5rem; padding: 0.75rem 1.25rem; border: none; background-color: #4f46e5; color: white; border-radius: 6px; cursor: pointer;">➕ Generate Speaker Fields</button>

//       <div id="character-inputs"></div>
//       <div id="host-select-container" style="margin-top: 1rem;"></div>

//       <div style="text-align: center; margin-top: 2rem;">
//         <button id="generate-voice" style="padding: 0.75rem 2rem; font-size: 1rem; background-color: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">
//           ▶️ Generate Podcast
//         </button>
//         <div id="voice-status" style="margin-top: 1rem; font-size: 0.95rem; color: #555;"></div>
//       </div>

//       <div style="text-align: center; margin-top: 2rem;">
//         <button id="back-button" style="background-color: #e5e7eb; color: #111827; border: none; padding: 0.6rem 1.5rem; border-radius: 6px; cursor: pointer;">
//           ⬅️ Back
//         </button>
//       </div>
//     </div>
//   `;

//   const inputsContainer = document.getElementById("character-inputs");
  
//   <label style="font-weight: bold;">🎧 Try Sample Voice:</label>
//   <button onclick="new Audio('/samples/male.mp3').play()" style="margin: 0.5rem;">Male</button>
//   <button onclick="new Audio('/samples/female.mp3').play()" style="margin: 0.5rem;">Female</button>
//   <button onclick="new Audio('/samples/neutral.mp3').play()" style="margin: 0.5rem;">Neutral</button>

// const status = document.getElementById("voice-status");
//   const hostSelectContainer = document.getElementById("host-select-container");

//   // Handle TTS model change
//   const ttsModelSelect = document.getElementById("tts-model-select");
//   const modelInfo = document.getElementById("model-info");

//   ttsModelSelect.addEventListener("change", () => {
//     const selectedModel = ttsModelSelect.value;
//     let info = "";
//     switch (selectedModel) {
//       case "xtts":
//         info = "⚡ Fast (~10s/speaker), good clarity, fast preview mode.";
//         break;
//       case "kokoro":
//         info = "🎧 High-quality and expressive, slower (~30s/speaker).";
//         break;
//       case "bark":
//       default:
//         info = "🧠 Balanced speed and quality with Bark Small.";
//         break;
//     }
//     modelInfo.innerText = info;
//     localStorage.setItem("selectedTTSModel", selectedModel);
//   });

//   const lastSelection = localStorage.getItem("selectedTTSModel");
//   if (lastSelection) {
//     ttsModelSelect.value = lastSelection;
//     ttsModelSelect.dispatchEvent(new Event("change"));
//   } else {
//     ttsModelSelect.dispatchEvent(new Event("change"));
//   }

//   // Back button: show previous view (without reload)
//   document.getElementById("back-button").addEventListener("click", () => {
//     showUploadView(); // or whichever view you want to go back to
//   });

//   // Generate speaker fields
//   document.getElementById("generate-fields").addEventListener("click", () => {
//     const count = Math.min(5, parseInt(document.getElementById("character-count").value, 10));
//     inputsContainer.innerHTML = "";

//     for (let i = 0; i < count; i++) {
//       inputsContainer.innerHTML += `
//         <div class="character-block" style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
//           <label style="font-weight: bold;">Speaker ${i + 1} Name:</label>
//           <input type="text" id="character-name-${i}" placeholder="e.g., Alice" style="display: block; margin-top: 0.25rem; margin-bottom: 0.75rem; padding: 0.5rem; width: 100%; border: 1px solid #ccc; border-radius: 6px;" />

//           <label style="font-weight: bold;">Gender:</label>
//           <select id="character-gender-${i}" style="display: block; margin-bottom: 0.75rem; padding: 0.5rem; width: 100%; border-radius: 6px;">
//             <option value="male">Male</option>
//             <option value="female">Female</option>
//             <option value="neutral">Neutral</option>
//           </select>

//           <label style="font-weight: bold;">Tone/Alignment:</label>
//           <select id="character-tone-${i}" style="display: block; padding: 0.5rem; width: 100%; border-radius: 6px;">
//             <option value="positive">Positive</option>
//             <option value="neutral">Neutral</option>
//             <option value="negative">Negative</option>
//           </select>
//         </div>
//       `;
//     }

//     // Host dropdown
//     hostSelectContainer.innerHTML = `
//       <label style="font-weight: bold;">Select Host:</label>
//       <select id="host-selector" style="margin-top: 0.5rem; padding: 0.5rem; width: 100%; border-radius: 6px;">
//         <option value="">-- Select Host --</option>
//       </select>
//     `;

//     // Populate host dropdown dynamically
//     for (let i = 0; i < count; i++) {
//       const input = document.getElementById(`character-name-${i}`);
//       input.addEventListener("input", () => {
//         const hostSelector = document.getElementById("host-selector");
//         hostSelector.innerHTML = `<option value="">-- Select Host --</option>`;
//         for (let j = 0; j < count; j++) {
//           const name = document.getElementById(`character-name-${j}`).value;
//           if (name) {
//             hostSelector.innerHTML += `<option value="${name}">${name}</option>`;
//           }
//         }
//       });
//     }
//   });

//   // Generate podcast
//   document.getElementById("generate-voice").addEventListener("click", async () => {
//     const count = parseInt(document.getElementById("character-count").value, 10);
//     const speakers = [];

//     for (let i = 0; i < count; i++) {
//       const name = document.getElementById(`character-name-${i}`).value;
//       const gender = document.getElementById(`character-gender-${i}`).value;
//       const tone = document.getElementById(`character-tone-${i}`).value;

//       if (!name) {
//         status.innerText = `❗ Please provide a name for speaker ${i + 1}.`;
//         return;
//       }

//       speakers.push({ name, gender, tone });
//     }

//     const host = document.getElementById("host-selector")?.value || "";
//     const selectedModel = document.getElementById("tts-model-select")?.value || "bark";

//     try {
//       status.innerText = "⏳ Generating voice...";
      
//   const tableBody = document.getElementById("summary-table-body");
//   if (tableBody && Array.isArray(speakers)) {
//     tableBody.innerHTML = "";
//     speakers.forEach(sp => {
//       tableBody.innerHTML += `<tr><td>${sp.name}</td><td>${sp.gender}</td><td>${sp.tone}</td></tr>`;
//     });
//   }

// const result = await podcastAPI.podcast.generate({
//         fileID,
//         speakers,
//         host,
//         tts_model: selectedModel,
//       });

//       status.innerText = `✅ Podcast generation started. Job ID: ${result.jobId}`;
//       window.currentJobId = result.jobId;
//       showProgressView();

//       podcastAPI.on.progress(({ value, message }) => {
//         if (window.updateProgress) {
//           window.updateProgress(value, message);
//         }
//       });

//     } catch (err) {
//       console.error("Voice generation failed:", err);
//       status.innerText = "❌ Voice generation failed. See console.";
//     }
//   });
// }

// export function showVoiceView() {
//   document.querySelectorAll(".view").forEach((view) => {
//     view.hidden = true;
//   });

//   const voiceView = document.getElementById("voice-view");
//   if (voiceView) {
//     voiceView.hidden = false;
//     initVoiceView();
//     console.log("VoiceView HTML rendered.");
//   } else {
//     console.error("Voice view element not found!");
//   }
// }
