export function handleModelSelection() {
    const modelSelect = document.getElementById("tts-model-select");
    const modelInfo = document.getElementById("model-info");
  
    modelSelect.addEventListener("change", () => {
      const val = modelSelect.value;
      const info = {
        bark: "🧠 Balanced speed and quality with Bark Small.",
        xtts: "⚡ Fast (~10s/speaker), good clarity.",
        kokoro: "🎧 High-quality and expressive, slower (~30s/speaker)."
      }[val] || "Select a TTS model.";
      modelInfo.innerText = info;
      localStorage.setItem("selectedTTSModel", val);
    });
  
    const last = localStorage.getItem("selectedTTSModel") || "bark";
    modelSelect.value = last;
    modelSelect.dispatchEvent(new Event("change"));
  }