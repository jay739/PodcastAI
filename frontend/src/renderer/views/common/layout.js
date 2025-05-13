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
    document.documentElement.setAttribute("data-theme", savedTheme);
    themeToggleBtn.textContent = savedTheme === "dark" ? "🌙" : "🌞";

    themeToggleBtn.addEventListener("click", () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      themeToggleBtn.textContent = newTheme === "dark" ? "🌙" : "🌞";
    });

    const loginButton = document.getElementById("login-button");
    const userMenu = document.getElementById("user-menu");
    const loginModal = document.getElementById("login-modal");
    const loginForm = document.getElementById("login-form");
    const cancelLoginBtn = document.getElementById("cancel-login");
    const loginMenuItem = document.getElementById("login-menu-item");
    const logoutMenuItem = document.getElementById("logout-menu-item");
    const usernameDisplay = document.getElementById("username-display");

    function updateUserInterface(isLoggedIn, username = null) {
        loginMenuItem.style.display = isLoggedIn ? "none" : "flex";
        logoutMenuItem.style.display = isLoggedIn ? "flex" : "none";
        loginButton.textContent = isLoggedIn ? "👤" : "👤";
        usernameDisplay.textContent = isLoggedIn ? username : "Not logged in";
        document.getElementById("history-section")?.toggleAttribute("hidden", !isLoggedIn);
    }

    const savedUsername = localStorage.getItem("username");
    if (localStorage.getItem("loggedIn") === "true" && savedUsername) {
        updateUserInterface(true, savedUsername);
    }

    loginButton.addEventListener("click", (e) => {
        e.stopPropagation();
        userMenu.classList.toggle("show");
    });

    document.addEventListener("click", (e) => {
        if (!userMenu.contains(e.target) && !loginButton.contains(e.target)) {
            userMenu.classList.remove("show");
        }
    });

    loginMenuItem.addEventListener("click", () => {
        userMenu.classList.remove("show");
        loginModal.classList.add("show");
    });

    logoutMenuItem.addEventListener("click", () => {
        localStorage.removeItem("loggedIn");
        localStorage.removeItem("username");
        updateUserInterface(false);
        userMenu.classList.remove("show");
    });

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        if (username === "admin" && password === "password") {
          localStorage.setItem("loggedIn", "true");
            localStorage.setItem("username", username);
            updateUserInterface(true, username);
            loginModal.classList.remove("show");
            loginForm.reset();
        } else {
          alert("Invalid credentials.");
        }
    });

    cancelLoginBtn.addEventListener("click", () => {
        loginModal.classList.remove("show");
        loginForm.reset();
    });

    const projectTitle = document.getElementById("project-title");
    projectTitle.style.cursor = "pointer";
    projectTitle.addEventListener("click", () => {
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
  