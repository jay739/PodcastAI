import { renderForm } from "./fieldGenerator.js";
import { renderTable } from "./tableGenerator.js";
import { state } from "../../store/store.js";

export function setupViewToggle() {
  const toggleBtn = document.getElementById("view-toggle-btn");

  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    state.useTableView = !state.useTableView;
    toggleBtn.innerText = state.useTableView ? "🔁 Switch to Form View" : "🔁 Switch to Table View";
    
    if (state.useTableView) {
      renderTable();
    } else {
      renderForm();
    }
  });

  toggleBtn.innerText = state.useTableView ? "🔁 Switch to Form View" : "🔁 Switch to Table View";
  state.useTableView ? renderTable() : renderForm();
}
