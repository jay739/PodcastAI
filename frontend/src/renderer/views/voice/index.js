import { initVoiceView } from "./initVoiceView.js";
import { registerViewTransition } from "../common/backNavigation.js";

export function showVoiceView() {
    document.querySelectorAll(".view").forEach((view) => {
      view.hidden = true;
    });
  
    const view = document.getElementById("voice-view");
    if (view) {
      view.hidden = false;
      document.querySelectorAll("#step-tracker .step").forEach((el) => {
        el.style.color = "#6b7280";
        el.style.fontWeight = "normal";
      });
      document.getElementById("step3").style.color = "#4f46e5";
      document.getElementById("step3").style.fontWeight = "bold";  
      registerViewTransition("voice-view");
      initVoiceView();
    }
  }
