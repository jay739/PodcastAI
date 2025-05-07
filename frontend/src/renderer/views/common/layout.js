import { showUploadView, showAnalysisView, showVoiceView, showResultsView } from '../index.js';
import { state } from '../../store/store.js';

export function showWelcomeScreen() {
    document.getElementById("step-tracker").style.display = "none";
    document.getElementById("welcome-screen").hidden = false;
    document.getElementById("app-container").hidden = true;
    document.getElementById("persistent-header").hidden = true;
  }
  
  export function hideWelcomeShowApp() {
    document.getElementById("step-tracker").style.display = "flex";
    document.getElementById("welcome-screen").hidden = true;
    document.getElementById("app-container").hidden = false;
    document.getElementById("persistent-header").hidden = false;
  }
  
  export function setupHeaderControls() {
    
    
    const stepHandlers = [
      { id: "step1", handler: showUploadView },
      { id: "step2", handler: showAnalysisView },
      { id: "step3", handler: showVoiceView },
      { id: "step4", handler: showResultsView },
    ];
    
    stepHandlers.forEach((step, index) => {
      const el = document.getElementById(step.id);
      if (el) {
        el.addEventListener("click", () => {
          if (index <= state.allowedStepIndex) {
            step.handler();
          }
        });
      }
    });
    
    
    const themeToggleBtn = document.getElementById("theme-toggle");
    const savedTheme = localStorage.getItem("theme") || "light";
    // Set initial theme and icon
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeToggleBtn.textContent = savedTheme === "dark" ? "🌙" : "🌞";

    // Theme toggle: switch between light and dark mode on click
    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      // Apply the new theme (assuming CSS is using [data-theme] or classes)
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      // Update icon: sun for light mode, moon for dark mode
      themeToggleBtn.textContent = newTheme === "dark" ? "🌙" : "🌞";
    });
    const loginButton = document.getElementById("login-button");
    // Login toggle: (unchanged logic from Issue 1, but now using icons only)
    loginButton.addEventListener("click", () => {
      if (localStorage.getItem("loggedIn") === "true") {
        localStorage.removeItem("loggedIn");
        alert("Logged out.");
        loginButton.textContent = "👤";
        document.getElementById("history-section")?.setAttribute("hidden", "true");
      } else {
        const username = prompt("Enter username:");
        const password = prompt("Enter password:");
        if (username === "admin" && password === "password") {
          localStorage.setItem("loggedIn", "true");
          alert("Login successful.");
          loginButton.textContent = "🔒";
          document.getElementById("history-section")?.removeAttribute("hidden");
        } else {
          alert("Invalid credentials.");
        }
      }
    });

    const projectTitle = document.getElementById("project-title");
    projectTitle.style.cursor = "pointer";
    projectTitle.addEventListener("click", () => {
        // Reset application state and return to welcome screen
        state.reset();
        document.getElementById("persistent-header").hidden = true;
        document.getElementById("app-container").hidden = true;
        document.getElementById("welcome-screen").hidden = false;
        document.getElementById("step-tracker").style.display = "none";
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
  