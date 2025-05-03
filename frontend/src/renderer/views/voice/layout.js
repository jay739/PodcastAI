export function renderVoiceViewLayout() {
    return `
      <div id="step-progress" class="step-progress">
        <div id="step1">1️⃣ Upload</div>
        <div id="step2">2️⃣ Analyze</div>
        <div id="step3">3️⃣ Voices</div>
        <div id="step4">4️⃣ Results</div>
      </div>
      <div id="transcript-preview">
        <h3>📝 Transcript Preview</h3>
        <pre id="transcript-text"></pre>
      </div>
      <div class="tts-controls">
        <label for="tts-model-select">Select TTS Model:</label>
        <select id="tts-model-select">
          <option value="bark">Bark</option>
          <option value="xtts">Coqui XTTS</option>
          <option value="kokoro">Kokoro</option>
        </select>
        <p id="model-info"></p>
  
        <label for="character-count">Number of Speakers:</label>
        <input type="number" id="character-count" min="1" max="5" value="2" />
  
        <button id="generate-fields">➕ Generate Speaker Fields</button>
        <div id="character-inputs"></div>
        <div id="host-select-container"></div>
  
        <button id="generate-voice">▶️ Generate Podcast</button>
        <div id="voice-status"></div>
        <button id="back-button">⬅️ Back</button>
      </div>
    `;
  }
  