/**
 * Handlers for the panels' data-action buttons.
 */
import { $ } from '../lib/dom.js';
import { State, defaultAdjustments, defaultEnhance, defaultEffects } from '../core/state.js';
import { Engine } from '../core/engine.js';
import { History } from '../core/history.js';
import { Loader } from '../core/loader.js';
import { Exporter } from '../core/exporter.js';
import { updateWatermarkOverlay } from '../core/overlays.js';
import { getOverlayBounds, moveOverlayBy } from '../core/overlay-geometry.js';
import { copySelectionOrImage } from '../core/clipboard.js';
import { hideCropBox } from './crop-box.js';
import { openBatchModal } from './batch-modal.js';
import { toast } from './toast.js';
import { showModal } from './modal.js';

export function handleAction(action, panel) {
  switch (action) {
    case 'undo': History.undo(); break;
    case 'redo': History.redo(); break;
    case 'reset': History.reset(); break;

    case 'duplicate':
      if (State.image) {
        const c = document.createElement('canvas');
        c.width = Engine.canvas.width;
        c.height = Engine.canvas.height;
        c.getContext('2d').drawImage(Engine.canvas, 0, 0);
        c.toBlob(b => {
          const file = new File([b], State.imageName + '-copy.png', { type: 'image/png' });
          Loader.loadFile(file);
        });
      }
      break;

    case 'copy-image':
      copySelectionOrImage();
      break;

    case 'auto-adjust':
      State.adjustments.brightness = 108;
      State.adjustments.contrast = 115;
      State.adjustments.saturation = 115;
      State.adjustments.highlights = -15;
      State.adjustments.shadows = 20;
      Engine.render();
      panel.refreshActive();
      History.push('Auto adjust');
      toast('Auto adjusted', 'success');
      break;

    case 'reset-adjust':
      State.adjustments = defaultAdjustments();
      Engine.render();
      panel.refreshActive();
      History.push('Reset adjustments');
      break;

    case 'reset-enhance':
      State.enhance = defaultEnhance();
      Engine.render();
      panel.refreshActive();
      History.push('Reset enhancements');
      break;

    case 'reset-effects':
      State.effects = defaultEffects();
      Engine.render();
      panel.refreshActive();
      History.push('Reset effects');
      break;

    case 'reset-filter':
      State.filter = 'original';
      Engine.render();
      panel.refreshActive();
      break;

    case 'rotate-left':
      State.transform.rotation -= 90;
      Engine.render();
      panel.refreshActive();
      History.push('Rotate -90°');
      break;

    case 'rotate-right':
      State.transform.rotation += 90;
      Engine.render();
      panel.refreshActive();
      History.push('Rotate +90°');
      break;

    case 'flip-h':
      State.transform.flipH = !State.transform.flipH;
      Engine.render();
      History.push('Flip horizontal');
      break;

    case 'flip-v':
      State.transform.flipV = !State.transform.flipV;
      Engine.render();
      History.push('Flip vertical');
      break;

    case 'resize-apply':
      applyResize(panel);
      break;

    case 'crop-apply':
      applyCropNow(panel);
      break;

    case 'crop-cancel':
      State.crop = null;
      hideCropBox();
      panel.refreshActive();
      break;

    case 'crop-reset':
      State.transform = { rotation: 0, flipH: false, flipV: false };
      Engine.render();
      panel.refreshActive();
      History.push('Reset transform');
      break;

    case 'add-text':
      toast('Click on image to place text', 'info', 2000);
      break;

    case 'clear-draw':
      State.overlays = State.overlays.filter(o => o.type !== 'path');
      Engine.renderOverlays();
      History.push('Clear strokes');
      break;

    case 'wm-apply':
      updateWatermarkOverlay();
      History.push('Add watermark');
      toast('Watermark added', 'success');
      panel.refreshActive();
      break;

    case 'wm-remove':
      State.overlays = State.overlays.filter(o => o.type !== 'watermark');
      Engine.renderOverlays();
      History.push('Remove watermark');
      panel.refreshActive();
      break;

    case 'wm-upload':
      $('#wmFileInput').click();
      break;

    case 'bg-apply':
      Engine.render();
      History.push('Background: ' + State.background.type);
      toast('Background applied', 'success');
      break;

    case 'export-now':
      Exporter.export();
      break;

    case 'slice-swap':
      State.export.sliceSwap = !State.export.sliceSwap;
      panel.refreshActive();
      break;

    case 'batch':
      openBatchModal();
      break;

    case 'clear-history':
      State.history = State.history.slice(0, 1);
      State.historyIndex = 0;
      History.updateButtons();
      panel.refreshActive();
      break;

    case 'view-exif':
      showModal('EXIF Data', State.image ? 'Camera: —\nDate: —\nISO: —\nAperture: —\nExposure: —\n\nNo EXIF metadata found in this image.' : 'No image loaded.', [{ label: 'Close' }]);
      break;

    case 'strip-metadata':
      toast('Metadata will be stripped on next export', 'info');
      break;
  }
}

function applyResize(panel) {
  const w = parseInt($('#resizeW').value);
  const h = parseInt($('#resizeH').value);
  if (!w || !h || !State.image) return;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w;
  tempCanvas.height = h;
  tempCanvas.getContext('2d').drawImage(Engine.canvas, 0, 0, w, h);

  tempCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      State.image = img;
      State.originalWidth = w;
      State.originalHeight = h;
      Engine.setSize(w, h);
      // The canvas we copied from already had adjustments/filter/enhance
      // baked in, so start the new base image clean to avoid double-applying.
      State.adjustments = defaultAdjustments();
      State.enhance = defaultEnhance();
      State.filter = 'original';
      Engine.render();
      Engine.fitToScreen();
      History.push(`Resize to ${w}×${h}`);
      toast(`Resized to ${w}×${h}`, 'success');
      panel.refreshActive();
    };
    img.src = url;
  });
}

function overlayIntersects(o, cx, cy, cw, ch) {
  const b = getOverlayBounds(Engine.octx, o);
  if (!b) return true;
  return b.x < cx + cw && b.x + b.w > cx && b.y < cy + ch && b.y + b.h > cy;
}

function applyCropNow(panel) {
  if (!State.crop || !State.image) { toast('Draw a crop area first', 'info'); return; }
  const { x, y, w, h } = State.crop;
  if (w < 5 || h < 5) { toast('Crop area too small', 'error'); return; }

  const cropped = document.createElement('canvas');
  cropped.width = Math.round(w);
  cropped.height = Math.round(h);
  cropped.getContext('2d').drawImage(Engine.canvas, x, y, w, h, 0, 0, cropped.width, cropped.height);

  cropped.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      State.image = img;
      State.originalWidth = cropped.width;
      State.originalHeight = cropped.height;
      Engine.setSize(cropped.width, cropped.height);

      // Keep overlays that still fall (at least partly) inside the kept region,
      // and shift their coordinates into the new, smaller canvas space.
      State.overlays = State.overlays
        .filter(o => o.type === 'watermark' || overlayIntersects(o, x, y, w, h))
        .map(o => { if (o.type !== 'watermark') moveOverlayBy(o, -x, -y); return o; });

      // The crop baked in current adjustments/filter/enhance — start clean.
      State.adjustments = defaultAdjustments();
      State.enhance = defaultEnhance();
      State.filter = 'original';
      State.transform = { rotation: 0, flipH: false, flipV: false };
      State.crop = null;
      State.selectedOverlayId = null;
      hideCropBox();

      Engine.render();
      Engine.fitToScreen();
      History.push('Crop');
      toast('Cropped', 'success');
      panel.refreshActive();
    };
    img.src = url;
  });
}
