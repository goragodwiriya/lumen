/**
 * Global keyboard shortcuts.
 */
import { $ } from '../lib/dom.js';
import { debounce } from '../lib/utils.js';
import { State } from '../core/state.js';
import { Engine } from '../core/engine.js';
import { History } from '../core/history.js';
import { Loader } from '../core/loader.js';
import { getSelectedOverlay, deleteSelectedOverlay, duplicateSelectedOverlay } from '../core/overlays.js';
import { moveOverlayBy } from '../core/overlay-geometry.js';
import { copySelectionOrImage } from '../core/clipboard.js';
import { selectTool } from './toolbar.js';
import { Panel } from './panel-controller.js';
import { pasteFromClipboard } from './paste.js';

const debouncedNudgeHistory = debounce(() => History.push('Move layer'), 400);

const ARROW_DELTA = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]
};

export function initKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger while typing in a field
    if (e.target.matches('input, textarea, select')) return;

    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === 'o') { e.preventDefault(); $('#fileInput').click(); }
    else if (ctrl && e.key === 's') { e.preventDefault(); selectTool('export'); }
    else if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); History.undo(); }
    else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); History.redo(); }
    else if (ctrl && e.key === 'd') {
      if (duplicateSelectedOverlay()) {
        e.preventDefault();
        History.push('Duplicate layer');
        if (Panel.currentTool === 'select') Panel.refreshActive();
      }
    }
    else if (ctrl && e.key === 'v') { e.preventDefault(); pasteFromClipboard(); }
    else if (ctrl && e.key === 'c' && State.image) { e.preventDefault(); copySelectionOrImage(); }
    else if (ARROW_DELTA[e.key]) {
      const o = getSelectedOverlay();
      if (o) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const [dx, dy] = ARROW_DELTA[e.key];
        moveOverlayBy(o, dx * step, dy * step);
        Engine.renderOverlays();
        debouncedNudgeHistory();
      }
    }
    else if (e.key === '+' || e.key === '=') { Engine.zoomBy(1.25); }
    else if (e.key === '-') { Engine.zoomBy(0.8); }
    else if (e.key === '0') { Engine.fitToScreen(); }
    else if (e.key === '1') { State.zoom = 1; State.pan = { x: 0, y: 0 }; Engine.applyZoom(); }
    else if (e.key === 'f' || e.key === 'F') {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
      else document.exitFullscreen?.();
    }
    else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (deleteSelectedOverlay()) {
        History.push('Delete layer');
        if (Panel.currentTool === 'select') Panel.refreshActive();
      }
    }
    else if (e.key === 'Escape') {
      $('#rightPanel').classList.remove('open');
    }
  });
}
