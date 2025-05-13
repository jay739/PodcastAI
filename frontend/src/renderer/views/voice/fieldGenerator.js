export function setupSpeakerFieldLogic() {
    const countInput = document.getElementById("character-count");
    const container = document.getElementById("character-inputs");
    const hostContainer = document.getElementById("host-select-container");
  
    document.getElementById("generate-fields").addEventListener("click", () => {
      let count = Math.min(5, parseInt(countInput.value, 10) || 0);
      // Preserve existing names before regenerating fields
      const existingNames = [];
      container.querySelectorAll('input[id^="character-name-"]').forEach(input => {
        existingNames.push(input.value);
      });
  
      // Rebuild the character input fields, keeping old values
      container.innerHTML = "";
      for (let i = 0; i < count; i++) {
        const nameVal = existingNames[i] || "";
        container.innerHTML += `
          <div class="character-block">
            <label>Speaker ${i + 1} Name:</label>
            <input type="text" id="character-name-${i}" value="${nameVal}" />
            <label>Gender:</label>
            <select id="character-gender-${i}">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="neutral">Neutral</option>
            </select>
            <label>Tone:</label>
            <select id="character-tone-${i}">
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        `;
      }
  
      // Recreate host selector
      hostContainer.innerHTML = `
        <label>Select Host:</label>
        <select id="host-selector">
          <option value="">-- Select Host --</option>
        </select>
      `;
  
      // Attach input event to update host options as names are entered
      for (let i = 0; i < count; i++) {
        const input = document.getElementById(`character-name-${i}`);
        input.addEventListener("input", () => {
          const selector = document.getElementById("host-selector");
          selector.innerHTML = `<option value="">-- Select Host --</option>`;
          for (let j = 0; j < count; j++) {
            const name = document.getElementById(`character-name-${j}`).value;
            if (name) {
              selector.innerHTML += `<option value="${name}">${name}</option>`;
            }
          }
        });
      }
    });
  }
  