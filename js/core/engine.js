/**
 * CanvasEngine — renders the working image, overlays, navigator,
 * and owns zoom / pan / fit-to-screen of the canvas stage.
 */
import { $ } from '../lib/dom.js';
import { clamp } from '../lib/utils.js';
import { State } from './state.js';
import { FILTER_PRESETS } from '../config/filters.js';
import { getOverlayBounds } from './overlay-geometry.js';
import { unsharpMask, softenBlend } from './pixel-fx.js';
import { bus } from './bus.js';

// Lazily-decoded image cache (watermark + image overlays), keyed by data URL.
// Re-renders once an image finishes loading so it appears without user interaction.
const watermarkImageCache = new Map();
function getCachedImage(src) {
  if (!src) return null;
  let entry = watermarkImageCache.get(src);
  if (!entry) {
    const img = new Image();
    entry = { img, loaded: false };
    img.onload = () => { entry.loaded = true; Engine.render(); };
    img.src = src;
    watermarkImageCache.set(src, entry);
  }
  return entry.loaded ? entry.img : null;
}

/** Anchor a `tw` x `th` box at one of the 9 grid positions within a `cw` x `ch` area. */
function anchoredXY(position, cw, ch, tw, th, margin) {
  if (position === 'tl') return { x: margin, y: margin };
  if (position === 'tc') return { x: (cw - tw) / 2, y: margin };
  if (position === 'tr') return { x: cw - tw - margin, y: margin };
  if (position === 'ml') return { x: margin, y: (ch - th) / 2 };
  if (position === 'mc') return { x: (cw - tw) / 2, y: (ch - th) / 2 };
  if (position === 'mr') return { x: cw - tw - margin, y: (ch - th) / 2 };
  if (position === 'bl') return { x: margin, y: ch - th - margin };
  if (position === 'bc') return { x: (cw - tw) / 2, y: ch - th - margin };
  return { x: cw - tw - margin, y: ch - th - margin }; // br
}

class CanvasEngine {
  constructor() {
    this.stage = $('#canvasStage');
    this.canvas = $('#mainCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.overlay = $('#overlayCanvas');
    this.octx = this.overlay.getContext('2d');
    this.grid = $('#gridCanvas');
    this.gctx = this.grid.getContext('2d');
    this.navCanvas = $('#navCanvas');
    this.navCtx = this.navCanvas.getContext('2d');
    this._rafPending = false;
  }

  setSize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.overlay.width = w;
    this.overlay.height = h;
    this.grid.width = w;
    this.grid.height = h;
    this.stage.style.width = w + 'px';
    this.stage.style.height = h + 'px';
  }

  /** Compose the CSS filter string from adjustments + dehaze + active preset. */
  buildFilter() {
    const a = State.adjustments;
    const parts = [];
    parts.push(`brightness(${a.brightness}%)`);
    parts.push(`contrast(${a.contrast}%)`);
    parts.push(`saturate(${a.saturation}%)`);
    parts.push(`hue-rotate(${a.hue}deg)`);
    if (a.blur > 0) parts.push(`blur(${a.blur}px)`);
    if (a.opacity < 100) parts.push(`opacity(${a.opacity}%)`);
    if (a.exposure !== 0) parts.push(`brightness(${100 + a.exposure * 0.5}%)`);
    if (a.temperature !== 0) {
      const t = a.temperature / 100;
      if (t > 0) parts.push(`sepia(${t * 30}%) hue-rotate(${-t * 15}deg)`);
      else parts.push(`hue-rotate(${-t * 15}deg) saturate(${1 + Math.abs(t) * 0.2})`);
    }
    const dehaze = State.enhance?.dehaze || 0;
    if (dehaze > 0) {
      const d = dehaze / 100;
      parts.push(`contrast(${100 + d * 25}%) saturate(${100 + d * 20}%) brightness(${100 - d * 6}%)`);
    }
    const preset = FILTER_PRESETS[State.filter];
    if (preset && preset.filter) parts.push(preset.filter);
    return parts.join(' ');
  }

