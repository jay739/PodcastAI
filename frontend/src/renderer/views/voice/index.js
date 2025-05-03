// views/voice/index.js

import { initVoiceView } from "./initVoiceView.js";
import { registerViewTransition } from "../common/backNavigation.js";

export function showVoiceView() {
    document.querySelectorAll(".view").forEach((view) => {
      view.hidden = true;
    });
  
    const view = document.getElementById("voice-view");
    if (view) {
      view.hidden = false;
      initVoiceView();
      registerViewTransition("voice-view");
    }
  }
