export function renderVoiceViewLayout() {
  return `
    <div class="tts-controls">

      <div class="back-button-container">
        <button id="back-button" class="back-button">⬅️ Back</button>
      </div>

      <div id="transcript-preview-container" style="display: none;">
        <h3>📝 Transcript Preview</h3>
        <pre id="transcript-text" class="preview-box"></pre>
      </div>

      <label for="tts-model-select" class="bold-label">Select TTS Model:</label>
      <select id="tts-model-select" class="full-width-select">
        <option value="bark">Bark</option>
        <option value="xtts">Coqui XTTS</option>
        <option value="kokoro">Kokoro</option>
      </select>
      <p id="model-info" class="model-info">⚡ Fast (~10s/speaker), good clarity.</p>

      <div class="toggle-view-container">
        <button id="toggle-view-mode" class="toggle-btn">🧮 Toggle View Mode</button>
      </div>

      <div id="speaker-table-container"></div>

      <div class="generate-container">
        <button id="generate-voice" class="primary-btn">▶️ Generate Podcast</button>
        <div id="voice-status" class="info-message"></div>
      </div>

    </div>
  `;
}
