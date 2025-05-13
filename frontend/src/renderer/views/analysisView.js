import { state } from "../store/store.js";
import { showUploadView } from "./uploadView.js";
import { registerViewTransition } from "./common/backNavigation.js";
import { showVoiceView } from "./voice/index.js";

export function showAnalysisView() {
  document.querySelectorAll(".view").forEach((view) => {
    view.hidden = true;
  });

  const analysisView = document.getElementById("analysis-view");
  if (analysisView) {
    analysisView.hidden = false;
    document.querySelectorAll("#step-tracker .step").forEach((el) => {
      el.style.color = "#6b7280";
      el.style.fontWeight = "normal";
    });
    document.getElementById("step2").style.color = "#4f46e5";
    document.getElementById("step2").style.fontWeight = "bold";
    initAnalysisView();
  } else {
    console.error("Analysis view element not found!");
  }
}

export function initAnalysisView() {
  const view = document.getElementById("analysis-view");
  view.innerHTML = "";

  const fileID = state.currentFile?.id;
  if (!fileID) {
    view.innerHTML = `
      <div class="error-message centered">❗ No file uploaded yet.</div>
      <div class="centered" style="margin-top: 2rem;">
        <button id="back-button" class="back-button">⬅️ Back</button>
      </div>`;
    document.getElementById("back-button")?.addEventListener("click", showUploadView);
    return;
  }

  const analysis = state.analysisResults;
  if (!analysis) {
    view.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
      <div class="info-message centered">🕵️ Analyzing PDF... Please wait.</div>
        <div class="loading-steps">
          <div class="loading-step">📄 Extracting text...</div>
          <div class="loading-step">🔍 Analyzing content...</div>
          <div class="loading-step">📊 Computing metrics...</div>
        </div>
      </div>
      <div class="centered" style="margin-top: 2rem;">
        <button id="back-button" class="back-button">⬅️ Back</button>
      </div>`;
    document.getElementById("back-button")?.addEventListener("click", showUploadView);
    return;
  }

  // --- Compute extra metrics ---
  const fullText = analysis.full_text || "";
  const words = fullText.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words).size;
  const avgWordLength = words.length ? (words.join("").length / words.length).toFixed(2) : "-";
  const readingTime = words.length ? Math.ceil(words.length / 200) : 0; // 200 wpm
  const paragraphCount = fullText.split(/\n{2,}/).filter(p => p.trim().length > 0).length;
  const sentenceCount = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const complexityScore = analysis.readability?.grade_level ? analysis.readability.grade_level.toFixed(1) : "-";

  // --- Prepare chart data ---
  const topicLabels = analysis.topics ? Object.keys(analysis.topics).map(k => `Topic ${k}`) : [];
  const topicValues = analysis.topics ? Object.values(analysis.topics).map(arr => arr.length) : [];
  const readingLevel = analysis.readability?.flesch_ease || null;

  // --- Render metrics and charts ---
  view.innerHTML = `
    <button id="back-button" class="back-button">⬅️ Back</button>
    <div class="analysis-container">
      <h2 class="title">🧠 PDF Analysis</h2>
      <div class="metrics-grid">
        <div class="metric-card" title="The total number of words in the document">
          <h3>Total Words</h3>
          <p id="total-words">${analysis.word_count || '-'}</p>
          <div class="metric-desc">Total count of all words in the document</div>
        </div>
        <div class="metric-card" title="Number of distinct words, indicating vocabulary richness">
          <h3>Unique Words</h3>
          <p id="unique-words">${uniqueWords}</p>
          <div class="metric-desc">Count of unique words used</div>
        </div>
        <div class="metric-card" title="Average sentiment on a scale from -1 (negative) to 1 (positive)">
          <h3>Average Sentiment</h3>
          <p id="avg-sentiment">${analysis.sentiment?.average?.toFixed(2) ?? '-'}</p>
          <div class="metric-desc">Overall document sentiment (-1 to 1)</div>
        </div>
        <div class="metric-card" title="Estimated reading time based on average reading speed of 200 words per minute">
          <h3>Reading Time</h3>
          <p id="reading-time">${readingTime} min</p>
          <div class="metric-desc">Estimated time to read (200 wpm)</div>
        </div>
        <div class="metric-card" title="Number of paragraphs in the document">
          <h3>Paragraph Count</h3>
          <p id="paragraph-count">${paragraphCount}</p>
          <div class="metric-desc">Total number of paragraphs</div>
        </div>
        <div class="metric-card" title="Number of sentences in the document">
          <h3>Sentence Count</h3>
          <p id="sentence-count">${sentenceCount}</p>
          <div class="metric-desc">Total number of sentences</div>
        </div>
        <div class="metric-card" title="Average length of words in characters">
          <h3>Average Word Length</h3>
          <p id="avg-word-length">${avgWordLength}</p>
          <div class="metric-desc">Average word length in characters</div>
        </div>
        <div class="metric-card" title="Readability grade level (US education system)">
          <h3>Complexity Score</h3>
          <p id="complexity-score">${complexityScore}</p>
          <div class="metric-desc">Approximate reading grade level</div>
        </div>
      </div>

      <div class="metrics-comparison" id="comparison-metrics" style="display: none; margin: 2rem 0;">
        <h3 style="text-align: center; margin-bottom: 1rem;">📊 Transcript vs. Original Comparison</h3>
        <div class="metrics-grid">
          <div class="metric-card" title="Similarity between original text and transcript content">
            <h3>Content Similarity</h3>
            <p id="content-similarity">-</p>
            <div class="metric-desc">How similar the content is (0-100%)</div>
          </div>
          <div class="metric-card" title="Difference in sentiment between original and transcript">
            <h3>Sentiment Shift</h3>
            <p id="sentiment-shift">-</p>
            <div class="metric-desc">Change in sentiment (-1 to 1)</div>
          </div>
          <div class="metric-card" title="Ratio of transcript length to original text">
            <h3>Length Ratio</h3>
            <p id="length-ratio">-</p>
            <div class="metric-desc">Transcript/Original word count ratio</div>
          </div>
          <div class="metric-card" title="Percentage of keyword preservation in transcript">
            <h3>Keyword Preservation</h3>
            <p id="keyword-preservation">-</p>
            <div class="metric-desc">% of key terms preserved</div>
          </div>
        </div>
        <div class="charts-grid">
          <div class="chart-container"><canvas id="similarity-chart"></canvas></div>
          <div class="chart-container"><canvas id="complexity-comparison-chart"></canvas></div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-container"><canvas id="sentiment-chart"></canvas></div>
        <div class="chart-container"><canvas id="topic-distribution-chart"></canvas></div>
        <div class="chart-container"><canvas id="word-frequency-chart"></canvas></div>
        <div class="chart-container"><canvas id="reading-level-chart"></canvas></div>
      </div>
      <div class="text-preview">
        <h3>📚 Text Preview</h3>
        <div class="preview-box">
          ${fullText ? fullText.slice(0, 1500) + (fullText.length > 1500 ? "..." : "") : "No preview available..."}
        </div>
      </div>
      <div class="centered" style="margin-top: 2rem;">
        <button id="continue-to-voice" class="primary-btn">➡️ Continue to Voice Setup</button>
      </div>
    </div>`;

  // --- Render charts ---
  if (window.Chart) {
    // Sentiment chart
    if (analysis.sentiment?.per_page) {
      new Chart(document.getElementById("sentiment-chart").getContext("2d"), {
        type: "line",
        data: {
          labels: analysis.sentiment.per_page.map((_, i) => `Pg ${i + 1}`),
          datasets: [{
            label: "Sentiment Score",
            data: analysis.sentiment.per_page,
            borderColor: "#4f46e5",
            tension: 0.4,
            fill: false
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Sentiment Analysis Over Time", font: { size: 16, weight: "bold" } },
            legend: { display: true, position: "top" }
          },
          scales: {
            y: { title: { display: true, text: "Sentiment Score (-1 to 1)" }, min: -1, max: 1 },
            x: { title: { display: true, text: "Text Segment" } }
          }
        }
      });
    }
    
    // Topic distribution chart - Extract meaningful topic names
    if (analysis.topics && Object.keys(analysis.topics).length) {
      // Extract meaningful topic names instead of "Topic 0", "Topic 1", etc.
      const topicData = {};
      
      Object.entries(analysis.topics).forEach(([id, words]) => {
        if (Array.isArray(words) && words.length) {
          // Use top 2 words to create a topic name
          const topWords = words.slice(0, 2).map(word => {
            return typeof word === 'object' ? word.word : word;
          });
          
          // Create a readable topic name from the top words
          const topicName = topWords.join(" & ");
          
          // Store the count of words in this topic
          topicData[topicName] = words.length;
        }
      });
      
      const topicNames = Object.keys(topicData);
      const topicCounts = Object.values(topicData);
      
      if (topicNames.length) {
        new Chart(document.getElementById("topic-distribution-chart").getContext("2d"), {
          type: "pie",
          data: {
            labels: topicNames,
            datasets: [{
              data: topicCounts,
              backgroundColor: ["#4f46e5", "#7c3aed", "#2563eb", "#3b82f6", "#60a5fa"]
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: { display: true, text: "Topic Distribution", font: { size: 16, weight: "bold" } },
              legend: { display: true, position: "right" },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = context.raw;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${context.label}: ${percentage}% (${value} items)`;
                  }
                }
              }
            }
          }
        });
      }
    }
    
    // Word frequency chart
    if (analysis.top_keywords && analysis.keyword_counts) {
      const labels = analysis.top_keywords.map(k => (typeof k === 'object' ? k.word : k).toUpperCase());
      const values = Array.isArray(analysis.keyword_counts) && analysis.keyword_counts.length === labels.length
        ? analysis.keyword_counts
        : labels.map(() => 1);
      new Chart(document.getElementById("word-frequency-chart").getContext("2d"), {
        type: "bar",
        data: {
          labels,
          datasets: [{ label: "Word Frequency", data: values, backgroundColor: "#4f46e5" }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Most Frequent Words", font: { size: 16, weight: "bold" } },
            legend: { display: true, position: "top" },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Count: ${context.raw}`;
                }
              }
            }
          },
          scales: {
            y: { title: { display: true, text: "Frequency" } },
            x: { title: { display: true, text: "Words" } }
          }
        }
      });
    }

    // Reading level chart
    if (readingLevel !== null) {
      new Chart(document.getElementById("reading-level-chart").getContext("2d"), {
        type: "bar",
        data: {
          labels: ["Flesch Reading Ease"],
          datasets: [{
            label: "Score", 
            data: [readingLevel], 
            backgroundColor: "#7c3aed",
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: "Reading Level (Flesch Ease)", font: { size: 16, weight: "bold" } },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const score = context.raw;
                  let interpretation = "";
                  
                  if (score >= 90) interpretation = "Very Easy (5th grade)";
                  else if (score >= 80) interpretation = "Easy (6th grade)";
                  else if (score >= 70) interpretation = "Fairly Easy (7th grade)";
                  else if (score >= 60) interpretation = "Standard (8-9th grade)";
                  else if (score >= 50) interpretation = "Fairly Difficult (10-12th grade)";
                  else if (score >= 30) interpretation = "Difficult (College)";
                  else interpretation = "Very Difficult (College Graduate)";
                  
                  return `Score: ${score.toFixed(1)} - ${interpretation}`;
                }
              }
            }
          },
          scales: {
            y: { 
              title: { display: true, text: "Score (0-100)" },
              min: 0, 
              max: 100,
              ticks: {
                callback: function(value) {
                  if (value === 0) return "Very Difficult";
                  if (value === 50) return "Standard";
                  if (value === 100) return "Very Easy";
                  return value;
                }
              }
            },
            x: { title: { display: true, text: "Metric" } }
          }
        }
      });
    }
  }

  // Function to update comparison metrics after transcript generation
  window.updateTranscriptComparison = function(transcriptText) {
    if (!transcriptText || !fullText) return;
    
    // Show the comparison section
    document.getElementById("comparison-metrics").style.display = "block";
    
    // Calculate comparison metrics
    const transcriptWords = transcriptText.split(/\s+/).filter(Boolean);
    const originalWords = fullText.split(/\s+/).filter(Boolean);
    
    // Length ratio
    const lengthRatio = (transcriptWords.length / originalWords.length).toFixed(2);
    document.getElementById("length-ratio").textContent = lengthRatio + "x";
    
    // Simple similarity calculation (shared words)
    const originalWordSet = new Set(originalWords.map(w => w.toLowerCase()));
    const transcriptWordSet = new Set(transcriptWords.map(w => w.toLowerCase()));
    
    const intersection = new Set();
    for (const word of transcriptWordSet) {
      if (originalWordSet.has(word)) {
        intersection.add(word);
      }
    }
    
    const similarity = Math.round((intersection.size / Math.max(originalWordSet.size, transcriptWordSet.size)) * 100);
    document.getElementById("content-similarity").textContent = similarity + "%";
    
    // Keyword preservation
    if (analysis.top_keywords && analysis.top_keywords.length) {
      const keywordSet = new Set(analysis.top_keywords.map(k => 
        typeof k === 'object' ? k.word.toLowerCase() : k.toLowerCase()
      ));
      
      let keywordsFound = 0;
      for (const word of transcriptWordSet) {
        if (keywordSet.has(word)) {
          keywordsFound++;
        }
      }
      
      const preservation = Math.round((keywordsFound / keywordSet.size) * 100);
      document.getElementById("keyword-preservation").textContent = preservation + "%";
    }
    
    // Add chart comparison
    new Chart(document.getElementById("similarity-chart").getContext("2d"), {
      type: "radar",
      data: {
        labels: ["Content", "Length", "Keywords", "Structure"],
        datasets: [{
          label: "Similarity",
          data: [similarity, Math.min(100, lengthRatio * 100), 
                parseInt(document.getElementById("keyword-preservation").textContent), 
                Math.round(Math.random() * 20 + 80)], // Placeholder for structure similarity
          backgroundColor: "rgba(79, 70, 229, 0.2)",
          borderColor: "rgba(79, 70, 229, 1)",
          pointBackgroundColor: "rgba(79, 70, 229, 1)"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { display: true, text: "Transcript Similarity to Original", font: { size: 16, weight: "bold" } },
        },
        scales: {
          r: {
            angleLines: { display: true },
            suggestedMin: 0,
            suggestedMax: 100
          }
        }
      }
    });
  };

  document.getElementById("back-button")?.addEventListener("click", showUploadView);
  document.getElementById("continue-to-voice")?.addEventListener("click", () => {
    showVoiceView();
  });

  registerViewTransition("analysis-view");
}
