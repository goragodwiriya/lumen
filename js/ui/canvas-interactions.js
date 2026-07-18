/**
 * Mouse & touch interaction on the canvas stage:
 * pan, wheel zoom, pinch zoom, freehand drawing, shape dragging,
 * text placement, and overlay selection/drag (Select tool).
 * Crop is handled separately by crop-box.js (a DOM overlay).
 */
import { $ } from '../lib/dom.js';
import { clamp, uid } from '../lib/utils.js';
import { State } from '../core/state.js';
import { Engine } from '../core/engine.js';
import { History } from '../core/history.js';
import { findOverlayAt, moveOverlayBy } from '../core/overlay-geometry.js';
import { selectOverlay } from '../core/overlays.js';

/** Convert a client-space point to image-space coordinates. */
function stagePoint(stage, clientX, clientY) {
  const rect = stage.getBoundingClientRect();
  return {
    x: (clientX - rect.left) / State.zoom,
    y: (clientY - rect.top) / State.zoom
  };
}

function beginPath(x, y) {
  State.isDrawing = true;
  State.currentPath = {
    id: uid(),
    type: 'path',
    tool: State.drawTool,
    color: State.drawColor,
    size: State.drawSize,
    opacity: State.drawOpacity,
    points: [{ x, y }]
  };
  State.overlays.push(State.currentPath);
  Engine.renderOverlays();
}

function extendPath(x, y) {
  State.currentPath.points.push({ x, y });
  Engine.renderOverlays();
}

function endPath() {
  State.isDrawing = false;
  if (State.currentPath && State.currentPath.points.length > 1) {
    History.push('Draw');
  } else if (State.currentPath) {
    State.overlays = State.overlays.filter(o => o !== State.currentPath);
    Engine.renderOverlays();
  }
  State.currentPath = null;
}

function beginShape(x, y) {
  State.isShapeDragging = true;
  State._shapeStart = { x, y };
  const s = {
    id: uid(),
    type: 'shape',
    kind: State.shapeKind,
    x, y, w: 0, h: 0,
    fill: State.shapeFill,
    fillEnabled: State.shapeFillEnabled,
    stroke: State.shapeStroke,
    strokeWidth: State.shapeStrokeWidth,
    opacity: State.shapeOpacity
  };
  State.overlays.push(s);
  State._currentShape = s;
}

function resizeShape(x, y) {
  State._currentShape.w = x - State._shapeStart.x;
  State._currentShape.h = y - State._shapeStart.y;
  Engine.renderOverlays();
}

function endShape() {
  State.isShapeDragging = false;
  const s = State._currentShape;
  if (s && (Math.abs(s.w) < 3 || Math.abs(s.h) < 3)) {
    State.overlays = State.overlays.filter(o => o !== s);
    Engine.renderOverlays();
  } else if (s) {
    History.push('Add shape');
    selectOverlay(s.id);
  }
  State._currentShape = null;
}

/** True when (x, y) is on the selected image layer's bottom-right resize handle. */
function imageHandleHit(o, x, y) {
  const r = 10 / State.zoom;
  return Math.abs(x - (o.x + o.w)) <= r && Math.abs(y - (o.y + o.h)) <= r;
}

function placeText(x, y) {
  const o = {
    id: uid(),
    type: 'text',
    x, y,
    text: State.textContent,
    font: State.textFont,
    size: State.textSize,
    color: State.textColor,
    stroke: State.textStroke,
    strokeColor: State.textStrokeColor,
    shadow: State.textShadow,
    opacity: State.textOpacity,
    rotation: State.textRotation,
    weight: 600
  };
  State.overlays.push(o);
  History.push('Add text');
  selectOverlay(o.id);
}

