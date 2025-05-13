import { showVoiceView } from "./voice/index.js";
import { registerViewTransition } from "../views/common/backNavigation.js";
import { state } from "../store/store.js";

export function initResultsView() {
  const resultsView = document.getElementById("results-view");

  resultsView.innerHTML = `
    <div style="max-width: 800px; margin: 2rem auto;">
      <h2 style="text-align: center; color: #333;">📊 Podcast Results</h2>

      <div style="margin-top: 2rem;">
        <audio id="podcast-audio" controls style="width: 100%;">
          <source id="audio-src" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>

      <div id="transcript-lines" style="margin-top: 2rem; padding: 1rem; background: #f9fafb; border-radius: 10px; border: 1px solid #ddd; font-family: monospace; max-height: 300px; overflow-y: auto;">
        <p>🎙️ Transcript will appear here...</p>
      </div>

      <div class="results-container">
        <h2>📝 Edit Transcript</h2>
        <textarea id="transcript-editor" style="width: 100%; height: 300px;">${state.transcriptText || ""}</textarea>
        <div style="margin: 1rem 0;">
          <button id="synthesize-audio" class="primary-btn">🎙️ Generate Audio</button>
          <span id="synthesis-status" class="status-message"></span>
        </div>
        <div id="audio-player-container" style="display:none; margin-top: 2rem;">
          <h3>🎧 Podcast Audio</h3>
          <audio id="podcast-audio" controls></audio>
          <div id="transcript-display" class="transcript-display"></div>
          <button id="export-html">💾 Export HTML</button>
        </div>
      </div>

      <div style="text-align: center; margin-top: 2rem;">
        <button id="back-button" class="back-button">⬅️ Back to Voice Setup</button>
        <button id="view-analysis" class="back-button">📊 View Analysis</button>
      </div>
    </div>
  `;

  const audioElem = document.getElementById("podcast-audio");
  const audioSrc = document.getElementById("audio-src");

  const jobId = window.currentJobId;

  if (jobId) {
    audioSrc.src = `http://localhost:5001/audio/${jobId}.mp3`;
    audioElem.load();

    fetch(`http://localhost:5001/arc/${jobId}.json`)
      .then((res) => res.json())
      .then((lines) => {
        const transcriptContainer = document.getElementById("transcript-lines");
        transcriptContainer.innerHTML = "";
        let fullTranscriptText = "";

        lines.forEach((entry) => {
          fullTranscriptText += `${entry.speaker}: ${entry.text}\n`;
          
          const div = document.createElement("div");
          div.innerText = `[${entry.timestamp}] ${entry.speaker}: ${entry.text}`;
          div.style.cursor = "pointer";
          div.style.marginBottom = "0.5rem";

          div.onclick = () => {
            const [min, sec] = entry.timestamp.replace("[", "").replace("]", "").split(":").map(Number);
            audioElem.currentTime = min * 60 + sec;
            audioElem.play();
          };

          transcriptContainer.appendChild(div);
        });
        
        // Update the transcript comparison metrics if the function exists
        if (window.updateTranscriptComparison) {
          window.updateTranscriptComparison(fullTranscriptText);
        }
      })
      .catch((err) => {
        const transcriptContainer = document.getElementById("transcript-lines");
        transcriptContainer.innerHTML = `<p style="color: red;">❌ Transcript not found.</p>`;
        console.warn("Transcript fetch failed:", err);
      });

    fetch(`http://localhost:5001/status/${jobId}`)
      .then((res) => res.json())
      .then((result) => {
        const resultsContainer = document.getElementById("results-container");
        resultsContainer.innerText = JSON.stringify(result, null, 2);
      })
      .catch(() => {
        document.getElementById("results-container").innerText = "⚠️ Failed to load results.";
      });
  }

  document.getElementById("back-button")?.addEventListener("click", () => {
    showVoiceView();
  });
  
  document.getElementById("view-analysis")?.addEventListener("click", () => {
    import("./analysisView.js").then(({ showAnalysisView }) => {
      showAnalysisView();
    });
  });

  registerViewTransition("results-view");
}

