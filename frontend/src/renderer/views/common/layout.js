// views/common/layout.js

export function showWelcomeScreen() {
    document.getElementById("welcome-screen").hidden = false;
    document.getElementById("app-container").hidden = true;
    document.getElementById("persistent-header").hidden = true;
  }
  
  export function hideWelcomeShowApp() {
    document.getElementById("welcome-screen").hidden = true;
    document.getElementById("app-container").hidden = false;
    document.getElementById("persistent-header").hidden = false;
  }
  
  export function setupHeaderControls() {
    const themeToggle = document.getElementById("theme-toggle");
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeToggle.value = savedTheme;
  
    themeToggle.addEventListener("change", () => {
      const selectedTheme = themeToggle.value;
      document.documentElement.setAttribute("data-theme", selectedTheme);
      localStorage.setItem("theme", selectedTheme);
    });
  
    document.getElementById("login-button")?.addEventListener("click", () => {
      alert("🔐 Login functionality coming soon!");
    });
  }
  
  export function updateStepHighlight(currentStep) {
    ["step1", "step2", "step3", "step4"].forEach((id) => {
      const stepEl = document.getElementById(id);
      if (stepEl) {
        stepEl.classList.remove("active-step");
      }
    });
  
    const current = document.getElementById(currentStep);
    if (current) {
      current.classList.add("active-step");
    }
  }
  