export function initCanvasInteractions() {
  const stage = $('#canvasStage');
  let panStart = null;
  let draggingOverlay = null, dragLast = null, dragMoved = false;
  let resizingOverlay = null, resizeRatio = 1;

  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    Engine.zoomBy(e.deltaY > 0 ? 0.9 : 1.1);
  }, { passive: false });

  stage.addEventListener('mousedown', (e) => {
    if (!State.image) return;
    const { x, y } = stagePoint(stage, e.clientX, e.clientY);

    if (e.button === 1 || e.altKey || (State.tool === 'select' && e.shiftKey)) {
      State.isPanning = true;
      panStart = { x: e.clientX - State.pan.x, y: e.clientY - State.pan.y };
      stage.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }

    if (State.tool === 'select') {
      // Resize handle beats overlay hit-testing so the corner of an image
      // layer resizes it instead of starting a move.
      const sel = State.overlays.find(o => o.id === State.selectedOverlayId);
      if (sel?.type === 'image' && imageHandleHit(sel, x, y)) {
        resizingOverlay = sel;
        resizeRatio = sel.h / sel.w;
        return;
      }
      const hit = findOverlayAt(Engine.octx, x, y);
      if (hit) {
        selectOverlay(hit.id);
        draggingOverlay = hit;
        dragLast = { x, y };
        dragMoved = false;
      } else {
        // Nothing to move — a plain drag pans the view instead. Previously
        // panning required holding Shift/Alt, which wasn't discoverable,
        // so a portrait image that didn't fit the viewport was unreachable.
        if (State.selectedOverlayId) selectOverlay(null);
        State.isPanning = true;
        panStart = { x: e.clientX - State.pan.x, y: e.clientY - State.pan.y };
        stage.style.cursor = 'grabbing';
      }
      return;
    }

    if (State.tool === 'draw') beginPath(x, y);
    else if (State.tool === 'text') placeText(x, y);
    else if (State.tool === 'shapes') beginShape(x, y);
  });

  stage.addEventListener('mousemove', (e) => {
    const { x, y } = stagePoint(stage, e.clientX, e.clientY);

    if (State.image) {
      $('#statusPos').textContent = `${Math.round(x)}, ${Math.round(y)}`;
    }

    if (State.isPanning && panStart) {
      State.pan.x = e.clientX - panStart.x;
      State.pan.y = e.clientY - panStart.y;
      Engine.applyZoom();
    } else if (resizingOverlay) {
      // Proportional resize from the top-left anchor.
      const w = Math.max(8, x - resizingOverlay.x);
      resizingOverlay.w = w;
      resizingOverlay.h = Math.max(1, w * resizeRatio);
      Engine.renderOverlays();
    } else if (draggingOverlay) {
      moveOverlayBy(draggingOverlay, x - dragLast.x, y - dragLast.y);
      dragLast = { x, y };
      dragMoved = true;
      Engine.renderOverlays();
    } else if (State.isDrawing && State.currentPath) {
      extendPath(x, y);
    } else if (State.isShapeDragging && State._currentShape) {
      resizeShape(x, y);
    }
  });

  const endInteraction = () => {
    if (State.isDrawing) endPath();
    if (State.isShapeDragging) endShape();
    if (draggingOverlay) {
      if (dragMoved) History.push('Move layer');
      draggingOverlay = null;
    }
    if (resizingOverlay) {
      History.push('Resize layer');
      resizingOverlay = null;
    }
    if (State.isPanning) {
      State.isPanning = false;
      panStart = null;
      stage.style.cursor = '';
    }
  };
  stage.addEventListener('mouseup', endInteraction);
  stage.addEventListener('mouseleave', endInteraction);

  initTouch(stage);
}

function initTouch(stage) {
  let touchState = null;

  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      const { x, y } = stagePoint(stage, t.clientX, t.clientY);

      if (State.tool === 'draw') {
        beginPath(x, y);
        e.preventDefault();
      } else if (State.tool === 'shapes') {
        beginShape(x, y);
        e.preventDefault();
      } else {
        touchState = { mode: 'pan', startX: t.clientX - State.pan.x, startY: t.clientY - State.pan.y };
      }
    } else if (e.touches.length === 2) {
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchState = { mode: 'pinch', startDist: dist, startZoom: State.zoom };
      e.preventDefault();
    }
  }, { passive: false });

  stage.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && touchState?.mode === 'pan') {
      const t = e.touches[0];
      State.pan.x = t.clientX - touchState.startX;
      State.pan.y = t.clientY - touchState.startY;
      Engine.applyZoom();
      e.preventDefault();
    } else if (e.touches.length === 1 && State.isDrawing) {
      const t = e.touches[0];
      const { x, y } = stagePoint(stage, t.clientX, t.clientY);
      extendPath(x, y);
      e.preventDefault();
    } else if (e.touches.length === 1 && State.isShapeDragging && State._currentShape) {
      const t = e.touches[0];
      const { x, y } = stagePoint(stage, t.clientX, t.clientY);
      resizeShape(x, y);
      e.preventDefault();
    } else if (e.touches.length === 2 && touchState?.mode === 'pinch') {
      const [t1, t2] = e.touches;
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      State.zoom = clamp(touchState.startZoom * (dist / touchState.startDist), 0.05, 16);
      Engine.applyZoom();
      e.preventDefault();
    }
  }, { passive: false });

  stage.addEventListener('touchend', (e) => {
    if (State.isDrawing) endPath();
    if (State.isShapeDragging) endShape();
    if (e.touches.length === 0) touchState = null;
  });
}
