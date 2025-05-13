// frontend/src/renderer/views/common/backNavigation.js
export function registerViewTransition(viewId) {
    const view = document.getElementById(viewId);
    if (view) {
      view.style.opacity = "0";
      setTimeout(() => {
        view.style.opacity = "1";
      }, 50);
    }
  }

export function setupBackButton(buttonId) {
  const backButton = document.getElementById(buttonId);
  if (backButton) {
    backButton.addEventListener("click", () => {
      window.history.back();
    });
  }
}