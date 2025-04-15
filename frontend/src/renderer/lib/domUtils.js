export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') {
          element.className = value;
      } else {
          element.setAttribute(key, value);
      }
  });
  
  children.forEach(child => {
      if (typeof child === 'string') {
          element.appendChild(document.createTextNode(child));
      } else {
          element.appendChild(child);
      }
  });
  
  return element;
}

export function toggleElementVisibility(element, isVisible) {
  element.classList.toggle('hidden', !isVisible);
}

export function updateProgressBar(progressElement, percentage) {
  progressElement.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
}

export function disableElements(...elements) {
  elements.forEach(el => {
      if (el) el.disabled = true;
  });
}

export function enableElements(...elements) {
  elements.forEach(el => {
      if (el) el.disabled = false;
  });
}