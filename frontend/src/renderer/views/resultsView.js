export function initResultsView() {
    const resultsView = document.getElementById('results-view');
    resultsView.innerHTML = `
        <h2>Results</h2>
        <div id="results-container">
            <p>Generated audio and transcripts will appear here after processing.</p>
        </div>
    `;

    window.displayResults = async () => {
        const jobId = window.currentJobId;
        if (!jobId) return;

        try {
            const response = await fetch(`http://localhost:5001/status/${jobId}`);
            const result = await response.json();
            document.getElementById('results-container').innerText = JSON.stringify(result, null, 2);
        } catch (err) {
            document.getElementById('results-container').innerText = 'Failed to load results.';
        }
    };
}


export function showResultsView() {
    document.querySelectorAll('.view').forEach(view => {
      view.hidden= true;
    });
  
    const resultsView = document.getElementById('results-view');
    if (resultsView) {
      resultsView.hidden = false;
  
      if (typeof window.displayResults === 'function') {
        window.displayResults();
      }
    } else {
      console.error('Results view element not found!');
    }
  }