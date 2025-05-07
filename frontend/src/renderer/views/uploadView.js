import { showAnalysisView } from "./analysisView.js";
import { state } from "../store/store.js";
import { podcastAPI } from "../api/apiToggle.js";
import { registerViewTransition } from "./common/backNavigation.js";

export function initUploadView() {
  const uploadView = document.getElementById("upload-view");

  uploadView.innerHTML = `
    <div class="upload-container">
      <h2 class="heading">🎙️ Generate Podcast from PDF</h2>
      <p class="subtext">Select a PDF file to analyze and convert into a podcast.</p>

      <div id="drop-zone" class="drop-zone">
        <p>📂 Drag and drop a PDF here or click below to browse</p>
      </div>

      <button id="upload-button" class="upload-btn">📁 Select and Upload PDF</button>
      <div id="upload-status" class="status-message"></div>

      <div style="margin-top: 2rem;">
        <h4>🕘 Recent Uploads</h4>
        <ul id="history-list" style="list-style: none; padding-left: 0;"></ul>
      </div>
    </div>
  `;

  const uploadButton = document.getElementById("upload-button");
  const statusDiv = document.getElementById("upload-status");
  const dropZone = document.getElementById("drop-zone");

  const handleUpload = async (filePath) => {
    try {
      uploadButton.disabled = true;
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
  };

  uploadButton.addEventListener("click", async () => {
    statusDiv.innerText = "📂 Opening file picker...";
    const filePath = await podcastAPI.files.select();
    if (filePath) {
      await handleUpload(filePath);
    } else {
      statusDiv.innerText = "⚠️ No file selected.";
    }
  });

  dropZone.addEventListener("click", async () => {
    const filePath = await podcastAPI.files.select();
    if (filePath) {
      await handleUpload(filePath);
    }
  });  

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    dropZone.style.background = "#e0e7ff";
  });
  
  dropZone.addEventListener("dragleave", () => {
    dropZone.style.background = "#f9fafb";
  });

  dropZone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropZone.style.background = "#f9fafb";
    const files = e.dataTransfer.files;
    if (files.length && files[0].path) {
      await handleUpload(files[0].path);
    }
  });

  const historyList = document.getElementById("history-list");
  const uploads = JSON.parse(localStorage.getItem("uploadHistory") || "[]");
  uploads.forEach((file) => {
    const li = document.createElement("li");
    li.innerText = file.name;
    li.style.cursor = "pointer";
    li.onclick = () => alert(`You clicked on previous file: ${file.name}`);
    historyList.appendChild(li);
  });

  registerViewTransition("upload-view");
}

export function showUploadView() {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = true;
  });

  const uploadView = document.getElementById("upload-view");
  if (uploadView) {
    uploadView.hidden = false;
    document.querySelectorAll("#step-tracker .step").forEach((el) => {
      el.style.color = "#6b7280";
      el.style.fontWeight = "normal";
    });
    document.getElementById("step1").style.color = "#4f46e5";
    document.getElementById("step1").style.fontWeight = "bold";
    initUploadView();
  } else {
    console.error("Upload view element not found!");
  }
}
