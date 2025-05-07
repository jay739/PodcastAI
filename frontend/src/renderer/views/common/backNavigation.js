
const viewHistory = []; // stack to track previous views

export function registerViewTransition(currentViewId) {
  if (!viewHistory.length || viewHistory[viewHistory.length - 1] !== currentViewId) {
    viewHistory.push(currentViewId);
  }
}

export function showPreviousView() {
  if (viewHistory.length < 2) return; // current view + one previous minimum
  viewHistory.pop(); // remove current
  const previousViewId = viewHistory.pop(); // get last real previous

  document.querySelectorAll(".view").forEach((el) => (el.hidden = true));
  const previousView = document.getElementById(previousViewId);
  if (previousView) previousView.hidden = false;

  // re-highlight step indicator if it's a known one
  if (previousViewId.includes("upload")) updateStepHighlight("step1");
  else if (previousViewId.includes("analysis")) updateStepHighlight("step2");
  else if (previousViewId.includes("voice")) updateStepHighlight("step3");
  else if (previousViewId.includes("results")) updateStepHighlight("step4");
}

import { updateStepHighlight } from "./layout.js";

// Helper to register from any view
export function setupBackButton(buttonId = "back-button") {
  const backBtn = document.getElementById(buttonId);
  if (backBtn) backBtn.onclick = showPreviousView;
}
