// progressView.js
export function initProgressView() {
    const progressView = document.getElementById('progress-view');
    progressView.innerHTML = `
        <h2>Progress</h2>
        <progress id="progress" value="0" max="100"></progress>
        <div id="progress-status"></div>
    `;

    window.updateProgress = (value, message) => {
        document.getElementById('progress').value = value;
        document.getElementById('progress-status').innerText = message;
    };
}

export function showProgressView() {
    document.querySelectorAll('.view').forEach(view => {
      view.hidden = true;
    });
  
    const progressView = document.getElementById('progress-view');
    if (progressView) {
      progressView.hidden = false;
      initProgressView();
    }
    else {
      console.error('Progress view element not found!');
    }
  }