import { showAnalysisView } from "./analysisView.js";
import { state } from "../store/store.js";
import { podcastAPI } from "../api/podcastAPI.js";

export function initUploadView() {
  const uploadView = document.getElementById("upload-view");

  // Modern clean UI with styling hooks
  uploadView.innerHTML = `
    <div class="upload-container">
      <h2 class="heading">🎙️ Generate Podcast from PDF</h2>
      <p class="subtext">Select a PDF file to analyze and convert into a podcast.</p>
      <button id="upload-button" class="upload-btn">📁 Select and Upload PDF</button>
      <div id="upload-status" class="status-message"></div>
    </div>
  `;

  const uploadButton = document.getElementById("upload-button");
  const statusDiv = document.getElementById("upload-status");

  uploadButton.addEventListener("click", async () => {
    try {
      uploadButton.disabled = true;
      statusDiv.innerText = "📂 Opening file picker...";

      // Step 1: File picker
      const filePath = await podcastAPI.files.select();
      if (!filePath) {
        statusDiv.innerText = "⚠️ No file selected.";
        return;
      }

      statusDiv.innerText = "☁️ Uploading...";

      // Step 2: Upload
      const result = await podcastAPI.files.upload(filePath);
      const fileID = result.fileID;

      // Step 3: Save to state using store.js method
      state.setFile({
        name: filePath.split("/").pop(),
        size: 0,
        path: filePath,
        id: fileID
      });

      statusDiv.innerHTML = `<span class="success">✅ File uploaded successfully.</span>`;

      // Step 4: Analyze
      statusDiv.innerHTML += `<br>🧠 Analyzing content...`;
      const analysis = await podcastAPI.files.analyze(fileID);

      state.setAnalysisResults(analysis);

      // Step 5: Move to analysis view
      showAnalysisView();

    } catch (error) {
      console.error("Upload error:", error);
      statusDiv.innerHTML = `<span class="error">❌ Upload failed. Check the console for details.</span>`;
    } finally {
      uploadButton.disabled = false;
    }
  });
}

export function showUploadView() {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = true;
  });

  const uploadView = document.getElementById("upload-view");
  if (uploadView) {
    uploadView.hidden = false;
  } else {
    console.error("Upload view element not found!");
  }
}