  render() {
    if (!State.image) return;
    const ctx = this.ctx;
    const { width: w, height: h } = this.canvas;
    const bg = State.background;

    ctx.clearRect(0, 0, w, h);

    if (bg.type === 'solid') {
      ctx.fillStyle = bg.color;
      ctx.fillRect(0, 0, w, h);
    } else if (bg.type === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, bg.gradientStart);
      g.addColorStop(1, bg.gradientEnd);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    } else if (bg.type === 'blur') {
      ctx.save();
      ctx.filter = `blur(${Math.max(4, bg.blur)}px)`;
      const scale = Math.max(w / State.image.naturalWidth, h / State.image.naturalHeight) * 1.15;
      const iw = State.image.naturalWidth * scale, ih = State.image.naturalHeight * scale;
      ctx.drawImage(State.image, (w - iw) / 2, (h - ih) / 2, iw, ih);
      ctx.restore();
    }

    // Non-transparent backgrounds shrink the photo (uniform scale, so aspect
    // ratio is preserved) to reveal a border of background around it.
    const scale = bg.type === 'transparent' ? 1 : 1 - clamp(bg.padding, 0, 40) / 100;
    const dw = w * scale, dh = h * scale;
    const dx = (w - dw) / 2, dy = (h - dh) / 2;

    ctx.save();
    ctx.filter = this.buildFilter();
    ctx.translate(dx + dw / 2, dy + dh / 2);
    ctx.rotate(State.transform.rotation * Math.PI / 180);
    ctx.scale(State.transform.flipH ? -1 : 1, State.transform.flipV ? -1 : 1);
    ctx.drawImage(State.image, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();

    this.applyEnhancePixels();
    this.applyEffects();
    this.renderOverlays();
    this.renderGrid();
    this.renderNavigator();
    this.updateStatus();
  }

