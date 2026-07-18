/**
 * Overlay selection and settings sync between State's tool templates
 * (State.textContent, State.shapeFill, ...) and individual overlay objects.
 */
import { uid } from '../lib/utils.js';
import { State } from './state.js';
import { Engine } from './engine.js';
import { bus } from './bus.js';

export function getSelectedOverlay() {
  return State.overlays.find(o => o.id === State.selectedOverlayId) || null;
}

/**
 * Select an overlay (or clear selection with null). Also loads the
 * overlay's current properties into the matching panel template
 * (State.textFoo / State.shapeFoo) so the Text/Shapes panels show truth,
 * not stale values, and edits target the right object.
 */
export function selectOverlay(id) {
  State.selectedOverlayId = id;
  const o = getSelectedOverlay();
  if (o?.type === 'text') {
    State.textContent = o.text;
    State.textFont = o.font;
    State.textSize = o.size;
    State.textColor = o.color;
    State.textStroke = o.stroke;
    State.textStrokeColor = o.strokeColor;
    State.textShadow = o.shadow;
    State.textOpacity = o.opacity;
    State.textRotation = o.rotation;
  } else if (o?.type === 'shape') {
    State.shapeKind = o.kind;
    State.shapeFill = o.fill;
    State.shapeFillEnabled = o.fillEnabled !== false;
    State.shapeStroke = o.stroke;
    State.shapeStrokeWidth = o.strokeWidth;
    State.shapeOpacity = o.opacity;
  }
  Engine.renderOverlays();
  bus.emit('overlay:selected');
}

/** Copy the current text template onto the selected overlay, if it's text. Returns whether it applied. */
export function applyTextSettingsToSelection() {
  const o = getSelectedOverlay();
  if (!o || o.type !== 'text') return false;
  o.text = State.textContent;
  o.font = State.textFont;
  o.size = State.textSize;
  o.color = State.textColor;
  o.stroke = State.textStroke;
  o.strokeColor = State.textStrokeColor;
  o.shadow = State.textShadow;
  o.opacity = State.textOpacity;
  o.rotation = State.textRotation;
  Engine.renderOverlays();
  return true;
}

/** Copy the current shape template onto the selected overlay, if it's a shape. Returns whether it applied. */
export function applyShapeSettingsToSelection() {
  const o = getSelectedOverlay();
  if (!o || o.type !== 'shape') return false;
  o.fill = State.shapeFill;
  o.fillEnabled = State.shapeFillEnabled;
  o.stroke = State.shapeStroke;
  o.strokeWidth = State.shapeStrokeWidth;
  o.opacity = State.shapeOpacity;
  Engine.renderOverlays();
  return true;
}

/**
 * Replace the watermark overlay with one built from current settings.
 * The overlay's dispatch type is always 'watermark' (picked up by
 * Engine.renderOverlays); the text-vs-image sub-kind is carried
 * separately as `wmType` so it never collides with the dispatch field.
 */
export function updateWatermarkOverlay() {
  State.overlays = State.overlays.filter(o => o.type !== 'watermark');
  const wm = State.watermark;
  const hasContent = wm.type === 'text' ? !!wm.text : !!wm.image;
  if (hasContent) {
    State.overlays.push({ ...wm, type: 'watermark', wmType: wm.type, id: uid() });
  }
  Engine.renderOverlays();
}

/**
 * Add a decoded image as a movable overlay layer ("paste as new layer").
 * `src` must be a data URL so the overlay survives JSON cloning in
 * History snapshots; the engine decodes it through its image cache.
 */
export function addImageOverlay(img, src) {
  const cw = Engine.canvas.width, ch = Engine.canvas.height;
  // Scale down (never up) so the pasted layer lands comfortably inside the canvas.
  const scale = Math.min(1, (cw * 0.8) / img.naturalWidth, (ch * 0.8) / img.naturalHeight);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const o = {
    id: uid(),
    type: 'image',
    src,
    x: Math.round((cw - w) / 2),
    y: Math.round((ch - h) / 2),
    w, h,
    opacity: 100
  };
  State.overlays.push(o);
  selectOverlay(o.id);
  return o;
}

export function deleteSelectedOverlay() {
  if (!State.selectedOverlayId) return false;
  State.overlays = State.overlays.filter(o => o.id !== State.selectedOverlayId);
  selectOverlay(null);
  return true;
}

export function duplicateSelectedOverlay() {
  const o = getSelectedOverlay();
  if (!o) return null;
  const copy = JSON.parse(JSON.stringify(o));
  copy.id = uid();
  if (copy.type === 'path') copy.points.forEach(p => { p.x += 16; p.y += 16; });
  else { copy.x += 16; copy.y += 16; }
  State.overlays.push(copy);
  selectOverlay(copy.id);
  return copy;
}
