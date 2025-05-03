import { showAnalysisView } from "./analysisView.js";
import { state } from "../store/store.js";
import { podcastAPI } from "../api/apiToggle.js";

export function initUploadView() {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("upload-input");
  const uploadBtn = document.getElementById("upload-btn");

  // Drag & drop handling
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.background = "#e0e7ff";
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.style.background = "#f0f4ff";
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.background = "#f0f4ff";
    const files = e.dataTransfer.files;
    if (files.length) {
      fileInput.files = files;
    }
  });

  uploadBtn.addEventListener("click", () => fileInput.click());

  // Upload history (recent uploads)
  const historyList = document.getElementById("history-list");
  const uploads = JSON.parse(localStorage.getItem("uploadHistory") || "[]");
  uploads.forEach((file) => {
    const li = document.createElement("li");
    li.innerText = file.name;
    li.style.cursor = "pointer";
    li.onclick = () => alert(`You clicked on previous file: ${file.name}`);
    historyList.appendChild(li);
  });

  // File select and upload
  const uploadView = document.getElementById("upload-view");
  uploadView.innerHTML = `
    <div class="upload-container">
      <h2 class="heading">🎙️ Generate Podcast from PDF</h2>
      <p class="subtext">Select a PDF file to analyze and convert into a podcast.</p>
      <button id="upload-button" class="upload-btn">📁 Select and Upload PDF</button>
      <div id="upload-status" class="status-message"></div>

      <div style="margin-top: 1rem;">
        <label for="theme-toggle">🎨 Theme:</label>
        <select id="theme-toggle">
          <option value="light">🌞 Light</option>
          <option value="dark">🌙 Dark</option>
        </select>
      </div>

      <div style="margin-top: 2rem;">
        <h4>🕘 Recent Uploads</h4>
        <ul id="history-list" style="list-style: none; padding-left: 0;"></ul>
      </div>
    </div>
  `;

  const uploadButton = document.getElementById("upload-button");
  const statusDiv = document.getElementById("upload-status");

  uploadButton.addEventListener("click", async () => {
    try {
      uploadButton.disabled = true;
      statusDiv.innerText = "📂 Opening file picker...";

      const filePath = await podcastAPI.files.select();
      if (!filePath) {
        statusDiv.innerText = "⚠️ No file selected.";
        return;
      }

      statusDiv.innerText = "☁️ Uploading...";

      const result = await podcastAPI.files.upload(filePath);
      const fileID = result.fileID;

      const fileName = filePath.split("/").pop();
      const updatedUploads = JSON.parse(localStorage.getItem("uploadHistory") || "[]");
      updatedUploads.unshift({ name: fileName, ts: Date.now() });
      localStorage.setItem("uploadHistory", JSON.stringify(updatedUploads.slice(0, 5)));

      state.setFile({
        name: fileName,
        size: 0,
        path: filePath,
        id: fileID
      });

      statusDiv.innerHTML = `<span class="success">✅ File uploaded successfully.</span><br>🧠 Analyzing content...`;

      const analysis = await podcastAPI.files.analyze(fileID);
      state.setAnalysisResults(analysis);

      showAnalysisView();
    } catch (error) {
      console.error("Upload error:", error);
      statusDiv.innerHTML = `<span class="error">❌ Upload failed. Check the console for details.</span>`;
    } finally {
      uploadButton.disabled = false;
    }
  });

  // Theme toggle setup
  const themeSelect = document.getElementById("theme-toggle");
  if (themeSelect) {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeSelect.value = savedTheme;

    themeSelect.addEventListener("change", () => {
      const newTheme = themeSelect.value;
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }
}

export function showUploadView() {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = true;
  });

  const uploadView = document.getElementById("upload-view");
  if (uploadView) {
    uploadView.hidden = false;
    initUploadView(); // Ensure content is rendered fresh
  } else {
    console.error("Upload view element not found!");
  }
}
