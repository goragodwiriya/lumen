/**
 * Invokes a registered plugin against the current composited image and,
 * if it returns a result, replaces the working image with it — the same
 * "bake in current edits, then reset them" pattern used by Crop/Resize
 * (see applyCropNow/applyResize in js/ui/panel-actions.js), so a plugin
 * result can't silently double-apply adjustments/filters/enhance on top
 * of what the plugin already baked in.
 */
import { State, defaultAdjustments, defaultEnhance, defaultEffects } from './state.js';
import { Engine } from './engine.js';
import { History } from './history.js';
import { Lumen } from './plugins.js';

export function hasPlugin(id) {
  return !!Lumen.plugin.get(id);
}

/**
 * Composite the current main + overlay canvases (what the user actually
 * sees — adjustments/filter/enhance/effects/overlays all baked in) into
 * a single PNG blob to hand to the plugin.
 */
function compositeBlob() {
  return new Promise((resolve, reject) => {
    const c = document.createElement('canvas');
    c.width = Engine.canvas.width;
    c.height = Engine.canvas.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(Engine.canvas, 0, 0);
    ctx.drawImage(Engine.overlay, 0, 0);
    c.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed to composite image')), 'image/png');
  });
}

function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Plugin returned an unreadable image')); };
    img.src = url;
  });
}

/**
 * Run plugin `id` and, if it returns image data, make that the new
 * working image. Returns `{ replaced: boolean }`. Throws on error or if
 * no image is loaded — callers should catch and toast.
 */
export async function runPlugin(id, historyLabel) {
  const plugin = Lumen.plugin.get(id);
  if (!plugin) throw new Error(`No plugin registered for "${id}"`);
  if (!State.image) throw new Error('No image loaded');

  const inputBlob = await compositeBlob();
  const result = await plugin.run(inputBlob, {
    width: Engine.canvas.width,
    height: Engine.canvas.height,
    imageName: State.imageName
  });

  if (!result) return { replaced: false };

  const blob = result instanceof Blob ? result : result.blob;
  if (!(blob instanceof Blob)) {
    throw new Error('Plugin must return a Blob (or { blob }) — got ' + typeof result);
  }
  const img = await blobToImage(blob);

  State.image = img;
  State.originalWidth = img.naturalWidth;
  State.originalHeight = img.naturalHeight;
  Engine.setSize(img.naturalWidth, img.naturalHeight);
  // The plugin's output already reflects prior adjustments/filter/enhance/
  // effects (they were baked into the composite we sent it) — reset them
  // so they don't get applied a second time on top of the result.
  State.adjustments = defaultAdjustments();
  State.enhance = defaultEnhance();
  State.effects = defaultEffects();
  State.filter = 'original';
  Engine.render();
  Engine.fitToScreen();
  History.push(historyLabel || `AI: ${id}`);
  return { replaced: true };
}
