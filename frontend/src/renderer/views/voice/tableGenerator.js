// tableGenerator.js

import { state } from "../../store/store.js";

export function renderSpeakerTable(container) {
  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <label style="font-weight: bold;">Select Host:</label>
      <select id="host-selector" style="margin-left: 1rem; padding: 0.5rem; border-radius: 6px;">
        <option value="">-- Select Host --</option>
        ${state.speakers
          .map(
            (sp, i) =>
              `<option value="${sp.name}" ${
                state.voiceSettings.host === sp.name ? "selected" : ""
              }>${sp.name}</option>`
          )
          .join("")}
      </select>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 0.75rem; border: 1px solid #ccc;">Name</th>
          <th style="padding: 0.75rem; border: 1px solid #ccc;">Gender</th>
          <th style="padding: 0.75rem; border: 1px solid #ccc;">Tone</th>
          <th style="padding: 0.75rem; border: 1px solid #ccc;">Error</th>
          <th style="padding: 0.75rem; border: 1px solid #ccc;"></th>
        </tr>
      </thead>
      <tbody id="speaker-table-body">
        ${state.speakers
          .map(
            (sp, i) => `
          <tr>
            <td style="padding: 0.75rem; border: 1px solid #ddd;">
              <input type="text" id="table-name-${i}" value="${sp.name}" style="width: 100%; padding: 0.5rem;" />
            </td>
            <td style="padding: 0.75rem; border: 1px solid #ddd;">
              <select id="table-gender-${i}" style="width: 100%; padding: 0.5rem;">
                <option value="male" ${sp.gender === "male" ? "selected" : ""}>Male</option>
                <option value="female" ${sp.gender === "female" ? "selected" : ""}>Female</option>
                <option value="neutral" ${sp.gender === "neutral" ? "selected" : ""}>Neutral</option>
              </select>
            </td>
            <td style="padding: 0.75rem; border: 1px solid #ddd;">
              <select id="table-tone-${i}" style="width: 100%; padding: 0.5rem;">
                <option value="positive" ${sp.tone === "positive" ? "selected" : ""}>Positive</option>
                <option value="neutral" ${sp.tone === "neutral" ? "selected" : ""}>Neutral</option>
                <option value="negative" ${sp.tone === "negative" ? "selected" : ""}>Negative</option>
              </select>
            </td>
            <td style="padding: 0.75rem; border: 1px solid #ddd;">
              <span id="error-${i}" style="color: #dc2626;"></span>
            </td>
            <td style="padding: 0.75rem; border: 1px solid #ddd; text-align: center;">
              <button class="remove-row-btn" data-index="${i}" style="color: #dc2626; font-weight: bold;">✖</button>
            </td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  // Add event listeners to update host dropdown dynamically
  state.speakers.forEach((_, i) => {
    const input = document.getElementById(`table-name-${i}`);
    input?.addEventListener("input", () => {
      const hostSelect = document.getElementById("host-selector");
      const previous = hostSelect.value;

      hostSelect.innerHTML = `<option value="">-- Select Host --</option>`;
      state.speakers.forEach((sp, j) => {
        const nameVal = document.getElementById(`table-name-${j}`)?.value || "";
        const selected = nameVal === previous ? "selected" : "";
        hostSelect.innerHTML += `<option value="${nameVal}" ${selected}>${nameVal}</option>`;
      });
    });
  });

  // Remove row buttons
  const removeBtns = container.querySelectorAll(".remove-row-btn");
  removeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      if (!isNaN(index)) {
        state.speakers.splice(index, 1);
        renderSpeakerTable(container);
      }
    });
  });
}
