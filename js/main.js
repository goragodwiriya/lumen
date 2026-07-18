/**
 * Lumen — Browser Image Editor
 * Entry point: wires up every UI module. All feature logic lives in
 * js/core (engine, state, history, io) and js/ui (widgets, panels).
 */
import './core/plugins.js';
import { debounce } from './lib/utils.js';
import { State } from './core/state.js';
import { Engine } from './core/engine.js';
import { initModal } from './ui/modal.js';
import { initToolbar, selectTool } from './ui/toolbar.js';
import { initTopbar } from './ui/topbar.js';
import { initCanvasInteractions } from './ui/canvas-interactions.js';
import { initKeyboard } from './ui/keyboard.js';
import { initDragDrop, initPaste } from './ui/dragdrop.js';
import { initCropBox } from './ui/crop-box.js';
import { initWatermarkUpload } from './ui/watermark-upload.js';
import { initRulers } from './ui/rulers.js';

initModal();
initToolbar();
initTopbar();
initCanvasInteractions();
initKeyboard();
initDragDrop();
initPaste();
initCropBox();
initWatermarkUpload();
initRulers();

selectTool('select');

window.addEventListener('resize', debounce(() => {
  if (State.image) Engine.renderNavigator();
}, 200));
