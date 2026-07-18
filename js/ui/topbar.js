/**
 * Top bar, empty-state buttons, floating canvas controls,
 * theme toggle and fullscreen.
 */
import { $ } from '../lib/dom.js';
import { State, defaultAdjustments } from '../core/state.js';
import { Engine } from '../core/engine.js';
import { History } from '../core/history.js';
import { Loader } from '../core/loader.js';
import { showModal } from './modal.js';
import { openCamera } from './camera.js';
import { selectTool } from './toolbar.js';
import { toggleRulers } from './rulers.js';

const MOON_ICON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
const SUN_ICON = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';

export function initTopbar() {
  $('#btnOpen').onclick = () => $('#fileInput').click();
  $('#btnSave').onclick = () => selectTool('export');
  $('#btnUndo').onclick = () => History.undo();
  $('#btnRedo').onclick = () => History.redo();
  $('#btnReset').onclick = () => {
    if (State.history.length > 0) {
      showModal('Reset all changes?', 'This will revert all edits to the original image.', [
        { label: 'Cancel' },
        { label: 'Reset', style: 'primary', onClick: () => History.reset() }
      ]);
    }
  };
  $('#btnZoomIn').onclick = () => Engine.zoomBy(1.25);
  $('#btnZoomOut').onclick = () => Engine.zoomBy(0.8);
  $('#btnZoomFit').onclick = () => Engine.fitToScreen();
  $('#btnFullscreen').onclick = toggleFullscreen;
  $('#btnTheme').onclick = toggleTheme;
  $('#themeIcon').innerHTML = MOON_ICON;

  // Empty state
  $('#emptyOpen').onclick = () => $('#fileInput').click();
  $('#emptyCamera').onclick = openCamera;
  $('#emptySample').onclick = () => {
    const seed = Math.floor(Math.random() * 1000);
    Loader.loadFromUrl(`https://picsum.photos/seed/${seed}/1200/800.jpg`, 'sample');
  };

  // File input
  $('#fileInput').onchange = (e) => {
    Array.from(e.target.files).forEach(f => Loader.loadFile(f));
    e.target.value = '';
  };

  initCanvasControls();
}

function initCanvasControls() {
  $('#ccGrid').onclick = (e) => {
    State.showGrid = !State.showGrid;
    e.currentTarget.classList.toggle('active', State.showGrid);
    Engine.renderGrid();
  };
  $('#ccRulers').onclick = (e) => {
    const show = !State.showRulers;
    e.currentTarget.classList.toggle('active', show);
    toggleRulers(show);
  };
  $('#ccNav').onclick = (e) => {
    State.showNavigator = !State.showNavigator;
    e.currentTarget.classList.toggle('active', State.showNavigator);
    $('#navigator').classList.toggle('hidden', !State.showNavigator);
  };

  // Hold to compare with the unedited original
  let prevFilter = null;
  let prevAdjustments = null;
  $('#ccOriginal').addEventListener('mousedown', () => {
    prevFilter = State.filter;
    prevAdjustments = JSON.parse(JSON.stringify(State.adjustments));
    State.filter = 'original';
    State.adjustments = defaultAdjustments();
    Engine.render();
  });
  $('#ccOriginal').addEventListener('mouseup', () => {
    if (prevFilter === null) return;
    State.filter = prevFilter;
    State.adjustments = prevAdjustments;
    prevFilter = prevAdjustments = null;
    Engine.render();
  });
}

export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

export function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  State.theme = next;
  $('#themeIcon').innerHTML = next === 'dark' ? MOON_ICON : SUN_ICON;
  if (State.image) Engine.render();
}
