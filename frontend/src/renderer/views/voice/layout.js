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
      <div class="options-bar">
        <label>Language: 
          <select id="language-select">
            <option value="en" selected>English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </label>
        <label style="margin-left:1rem;">Background Music: 
          <select id="bg-music-select">
            <option value="default" selected>Default</option>
            <option value="none">None</option>
          </select>
        </label>
        <label style="margin-left:1rem;">TTS Model: 
          <select id="tts-model-select">
            <option value="bark" selected>Bark (Default)</option>
            <option value="xtts">Coqui X</option>
            <option value="kokoro">Kokoro</option>
          </select>
        </label>
        <label style="margin-left:1rem;">AI Model: 
          <select id="llm-model-select">
            <option value="" selected>Local (Default)</option>
            <option value="gpt-3.5">OpenAI GPT-3.5</option>
            <option value="gpt-4">OpenAI GPT-4</option>
          </select>
        </label>
      </div>

      <div class="generate-container">
        <button id="generate-voice" class="primary-btn">▶️ Generate Podcast</button>
        <div id="voice-status" class="info-message"></div>
      </div>

    </div>
  `;
}
