/**
 * Pixel rulers along the top and left edges of the canvas area, showing
 * image-space coordinates. Purely a viewing aid — separate canvases from
 * the exported image, redrawn whenever the view (pan/zoom) changes.
 */
import { $ } from '../lib/dom.js';
import { State } from '../core/state.js';
import { Engine } from '../core/engine.js';
import { bus } from '../core/bus.js';

let rulerH, rulerV;

const NICE_STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
function pickStep(zoom) {
  const raw = 60 / zoom;
  return NICE_STEPS.find(s => s >= raw) || NICE_STEPS[NICE_STEPS.length - 1];
}

function resizeToCss(canvas) {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
}

export function initRulers() {
  rulerH = $('#rulerH');
  rulerV = $('#rulerV');
  window.addEventListener('resize', renderRulers);
  bus.on('view:changed', renderRulers);
  bus.on('image:loaded', renderRulers);
}

export function toggleRulers(show) {
  State.showRulers = show;
  $('#canvasArea').classList.toggle('show-rulers', show);
  if (show) renderRulers();
}

export function renderRulers() {
  if (!State.showRulers || !State.image || !rulerH) return;
  resizeToCss(rulerH);
  resizeToCss(rulerV);

  const stageRect = Engine.stage.getBoundingClientRect();
  const hRect = rulerH.getBoundingClientRect();
  const vRect = rulerV.getBoundingClientRect();
  const step = pickStep(State.zoom);
  const style = getComputedStyle(document.documentElement);
  const textColor = style.getPropertyValue('--text-dim').trim() || '#888';
  const tickColor = style.getPropertyValue('--border-strong').trim() || '#555';

  const hctx = rulerH.getContext('2d');
  hctx.clearRect(0, 0, rulerH.width, rulerH.height);
  hctx.font = '9px Manrope, sans-serif';
  hctx.textBaseline = 'top';
  const originX = stageRect.left - hRect.left;
  const startV = Math.floor(-originX / (step * State.zoom)) * step;
  for (let v = startV; originX + v * State.zoom <= rulerH.width; v += step) {
    const x = originX + v * State.zoom;
    if (x < -1) continue;
    hctx.strokeStyle = tickColor;
    hctx.beginPath(); hctx.moveTo(x + 0.5, rulerH.height - 7); hctx.lineTo(x + 0.5, rulerH.height); hctx.stroke();
    hctx.fillStyle = textColor;
    hctx.fillText(String(Math.round(v)), x + 3, 2);
  }

  const vctx = rulerV.getContext('2d');
  vctx.clearRect(0, 0, rulerV.width, rulerV.height);
  vctx.font = '9px Manrope, sans-serif';
  vctx.textBaseline = 'top';
  const originY = stageRect.top - vRect.top;
  const startVy = Math.floor(-originY / (step * State.zoom)) * step;
  for (let v = startVy; originY + v * State.zoom <= rulerV.height; v += step) {
    const y = originY + v * State.zoom;
    if (y < -1) continue;
    vctx.strokeStyle = tickColor;
    vctx.beginPath(); vctx.moveTo(rulerV.width - 7, y + 0.5); vctx.lineTo(rulerV.width, y + 0.5); vctx.stroke();
    vctx.save();
    vctx.translate(2, y + 3);
    vctx.rotate(-Math.PI / 2);
    vctx.fillStyle = textColor;
    vctx.fillText(String(Math.round(v)), 0, 0);
    vctx.restore();
  }
}