export function showResultsView() {
  document.querySelectorAll(".view").forEach(v => v.hidden = true);
  const view = document.getElementById("results-view");
  if(view) {
    view.hidden = false;
    document.querySelectorAll("#step-tracker .step").forEach(el => {
      el.style.color = "#6b7280";
      el.style.fontWeight = "normal";
    });
    document.getElementById("step4").style.color = "#4f46e5";
    document.getElementById("step4").style.fontWeight = "bold";
    initResultsView();
    // Attach event handler for Generate Audio button
    document.getElementById("synthesize-audio")?.addEventListener("click", async () => {
      const statusEl = document.getElementById("synthesis-status");
      statusEl.innerText = "🧩 Synthesizing audio... Please wait.";
      const editedText = document.getElementById("transcript-editor").value;
      try {
        const res = await podcastAPI.podcast.generateAudio({
          fileID: state.currentFile.id,
          speakers: state.speakers,
          tts_model: document.getElementById("tts-model-select")?.value || "bark",
          bg_music: document.getElementById("bg-music-select")?.value || "default",
          transcript: editedText
        });
        statusEl.innerText = "✅ Audio generated successfully.";
        // Display audio player and interactive transcript
        const audioUrl = `http://localhost:5001/api/audio/${res.job_id}.mp3`;
        const audioElem = document.getElementById("podcast-audio");
        audioElem.src = audioUrl;
        document.getElementById("audio-player-container").style.display = "block";
        
        // Update transcript text for comparison metrics
        if (window.updateTranscriptComparison) {
          window.updateTranscriptComparison(editedText);
        }
        
        // Fetch transcript JSON for highlighting
        const response = await fetch(`http://localhost:5001/api/transcript/${res.job_id}`);
        const arcData = await response.json();
        populateTranscriptDisplay(arcData);
      } catch(err) {
        console.error("Audio generation failed:", err);
        statusEl.innerText = "❌ Audio generation failed.";
      }
    });
    // Attach event for Export HTML
    document.getElementById("export-html")?.addEventListener("click", async () => {
      if(state.currentJobId) {
        window.open(`http://localhost:5001/api/export/${state.currentJobId}`, "_blank");
      }
    });
  }
}

function populateTranscriptDisplay(arcData) {
  const displayDiv = document.getElementById("transcript-display");
  displayDiv.innerHTML = "";  // clear any existing
  if(!Array.isArray(arcData) || !arcData.length) {
    displayDiv.innerText = "Transcript will appear here.";
    return;
  }
  
  // Create a paragraph for each line with data-timestamp attribute
  let fullTranscriptText = "";
  arcData.forEach(line => {
    fullTranscriptText += `${line.speaker}: ${line.text}\n`;
    
    const p = document.createElement("p");
    p.textContent = `${line.speaker}: ${line.text}`;
    p.dataset.timestamp = line.timestamp;  // e.g. "[00:30]"
    displayDiv.appendChild(p);
  });
  
  // Update comparison metrics if available
  if (window.updateTranscriptComparison) {
    window.updateTranscriptComparison(fullTranscriptText);
  }
  
  // Highlight sync logic
  const audio = document.getElementById("podcast-audio");
  audio.addEventListener("timeupdate", () => {
    const currentTimeSec = audio.currentTime;
    // Find the last line whose timestamp is <= current time
    let activeIndex = -1;
    for(let i = 0; i < arcData.length; i++) {
      const [mins, secs] = arcData[i].timestamp.replace("[","").replace("]","").split(":").map(Number);
      const lineTime = mins*60 + secs;
      if(lineTime <= currentTimeSec) {
        activeIndex = i;
      } else {
        break;
      }
    }
    // Highlight only the activeIndex line
    const lines = displayDiv.querySelectorAll("p");
    lines.forEach((p, idx) => {
      p.style.background = (idx === activeIndex) ? "#fff3b0" : "transparent";
    });
  });
  // Allow clicking a line to seek audio to that time
  displayDiv.addEventListener("click", e => {
    if(e.target.tagName.toLowerCase() === "p" && e.target.dataset.timestamp) {
      const [m, s] = e.target.dataset.timestamp.replace("[","").replace("]","").split(":").map(Number);
      audio.currentTime = m*60 + s;
      audio.play();
    }
  });
}