  /** Alignment grid — drawn on its own canvas so it's a view-only aid, never exported. */
  renderGrid() {
    const ctx = this.gctx, w = this.grid.width, h = this.grid.height;
    ctx.clearRect(0, 0, w, h);
    if (!State.showGrid) return;
    const step = Math.max(20, Math.round(Math.min(w, h) / 20));
    ctx.save();
    ctx.strokeStyle = 'rgba(128,128,128,0.5)';
    ctx.lineWidth = 1;
    for (let x = step; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); ctx.stroke(); }
    for (let y = step; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); ctx.stroke(); }
    ctx.restore();
  }

  /** Real-image pixel pass for the Enhance panel (sharpen/clarity/texture/noise/smooth). No-op if all zero. */
  applyEnhancePixels() {
    const e = State.enhance;
    if (!e || (!e.sharpen && !e.clarity && !e.texture && !e.noise && !e.smooth)) return;
    const { width, height } = this.canvas;
    const imageData = this.ctx.getImageData(0, 0, width, height);
    if (e.texture > 0) unsharpMask(imageData, 1, e.texture / 100 * 0.6);
    if (e.clarity > 0) unsharpMask(imageData, 4, e.clarity / 100 * 0.5);
    if (e.sharpen > 0) unsharpMask(imageData, 1.4, e.sharpen / 100 * 1.1);
    if (e.noise > 0) softenBlend(imageData, 1.5, e.noise / 100 * 0.5);
    if (e.smooth > 0) softenBlend(imageData, 5, e.smooth / 100 * 0.7);
    this.ctx.putImageData(imageData, 0, 0);
  }

  /** Effects panel — real compositing passes, applied live, no separate "Apply" step. */
  applyEffects() {
    const e = State.effects;
    if (!e) return;
    if (e.pixelate > 0) this._pixelate(e.pixelate, false);
    if (e.mosaic > 0) this._pixelate(e.mosaic, true);
    if (e.motion > 0) this._motionBlur(e.motion);
    if (e.glow > 0) this._glow(e.glow);
    if (e.vignette > 0) this._vignette(e.vignette);
    if (e.shadow > 0) this._edgeShadow(e.shadow);
  }

  _snapshotCanvas() {
    const s = document.createElement('canvas');
    s.width = this.canvas.width;
    s.height = this.canvas.height;
    s.getContext('2d').drawImage(this.canvas, 0, 0);
    return s;
  }

  /** Blocky pixelation via downscale+nearest-neighbor upscale. `tiled` adds faint grid lines (Mosaic look). */
  _pixelate(amount, tiled) {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const block = Math.max(2, Math.round((amount / 100) * (tiled ? 60 : 40)) + 2);
    const sw = Math.max(1, Math.round(w / block)), sh = Math.max(1, Math.round(h / block));
    const tmp = document.createElement('canvas');
    tmp.width = sw; tmp.height = sh;
    tmp.getContext('2d').drawImage(this.canvas, 0, 0, sw, sh);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(tmp, 0, 0, sw, sh, 0, 0, w, h);
    ctx.restore();

    if (tiled) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= sw; i++) { const x = Math.round(i * w / sw) + 0.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let i = 0; i <= sh; i++) { const y = Math.round(i * h / sh) + 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.restore();
    }
  }

  /** Cheap directional smear: repeated offset+transparent draws of a snapshot. */
  _motionBlur(amount) {
    const ctx = this.ctx, w = this.canvas.width;
    const snapshot = this._snapshotCanvas();
    const steps = 6;
    const maxOffset = (amount / 100) * Math.max(8, w * 0.03);
    ctx.save();
    ctx.globalAlpha = 0.9 / steps;
    for (let i = 1; i <= steps; i++) {
      const off = (i / steps) * maxOffset;
      ctx.drawImage(snapshot, off, 0);
      ctx.drawImage(snapshot, -off, 0);
    }
    ctx.restore();
  }

  /** Bloom-style glow: blurred, brightened copy of the image added back with 'lighter'. */
  _glow(amount) {
    const ctx = this.ctx;
    const snapshot = this._snapshotCanvas();
    ctx.save();
    ctx.filter = `blur(${(amount / 100) * 16 + 2}px) brightness(1.5) saturate(1.2)`;
    ctx.globalAlpha = (amount / 100) * 0.55;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(snapshot, 0, 0);
    ctx.restore();
  }

  /** Soft radial darkening toward the corners. */
  _vignette(amount) {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const cx = w / 2, cy = h / 2;
    const outer = Math.hypot(cx, cy);
    const grad = ctx.createRadialGradient(cx, cy, outer * 0.4, cx, cy, outer);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, `rgba(0,0,0,${(amount / 100) * 0.85})`);
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /** Linear dark falloff hugging the four edges — a sharper, framed look distinct from Vignette. */
  _edgeShadow(amount) {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const depth = Math.max(w, h) * 0.15 * (amount / 100);
    const alpha = 0.6 * (amount / 100);
    ctx.save();
    let g = ctx.createLinearGradient(0, 0, depth, 0);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, depth, h);
    g = ctx.createLinearGradient(w, 0, w - depth, 0);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(w - depth, 0, depth, h);
    g = ctx.createLinearGradient(0, 0, 0, depth);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, depth);
    g = ctx.createLinearGradient(0, h, 0, h - depth);
    g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, h - depth, w, depth);
    ctx.restore();
  }

  /** Coalesces bursts of slider 'input' events into one render per animation frame. */
  requestRender() {
    if (this._rafPending) return;
    this._rafPending = true;
    requestAnimationFrame(() => { this._rafPending = false; this.render(); });
  }

  renderOverlays() {
    const ctx = this.octx;
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);

    State.overlays.forEach(o => {
      if (o.type === 'path') this.drawPath(ctx, o);
      else if (o.type === 'shape') this.drawShape(ctx, o);
      else if (o.type === 'text') this.drawText(ctx, o);
      else if (o.type === 'image') this.drawImageOverlay(ctx, o);
      else if (o.type === 'watermark') this.drawWatermark(ctx, o);
    });

    this.drawSelectionOutline(ctx);
  }

  drawSelectionOutline(ctx) {
    const o = State.overlays.find(x => x.id === State.selectedOverlayId);
    if (!o) return;
    const b = getOverlayBounds(ctx, o);
    if (!b) return;
    ctx.save();
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    if (o.type === 'text' && o.rotation) {
      ctx.translate(o.x, o.y);
      ctx.rotate(o.rotation * Math.PI / 180);
      ctx.strokeRect(-3, -3, b.w + 6, b.h + 6);
    } else {
      ctx.strokeRect(b.x - 3, b.y - 3, b.w + 6, b.h + 6);
    }
    if (o.type === 'image') {
      // Bottom-right resize handle, sized in screen pixels so it stays
      // grabbable at any zoom level.
      const hs = 10 / State.zoom;
      ctx.setLineDash([]);
      ctx.fillStyle = '#ff6b35';
      ctx.fillRect(b.x + b.w - hs / 2, b.y + b.h - hs / 2, hs, hs);
    }
    ctx.restore();
  }

  /** Pasted/imported image layer — drawn from the decode cache like watermark images. */
  drawImageOverlay(ctx, o) {
    const img = getCachedImage(o.src);
    if (!img) return;
    ctx.save();
    ctx.globalAlpha = (o.opacity ?? 100) / 100;
    ctx.drawImage(img, o.x, o.y, o.w, o.h);
    ctx.restore();
  }

  drawPath(ctx, p) {
    if (!p.points || p.points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = p.opacity / 100;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (p.tool === 'marker') ctx.globalCompositeOperation = 'multiply';
    if (p.tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';

    ctx.beginPath();
    ctx.moveTo(p.points[0].x, p.points[0].y);
    for (let i = 1; i < p.points.length; i++) {
      const pt = p.points[i];
      const prev = p.points[i - 1];
      const mx = (prev.x + pt.x) / 2;
      const my = (prev.y + pt.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    }
    const last = p.points[p.points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
  }

  drawShape(ctx, s) {
    ctx.save();
    ctx.globalAlpha = s.opacity / 100;
    ctx.fillStyle = s.fill;
    ctx.strokeStyle = s.stroke;
    ctx.lineWidth = s.strokeWidth;
    const filled = s.fillEnabled !== false;

    if (s.kind === 'rect') {
      if (filled) ctx.fillRect(s.x, s.y, s.w, s.h);
      if (s.strokeWidth > 0) ctx.strokeRect(s.x, s.y, s.w, s.h);
    } else if (s.kind === 'roundrect') {
      const r = Math.min(20, Math.min(Math.abs(s.w), Math.abs(s.h)) / 4);
      ctx.beginPath();
      ctx.roundRect(s.x, s.y, s.w, s.h, r);
      if (filled) ctx.fill();
      if (s.strokeWidth > 0) ctx.stroke();
    } else if (s.kind === 'circle' || s.kind === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, Math.abs(s.w / 2), Math.abs(s.h / 2), 0, 0, Math.PI * 2);
      if (filled) ctx.fill();
      if (s.strokeWidth > 0) ctx.stroke();
    } else if (s.kind === 'line') {
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.lineWidth = s.strokeWidth || 2;
      ctx.strokeStyle = s.fill;
      ctx.stroke();
    } else if (s.kind === 'arrow') {
      const endX = s.x + s.w, endY = s.y + s.h;
      const headSize = Math.min(20, Math.hypot(s.w, s.h) * 0.3);
      const angle = Math.atan2(s.h, s.w);
      ctx.lineWidth = s.strokeWidth || 2;
      ctx.strokeStyle = s.fill;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headSize * Math.cos(angle - Math.PI / 6), endY - headSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - headSize * Math.cos(angle + Math.PI / 6), endY - headSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      if (filled) { ctx.fillStyle = s.fill; ctx.fill(); }
      else { ctx.strokeStyle = s.fill; ctx.stroke(); }
    } else if (s.kind === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(s.x + s.w / 2, s.y);
      ctx.lineTo(s.x + s.w, s.y + s.h);
      ctx.lineTo(s.x, s.y + s.h);
      ctx.closePath();
      if (filled) ctx.fill();
      if (s.strokeWidth > 0) ctx.stroke();
    } else if (s.kind === 'polygon') {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      const rx = Math.abs(s.w / 2), ry = Math.abs(s.h / 2);
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + i * (2 * Math.PI / 5);
        const px = cx + rx * Math.cos(ang);
        const py = cy + ry * Math.sin(ang);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      if (filled) ctx.fill();
      if (s.strokeWidth > 0) ctx.stroke();
    }
    ctx.restore();
  }

  drawText(ctx, t) {
    ctx.save();
    ctx.globalAlpha = t.opacity / 100;
    ctx.translate(t.x, t.y);
    ctx.rotate(t.rotation * Math.PI / 180);
    ctx.font = `${t.weight || 600} ${t.size}px ${t.font}`;
    ctx.textBaseline = 'top';

    if (t.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }

    if (t.stroke) {
      ctx.strokeStyle = t.strokeColor;
      ctx.lineWidth = Math.max(1, t.size / 16);
      ctx.strokeText(t.text, 0, 0);
    }
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }

  drawWatermark(ctx, w) {
    ctx.save();
    ctx.globalAlpha = w.opacity / 100;
    const cw = this.canvas.width, ch = this.canvas.height;
    const margin = 30;

    if (w.wmType === 'text' && w.text) {
      const fontSize = Math.round(cw * 0.05 * (w.scale / 100));
      ctx.font = `bold ${fontSize}px Manrope`;
      const tw = ctx.measureText(w.text).width, th = fontSize;
      const { x, y } = anchoredXY(w.position, cw, ch, tw, th, margin);

      ctx.translate(x + tw / 2, y + th / 2);
      ctx.rotate(w.rotation * Math.PI / 180);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(w.text, 0, 0);
      ctx.fillText(w.text, 0, 0);
    } else if (w.wmType === 'image' && w.image) {
      const imgEl = getCachedImage(w.image);
      if (imgEl) {
        const tw = cw * 0.25 * (w.scale / 100);
        const th = tw * (imgEl.naturalHeight / imgEl.naturalWidth);
        const { x, y } = anchoredXY(w.position, cw, ch, tw, th, margin);
        ctx.translate(x + tw / 2, y + th / 2);
        ctx.rotate(w.rotation * Math.PI / 180);
        ctx.drawImage(imgEl, -tw / 2, -th / 2, tw, th);
      }
    }
    ctx.restore();
  }

  renderNavigator() {
    if (!State.image) return;
    const nc = this.navCanvas;
    const nctx = this.navCtx;
    nctx.clearRect(0, 0, nc.width, nc.height);
    nctx.fillStyle = '#fff';
    nctx.fillRect(0, 0, nc.width, nc.height);

    const scale = Math.min(nc.width / this.canvas.width, nc.height / this.canvas.height);
    const dw = this.canvas.width * scale;
    const dh = this.canvas.height * scale;
    const dx = (nc.width - dw) / 2;
    const dy = (nc.height - dh) / 2;

    nctx.drawImage(this.canvas, dx, dy, dw, dh);

    const navRect = $('#navRect');
    const stageRect = this.stage.getBoundingClientRect();
    const wrapRect = $('#canvasWrap').getBoundingClientRect();

    const visibleW = wrapRect.width / stageRect.width;
    const visibleH = wrapRect.height / stageRect.height;
    const offsetX = (wrapRect.left - stageRect.left) / stageRect.width;
    const offsetY = (wrapRect.top - stageRect.top) / stageRect.height;

    navRect.style.width = Math.min(100, visibleW * 100) + '%';
    navRect.style.height = Math.min(100, visibleH * 100) + '%';
    navRect.style.left = clamp(offsetX * 100, 0, 100) + '%';
    navRect.style.top = clamp(offsetY * 100, 0, 100) + '%';
  }

  updateStatus() {
    $('#statusZoom').textContent = Math.round(State.zoom * 100) + '%';
    $('#statusSize').textContent = State.image ? `${this.canvas.width}×${this.canvas.height}` : '—';
    $('#statusFile').textContent = State.image ? `${State.imageName}.${State.imageType}` : '—';
  }

  applyZoom() {
    // translate(-50%,-50%) is the base — it keeps the stage's own center
    // pinned to the wrap's center regardless of the stage's size, which is
    // what CSS Grid's place-items:center failed to do for a portrait image
    // much taller than the viewport. Pan/zoom apply on top of that anchor.
    this.stage.style.transform =
      `translate(-50%, -50%) translate(${State.pan.x}px, ${State.pan.y}px) scale(${State.zoom})`;
    $('#zoomValue').textContent = Math.round(State.zoom * 100) + '%';
    this.renderNavigator();
    bus.emit('view:changed');
  }

  zoomBy(factor) {
    if (!State.image) return;
    State.zoom = clamp(State.zoom * factor, 0.05, 16);
    this.applyZoom();
  }

  fitToScreen() {
    if (!State.image) return;
    const wrap = $('#canvasWrap');
    const wrapW = wrap.clientWidth - 80;
    const wrapH = wrap.clientHeight - 80;
    const scale = Math.min(wrapW / this.canvas.width, wrapH / this.canvas.height, 1);
    State.zoom = scale;
    State.pan = { x: 0, y: 0 };
    this.applyZoom();
  }
}

export const Engine = new CanvasEngine();
