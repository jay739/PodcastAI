  // frontend/src/renderer/lib/domUtils.js
export function hideAllSections() {
    document.querySelectorAll('main > section').forEach(section => {
      section.classList.add('hidden')
    })
}

export function showSection(sectionId) {
    hideAllSections()
    const section = document.getElementById(sectionId)
    if (section) section.classList.remove('hidden')
}