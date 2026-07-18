/**
 * Draw panel — brush picker, color, brush settings.
 */
import { State } from '../../core/state.js';
import { slider, swatches } from './shared.js';

const DRAW_TOOLS = [
  { id: 'pencil', name: 'Pencil', svg: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>' },
  { id: 'brush', name: 'Brush', svg: '<path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/>' },
  { id: 'marker', name: 'Marker', svg: '<path d="M15 3l6 6m-6-6l-9 9-3 6 6-3 9-9-3-3z"/>' },
  { id: 'eraser', name: 'Eraser', svg: '<path d="M20 20H7l-4-4a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0l5.66 5.66a2 2 0 0 1 0 2.83L13 20"/>' },
  { id: 'picker', name: 'Picker', svg: '<path d="M2 22l3-1 9-9-2-2-9 9-1 3z"/><path d="M14.5 4.5l5 5"/>' }
];

const DRAW_COLORS = ['#ff6b35', '#ffffff', '#000000', '#4ecdc4', '#ffb547', '#f25c5c', '#5cdb95', '#a855f7', '#ec4899', '#3b82f6', '#fbbf24', '#10b981', '#ef4444', '#6366f1', '#94a3b8', '#f97316'];

export function renderDraw() {
  return `
    <div class="panel-section">
      <div class="section-label">Tool</div>
      <div class="tool-tabs">
        ${DRAW_TOOLS.map(t => `<button class="tool-tab ${State.drawTool === t.id ? 'active' : ''}" data-draw-tool="${t.id}" title="${t.name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${t.svg}</svg></button>`).join('')}
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">Color</div>
      <div class="input-row">
        <input type="color" id="drawColor" value="${State.drawColor}">
        <input type="text" id="drawColorHex" value="${State.drawColor}" style="width:80px;">
      </div>
      <div class="color-swatches">
        ${swatches(DRAW_COLORS, State.drawColor, 'data-draw-color')}
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">Brush Settings</div>
      ${slider('Size', 1, 80, State.drawSize, 'px', 'data-prop="drawSize"')}
      ${slider('Opacity', 1, 100, State.drawOpacity, '%', 'data-prop="drawOpacity"')}
      ${slider('Hardness', 0, 100, State.drawHardness, '%', 'data-prop="drawHardness"')}
    </div>
    <div class="panel-section">
      <button class="btn full" data-action="clear-draw">Clear All Strokes</button>
    </div>
  `;
}
