export function loadTranscriptPreview() {
    fetch(`http://localhost:5001/transcript/${window.currentJobId}.md`)
      .then(res => res.text())
      .then(data => {
        document.getElementById("transcript-text").innerText = data.slice(0, 3000);
      })
      .catch(() => {
        document.getElementById("transcript-text").innerText = "Transcript preview not available.";
      });
  }