// views/voice/layout.js

export function renderVoiceViewLayout() {
  return `
    <div id="step-progress" class="step-progress" style="display: flex; gap: 1rem; margin-bottom: 1.5rem; font-weight: bold; font-size: 0.9rem; color: #6b7280;">
      <div id="step1">1️⃣ Upload</div>
      <div id="step2">2️⃣ Analyze</div>
      <div id="step3" style="color: #4f46e5; font-weight: bold;">3️⃣ Voices</div>
      <div id="step4">4️⃣ Results</div>
    </div>

    <div id="transcript-preview" style="margin-bottom: 2rem;">
      <h3>📝 Transcript Preview</h3>
      <pre id="transcript-text" style="max-height: 200px; overflow-y: auto; background: #f9fafb; border: 1px solid #ccc; padding: 1rem; border-radius: 6px;"></pre>
    </div>

    <div class="tts-controls">
      <label for="tts-model-select" style="font-weight: bold;">Select TTS Model:</label>
      <select id="tts-model-select" style="padding: 0.5rem; width: 100%; border-radius: 6px; border: 1px solid #ccc; margin-bottom: 1rem;">
        <option value="bark">Bark</option>
        <option value="xtts">Coqui XTTS</option>
        <option value="kokoro">Kokoro</option>
      </select>
      <p id="model-info" style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;"></p>

      <div style="margin-bottom: 1rem;">
        <button id="toggle-view-mode" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9;">🧮 Toggle View Mode</button>
      </div>

      <div id="speaker-table-container"></div>

      <div style="margin-top: 2rem;">
        <button id="generate-voice" style="padding: 0.75rem 2rem; font-size: 1rem; background-color: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer;">▶️ Generate Podcast</button>
        <div id="voice-status" style="margin-top: 0.5rem; font-size: 0.95rem; color: #666;"></div>
      </div>

      <div style="margin-top: 2rem;">
        <button id="back-button" style="background-color: #e5e7eb; color: #111827; border: none; padding: 0.6rem 1.5rem; border-radius: 6px; cursor: pointer;">⬅️ Back</button>
      </div>
    </div>
  `;
}
