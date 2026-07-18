/**
 * Draggable/resizable crop selection box, rendered as a DOM element inside
 * #canvasStage so it inherits the stage's zoom transform automatically —
 * its left/top/width/height are plain canvas-pixel units.
 */
import { $ } from '../lib/dom.js';
import { clamp } from '../lib/utils.js';
import { State } from '../core/state.js';
import { Engine } from '../core/engine.js';
import { bus } from '../core/bus.js';

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
let box = null;
let dragMode = null, dragStart = null, cropStart = null;

export function initCropBox() {
  box = document.createElement('div');
  box.className = 'crop-box';
  box.id = 'cropBox';
  box.style.display = 'none';
  HANDLES.forEach(h => {
    const el = document.createElement('div');
    el.className = `crop-handle crop-handle-${h}`;
    el.dataset.handle = h;
    box.appendChild(el);
  });
  $('#canvasStage').appendChild(box);

  box.addEventListener('mousedown', onBoxMouseDown);
  document.addEventListener('mousemove', onDocMouseMove);
  document.addEventListener('mouseup', onDocMouseUp);

  bus.on('image:loaded', () => hideCropBox());
}

function defaultCrop() {
  const w = Engine.canvas.width, h = Engine.canvas.height;
  const cw = w * 0.8, ch = h * 0.8;
  return { x: (w - cw) / 2, y: (h - ch) / 2, w: cw, h: ch };
}

export function showCropBox() {
  if (!State.image) return;
  if (!State.crop) State.crop = defaultCrop();
  box.style.display = 'block';
  render();
}

export function hideCropBox() {
  if (box) box.style.display = 'none';
}

function render() {
  const c = State.crop;
  if (!c) return;
  box.style.left = c.x + 'px';
  box.style.top = c.y + 'px';
  box.style.width = c.w + 'px';
  box.style.height = c.h + 'px';
}

function onBoxMouseDown(e) {
  const handle = e.target.dataset.handle;
  dragMode = handle || 'move';
  dragStart = { x: e.clientX, y: e.clientY };
  cropStart = { ...State.crop };
  e.stopPropagation();
  e.preventDefault();
}

function aspectRatio() {
  const a = State.cropAspect;
  if (a === 'free') return null;
  if (a === 'a4') return 210 / 297;
  const [w, h] = a.split(':').map(Number);
  return w / h;
}

function onDocMouseMove(e) {
  if (!dragMode) return;
  const dx = (e.clientX - dragStart.x) / State.zoom;
  const dy = (e.clientY - dragStart.y) / State.zoom;
  const canvasW = Engine.canvas.width, canvasH = Engine.canvas.height;
  const ratio = aspectRatio();
  let { x, y, w, h } = cropStart;

  if (dragMode === 'move') {
    x = clamp(cropStart.x + dx, 0, canvasW - w);
    y = clamp(cropStart.y + dy, 0, canvasH - h);
  } else {
    let nx = cropStart.x, ny = cropStart.y, nw = cropStart.w, nh = cropStart.h;
    if (dragMode.includes('e')) nw = cropStart.w + dx;
    if (dragMode.includes('s')) nh = cropStart.h + dy;
    if (dragMode.includes('w')) { nx = cropStart.x + dx; nw = cropStart.w - dx; }
    if (dragMode.includes('n')) { ny = cropStart.y + dy; nh = cropStart.h - dy; }

    if (ratio) {
      if (dragMode === 'n' || dragMode === 's') nw = nh * ratio;
      else nh = nw / ratio;
      if (dragMode.includes('w')) nx = cropStart.x + cropStart.w - nw;
      if (dragMode.includes('n')) ny = cropStart.y + cropStart.h - nh;
    }

    nw = Math.max(20, nw);
    nh = Math.max(20, nh);
    nx = clamp(nx, 0, canvasW - nw);
    ny = clamp(ny, 0, canvasH - nh);
    nw = Math.min(nw, canvasW - nx);
    nh = Math.min(nh, canvasH - ny);
    x = nx; y = ny; w = nw; h = nh;
  }

  State.crop = { x, y, w, h };
  render();
}

function onDocMouseUp() {
  dragMode = null;
}

/** Re-fit the current crop box to a newly chosen aspect ratio, keeping its center. */
export function setCropAspect(id) {
  State.cropAspect = id;
  if (!State.crop || id === 'free') return;
  const ratio = aspectRatio();
  const c = State.crop;
  const canvasW = Engine.canvas.width, canvasH = Engine.canvas.height;
  let w = c.w, h = c.w / ratio;
  if (h > canvasH) { h = canvasH; w = h * ratio; }
  if (w > canvasW) { w = canvasW; h = w / ratio; }
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  const x = clamp(cx - w / 2, 0, canvasW - w);
  const y = clamp(cy - h / 2, 0, canvasH - h);
  State.crop = { x, y, w, h };
  render();
}
