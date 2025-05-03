// progressView.js
export function initProgressView(stats = null) {
  const progressView = document.getElementById('progress-view');
  progressView.innerHTML = `
      <h2>Progress</h2>
      <progress id="progress" value="0" max="100"></progress>
      <div id="progress-status">
    <div style="text-align: center; margin-top: 2rem;">
      <button id="back-button" style="background-color: #e5e7eb; color: #111827; border: none; padding: 0.6rem 1.5rem; border-radius: 6px; cursor: pointer;">
        ⬅️ Back
      </button>
    </div>
    <script>
      document.getElementById("back-button")?.addEventListener("click", () => {
        showVoiceView();
      });
    </script>
    
</div>
      <div id="pdf-stats" style="margin-top: 2rem; padding: 1rem; background: #f0f0f0; border-radius: 8px;" hidden>
        <h3>📊 PDF Stats:</h3>
        <p id="stat-pages"></p>
        <p id="stat-words"></p>
        <p id="stat-keywords"></p>
      </div>
  `;

  window.updateProgress = (value, message) => {
      document.getElementById('progress').value = value;
      document.getElementById('progress-status').innerText = message;
  
  const backBtn = document.getElementById("back-button");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      showVoiceView();
    });
  }

};

  if (stats) {
      const statsContainer = document.getElementById('pdf-stats');
      document.getElementById('stat-pages').innerText = `📄 Pages: ${stats.pageCount}`;
      document.getElementById('stat-words').innerText = `📝 Words: ${stats.wordCount}`;
      document.getElementById('stat-keywords').innerText = `🔍 Keywords: ${stats.topKeywords?.join(', ')}`;
      statsContainer.hidden = false;
  }
}

export function showProgressView(stats = null) {
  document.querySelectorAll('.view').forEach(view => {
      view.hidden = true;
  });

  const progressView = document.getElementById('progress-view');
  if (progressView) {
      progressView.hidden = false;
      initProgressView(stats);
  } else {
      console.error('Progress view element not found!');
  }
} 
