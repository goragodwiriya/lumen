/**
 * Geometry helpers for hit-testing, bounding, and moving overlay objects
 * (text / shape / path). Shared by the canvas engine (selection outline)
 * and canvas interactions (drag-to-move).
 */
import { State } from './state.js';

function textBounds(ctx, o) {
  ctx.save();
  ctx.font = `${o.weight || 600} ${o.size}px ${o.font}`;
  const w = ctx.measureText(o.text).width;
  ctx.restore();
  return { x: o.x, y: o.y, w, h: o.size * 1.2 };
}

function shapeBounds(o) {
  return {
    x: Math.min(o.x, o.x + o.w),
    y: Math.min(o.y, o.y + o.h),
    w: Math.abs(o.w),
    h: Math.abs(o.h)
  };
}

function pathBounds(o) {
  const xs = o.points.map(p => p.x), ys = o.points.map(p => p.y);
  const pad = (o.size || 1) / 2;
  const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Axis-aligned bounds in the overlay's own (unrotated) local space. */
export function getOverlayBounds(ctx, o) {
  if (o.type === 'text') return textBounds(ctx, o);
  if (o.type === 'shape' || o.type === 'image') return shapeBounds(o);
  if (o.type === 'path') return pathBounds(o);
  return null;
}

/** Rotate a point by -angleDeg around (cx, cy) — undoes the overlay's own rotation. */
function unrotate(px, py, cx, cy, angleDeg) {
  if (!angleDeg) return { x: px, y: py };
  const rad = -angleDeg * Math.PI / 180;
  const dx = px - cx, dy = py - cy;
  return {
    x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: cy + dx * Math.sin(rad) + dy * Math.cos(rad)
  };
}

export function hitTestOverlay(ctx, o, px, py) {
  const b = getOverlayBounds(ctx, o);
  if (!b) return false;
  if (o.type === 'text' && o.rotation) {
    const p = unrotate(px, py, o.x, o.y, o.rotation);
    return p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
  }
  return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
}

/** Topmost draggable overlay under (px, py), or null. Watermarks are positioned via the panel, not draggable. */
export function findOverlayAt(ctx, px, py) {
  for (let i = State.overlays.length - 1; i >= 0; i--) {
    const o = State.overlays[i];
    if (o.type === 'watermark') continue;
    if (hitTestOverlay(ctx, o, px, py)) return o;
  }
  return null;
}

export function moveOverlayBy(o, dx, dy) {
  if (o.type === 'path') {
    o.points.forEach(p => { p.x += dx; p.y += dy; });
  } else {
    o.x += dx;
    o.y += dy;
  }
}
