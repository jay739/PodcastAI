import { state } from "../../store/store.js";
// import electronLog from "../../utils/electronLog.js";
import { showUploadView } from "../uploadView.js";


export function loadTranscriptPreview() {
  const fileID = state.currentFile?.id;
  const isMock = localStorage.getItem("useMock") === "true";
  const target = document.getElementById("transcript-text");

  if (!fileID || !target) {
    if (target) target.innerText = "❗ Transcript preview not available.";
    return;
  }

  if (fileID === "mock123") {
    target.innerText = `📜 This is a mock transcript preview for testing purposes.\n\nLorem ipsum dolor sit amet...`;
    return;
  }

  const url = isMock
    ? `/mock/${fileID}.md`
    : `http://localhost:5001/transcript/${fileID}.md`;

  fetch(url) 
    .then((res) => {
      if (!res.ok) throw new Error("Transcript fetch failed");
      return res.text();
    })
    .then((text) => {
      target.innerText = text.slice(0, 3000);
    })
    .catch((err) => {
      electronLog.error("Transcript preview failed:", err);
      showErrorModal(
        "Transcript could not be loaded. Please try again.",
        () => loadTranscriptPreview()
      );
      target.innerText = "❗ Transcript could not be loaded.";
    });
}

function showErrorModal(message, onRetry) {
  const modal = document.createElement('div');
  modal.className = 'error-modal';
  modal.innerHTML = `
    <div class="error-modal-content">
      <h2>❌ Error</h2>
      <p>${message}</p>
      <button id="retry-btn">Retry</button>
      <button id="back-btn">Back</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('retry-btn').onclick = () => { modal.remove(); onRetry && onRetry(); };
  document.getElementById('back-btn').onclick = () => { modal.remove(); showUploadView(); };
}
