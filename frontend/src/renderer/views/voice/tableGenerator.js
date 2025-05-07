import { state } from "../../store/store.js";

export function renderSpeakerTable(container, mode = "table") {
  if (!state.speakers) state.speakers = [];

  container.innerHTML = "";

  // 🔁 TEXTAREA MODE
  if (mode === "text") {
    container.innerHTML = `
      <label style="font-weight: bold;">Enter Speaker Info (one per line, format: Name|Gender|Tone)</label>
      <textarea id="text-speaker-input" style="width: 100%; height: 150px;">${state.speakers.map(sp => `${sp.name}|${sp.gender}|${sp.tone}`).join('\n')}</textarea>
      <div style="margin-top: 1rem;">
        <button id="save-speaker-text" style="padding: 0.5rem 1rem; background: #10b981; color: white; border: none; border-radius: 6px;">💾 Save Speakers</button>
      </div>
    `;

    document.getElementById("save-speaker-text")?.addEventListener("click", () => {
      const inputText = document.getElementById("text-speaker-input").value;
      state.speakers = inputText.trim().split("\n").map(line => {
        const [name, gender = "neutral", tone = "neutral"] = line.split("|").map(s => s.trim());
        return { name, gender, tone };
      });
      renderSpeakerTable(container, "table");
    });

    return;
  }

  // 🧱 TABLE MODE
  const currentHost = state.voiceSettings?.host || "";
  const hostNames = state.speakers.map(sp => sp.name);
  if (!hostNames.includes(currentHost)) state.voiceSettings.host = "";

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
      <label style="font-weight: bold;">Select Host:</label>
      <select id="host-selector" style="margin-left: 1rem; padding: 0.5rem; border-radius: 6px;">
        <option value="">-- Select Host --</option>
        ${state.speakers.map(sp => `<option value="${sp.name}" ${sp.name === state.voiceSettings.host ? "selected" : ""}>${sp.name}</option>`).join("")}
      </select>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th>Name</th><th>Gender</th><th>Tone</th><th>Error</th><th></th>
        </tr>
      </thead>
      <tbody id="speaker-table-body">
        ${state.speakers.map((sp, i) => `
          <tr>
            <td><input type="text" id="table-name-${i}" value="${sp.name}" style="width: 100%; padding: 0.5rem;" /></td>
            <td><select id="table-gender-${i}" style="width: 100%; padding: 0.5rem;">
              <option value="male" ${sp.gender === "male" ? "selected" : ""}>Male</option>
              <option value="female" ${sp.gender === "female" ? "selected" : ""}>Female</option>
            </select></td>
            <td><select id="table-tone-${i}" style="width: 100%; padding: 0.5rem;">
              <option value="positive" ${sp.tone === "positive" ? "selected" : ""}>Positive</option>
              <option value="neutral" ${sp.tone === "neutral" ? "selected" : ""}>Neutral</option>
              <option value="negative" ${sp.tone === "negative" ? "selected" : ""}>Negative</option>
            </select></td>
            <td><span id="error-${i}" style="color: #dc2626;"></span></td>
            <td><button class="remove-row-btn" data-index="${i}" style="color: #dc2626; font-weight: bold;">✖</button></td>
          </tr>`).join("")}
      </tbody>
    </table>
    <div style="text-align: right;">
      <button id="add-row-btn" style="padding: 0.5rem 1rem; border-radius: 6px; background: #4f46e5; color: white; border: none;">➕ Add Row</button>
    </div>
  `;

  // 🗑️ Remove speaker row
  document.querySelectorAll(".remove-row-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      if (!isNaN(index)) {
        state.speakers.splice(index, 1);
        renderSpeakerTable(container, "table");
      }
    });
  });

  // ➕ Add new speaker row
  document.getElementById("add-row-btn")?.addEventListener("click", () => {
    if (state.speakers.length >= 5) {
      alert("⚠️ Max 5 speakers allowed.");
      return;
    }

    document.activeElement?.blur();

    requestAnimationFrame(() => {
      const lastRowInput = document.querySelector("#speaker-table-body tr:last-child input");
      const lastName = lastRowInput?.value.trim();

      if (state.speakers.length > 0 && !lastName) {
        alert("⚠️ Please enter a name for the last speaker before adding a new one.");
        return;
      }

      const rows = Array.from(document.querySelectorAll("#speaker-table-body tr"));
      state.speakers = rows.map(row => ({
        name: row.querySelector("input")?.value.trim() || "",
        gender: row.querySelectorAll("select")[0]?.value || "neutral",
        tone: row.querySelectorAll("select")[1]?.value || "neutral"
      }));

      // Add new blank speaker
      state.speakers.push({ name: "", gender: "neutral", tone: "neutral" });
      renderSpeakerTable(container, "table");
    });
  });

  // 🔁 Update host selector dynamically
  state.speakers.forEach((_, i) => {
    const input = document.getElementById(`table-name-${i}`);
    input?.addEventListener("input", () => {
      const previous = document.getElementById("host-selector")?.value || "";
      const hostSelector = document.getElementById("host-selector");
      hostSelector.innerHTML = `<option value="">-- Select Host --</option>`;
      state.speakers.forEach((sp, j) => {
        const val = document.getElementById(`table-name-${j}`)?.value || "";
        const selected = val === previous ? "selected" : "";
        hostSelector.innerHTML += `<option value="${val}" ${selected}>${val}</option>`;
      });
    });
  });

  // 💾 Save selected host
  document.getElementById("host-selector")?.addEventListener("change", (e) => {
    state.voiceSettings.host = e.target.value;
  });
}
