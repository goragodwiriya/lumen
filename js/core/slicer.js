/**
 * Slicer — cuts the composited image (main + overlay canvases) into an
 * equal grid and downloads all tiles as a single .zip. Uses the global
 * JSZip already loaded from CDN for Batch Export.
 */
import {State} from './state.js';
import {Engine} from './engine.js';
import {toast} from '../ui/toast.js';

const MIME = {jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp'};

/** Grid (cols × rows) for a piece count. `swap` flips the default orientation; always honored, never inferred. */
export function gridForCount(count, swap = false) {
  const layouts = {2: [2, 1], 4: [2, 2], 6: [3, 2], 8: [4, 2]};
  let [cols, rows] = layouts[count] || [count, 1];
  if (swap) [cols, rows] = [rows, cols];
  return {cols, rows};
}

export async function sliceAndDownload(count) {
  if (!State.image) {
    toast('No image to slice', 'error');
    return;
  }
  const w = Engine.canvas.width, h = Engine.canvas.height;
  const {cols, rows} = gridForCount(count, State.export.sliceSwap);

  // Hide the selection outline so it doesn't get baked into the tiles.
  const selected = State.selectedOverlayId;
  if (selected) {State.selectedOverlayId = null; Engine.renderOverlays();}

  // Flatten main + overlay, same composition as a normal export.
  const flat = document.createElement('canvas');
  flat.width = w;
  flat.height = h;
  const fctx = flat.getContext('2d');
  fctx.drawImage(Engine.canvas, 0, 0);
  fctx.drawImage(Engine.overlay, 0, 0);

  if (selected) {State.selectedOverlayId = selected; Engine.renderOverlays();}

  const fmt = MIME[State.export.format] ? State.export.format : 'png';
  const quality = State.export.quality / 100;
  const name = State.export.filename || State.imageName || 'lumen';

  const zip = new JSZip();
  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Round each grid line independently so tiles cover the image exactly
      // even when the size doesn't divide evenly.
      const x0 = Math.round(c * w / cols), x1 = Math.round((c + 1) * w / cols);
      const y0 = Math.round(r * h / rows), y1 = Math.round((r + 1) * h / rows);
      const tile = document.createElement('canvas');
      tile.width = x1 - x0;
      tile.height = y1 - y0;
      tile.getContext('2d').drawImage(flat, x0, y0, tile.width, tile.height, 0, 0, tile.width, tile.height);
      const blob = await new Promise(resolve => tile.toBlob(resolve, MIME[fmt], quality));
      if (!blob) {toast('Slice failed', 'error'); return;}
      zip.file(`${name}-${n++}.${fmt}`, blob);
    }
  }

  const zipBlob = await zip.generateAsync({type: 'blob'});
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-slices-${count}.zip`;
  a.click();
  URL.revokeObjectURL(url);
  toast(`Sliced into ${count} images (${cols}×${rows})`, 'success');
}
