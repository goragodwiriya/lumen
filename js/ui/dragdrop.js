/**
 * Drag & drop and paste-to-open.
 */
import { $ } from '../lib/dom.js';
import { Loader } from '../core/loader.js';
import { handleImagePaste } from './paste.js';

export function initDragDrop() {
  const area = $('#canvasArea');
  const overlay = $('#dropOverlay');

  area.addEventListener('dragover', (e) => {
    e.preventDefault();
    overlay.classList.add('active');
  });
  area.addEventListener('dragleave', (e) => {
    if (e.target === area) overlay.classList.remove('active');
  });
  area.addEventListener('drop', (e) => {
    e.preventDefault();
    overlay.classList.remove('active');
    Array.from(e.dataTransfer.files).forEach(f => Loader.loadFile(f));
  });
}

export function initPaste() {
  document.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        if (blob) {
          const file = new File([blob], 'pasted.png', { type: blob.type });
          handleImagePaste(file);
        }
      }
    }
  });
}
