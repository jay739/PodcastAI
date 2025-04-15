import { state } from '../store/store.js';

export function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export async function handleFileSelection(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return null;
    
    const file = fileInput.files[0];
    if (file.type !== 'application/pdf') {
        throw new Error('Please select a PDF file');
    }
    
    state.currentFile = {
        name: file.name,
        size: file.size,
        path: file.path
    };
    
    return state.currentFile;
}

export function setupFileDropZone(dropZone, fileInput, onFileSelected) {
    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    ['dragenter', 'dragover'].forEach(event => {
        dropZone.addEventListener(event, () => {
            dropZone.classList.add('border-blue-500', 'bg-blue-50');
        });
    });

    ['dragleave', 'drop'].forEach(event => {
        dropZone.addEventListener(event, () => {
            dropZone.classList.remove('border-blue-500', 'bg-blue-50');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            onFileSelected();
        }
    });

    fileInput.addEventListener('change', onFileSelected);
}