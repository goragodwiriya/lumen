/**
 * Copies the working image to the system clipboard as a PNG — the active
 * crop-tool selection, else the selected layer (isolated on a transparent
 * background), else the whole image (main + overlay canvases flattened,
 * same compositing Exporter uses).
 */
import { State } from './state.js';
import { Engine } from './engine.js';
import { getOverlayBounds } from './overlay-geometry.js';
import { toast } from '../ui/toast.js';

function cropCanvas(source, x, y, w, h) {
  x = Math.max(0, Math.round(x));
  y = Math.max(0, Math.round(y));
  w = Math.max(1, Math.min(source.width - x, Math.round(w)));
  h = Math.max(1, Math.min(source.height - y, Math.round(h)));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(source, x, y, w, h, 0, 0, w, h);
  return c;
}

/** Main + overlay canvases merged into one (selection outline hidden first, like Exporter). */
function flatten() {
  const selected = State.selectedOverlayId;
  if (selected) { State.selectedOverlayId = null; Engine.renderOverlays(); }
  const c = document.createElement('canvas');
  c.width = Engine.canvas.width;
  c.height = Engine.canvas.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(Engine.canvas, 0, 0);
  ctx.drawImage(Engine.overlay, 0, 0);
  if (selected) { State.selectedOverlayId = selected; Engine.renderOverlays(); }
  return c;
}

/** Axis-aligned canvas-space bounds of an overlay. getOverlayBounds() is in the overlay's own unrotated local space, so widen it for rotated text. */
function canvasBounds(o) {
  const b = getOverlayBounds(Engine.octx, o);
  if (!b || o.type !== 'text' || !o.rotation) return b;
  const rad = o.rotation * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const corners = [[0, 0], [b.w, 0], [b.w, b.h], [0, b.h]]
    .map(([lx, ly]) => [o.x + lx * cos - ly * sin, o.y + lx * sin + ly * cos]);
  const xs = corners.map(p => p[0]), ys = corners.map(p => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

/** Redraws just one overlay onto a blank full-size canvas, isolated from the image and other layers. */
function renderOverlayAlone(o) {
  const c = document.createElement('canvas');
  c.width = Engine.canvas.width;
  c.height = Engine.canvas.height;
  const ctx = c.getContext('2d');
  if (o.type === 'path') Engine.drawPath(ctx, o);
  else if (o.type === 'shape') Engine.drawShape(ctx, o);
  else if (o.type === 'text') Engine.drawText(ctx, o);
  else if (o.type === 'image') Engine.drawImageOverlay(ctx, o);
  return c;
}

function selectedOverlayBounds() {
  const o = State.overlays.find(x => x.id === State.selectedOverlayId);
  if (!o) return null;
  const b = canvasBounds(o);
  return b && b.w >= 1 && b.h >= 1 ? { o, b } : null;
}

/** What the copy action currently targets — used to label the Copy button. */
export function copyTarget() {
  if (!State.image) return null;
  if (State.tool === 'crop' && State.crop && State.crop.w >= 1 && State.crop.h >= 1) return 'crop';
  return selectedOverlayBounds() ? 'layer' : 'image';
}

function writeCanvas(canvas, successMessage) {
  canvas.toBlob(async (blob) => {
    if (!blob) { toast('Copy failed', 'error'); return; }
    try {
      // Always PNG (not JPEG) so an isolated-layer copy keeps its transparency.
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast(successMessage, 'success');
    } catch {
      toast('Copy failed — clipboard access denied', 'error');
    }
  }, 'image/png');
}

/** Copy to clipboard: the active crop selection, else the selected layer, else the whole image. */
export function copySelectionOrImage() {
  const target = copyTarget();
  if (!target) return;

  if (target === 'crop') {
    const { x, y, w, h } = State.crop;
    writeCanvas(cropCanvas(flatten(), x, y, w, h), 'Crop selection copied to clipboard');
  } else if (target === 'layer') {
    const { o, b } = selectedOverlayBounds();
    writeCanvas(cropCanvas(renderOverlayAlone(o), b.x, b.y, b.w, b.h), 'Layer copied to clipboard');
  } else {
    writeCanvas(flatten(), 'Image copied to clipboard');
  }
}
