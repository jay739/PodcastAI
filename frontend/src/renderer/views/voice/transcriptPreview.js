import { state } from "../../store/store.js";

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
    .then((res) => res.text())
    .then((text) => {
      target.innerText = text.slice(0, 3000);
    })
    .catch(() => {
      target.innerText = "❗ Transcript could not be loaded.";
    });
}
