/**
 * Shapes panel — shape picker, fill/stroke, opacity.
 */
import { State } from '../../core/state.js';
import { slider, swatches, SWATCH_COLORS } from './shared.js';

const SHAPES = [
  { id: 'rect', name: 'Rectangle', svg: '<rect x="3" y="3" width="18" height="18" rx="1"/>' },
  { id: 'roundrect', name: 'Rounded', svg: '<rect x="3" y="3" width="18" height="18" rx="5"/>' },
  { id: 'circle', name: 'Circle', svg: '<circle cx="12" cy="12" r="10"/>' },
  { id: 'ellipse', name: 'Ellipse', svg: '<ellipse cx="12" cy="12" rx="10" ry="6"/>' },
  { id: 'line', name: 'Line', svg: '<line x1="3" y1="21" x2="21" y2="3"/>' },
  { id: 'arrow', name: 'Arrow', svg: '<line x1="3" y1="21" x2="21" y2="3"/><polyline points="14 3 21 3 21 10"/>' },
  { id: 'triangle', name: 'Triangle', svg: '<polygon points="12 3 22 21 2 21"/>' },
  { id: 'polygon', name: 'Polygon', svg: '<polygon points="12 2 22 8 18 20 6 20 2 8"/>' }
];

export function renderShapes() {
  return `
    <div class="panel-section">
      <div class="section-label">Shape</div>
      <div class="shape-grid">
        ${SHAPES.map(s => `<button class="shape-btn ${State.shapeKind === s.id ? 'active' : ''}" data-shape="${s.id}" title="${s.name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s.svg}</svg></button>`).join('')}
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">Fill</div>
      <div class="switch-row" style="margin-bottom:10px;">
        <span>Fill shape</span>
        <label class="switch"><input type="checkbox" id="shapeFillEnabled" ${State.shapeFillEnabled ? 'checked' : ''}><span class="switch-slider"></span></label>
      </div>
      <div class="input-row" style="${State.shapeFillEnabled ? '' : 'opacity:.4;pointer-events:none;'}">
        <input type="color" id="shapeFill" value="${State.shapeFill}">
        <input type="text" id="shapeFillHex" value="${State.shapeFill}" style="width:80px;">
      </div>
      <div class="color-swatches" style="${State.shapeFillEnabled ? '' : 'opacity:.4;pointer-events:none;'}">
        ${swatches(SWATCH_COLORS, State.shapeFill, 'data-shape-fill')}
      </div>
      ${State.shapeFillEnabled ? '' : '<p style="font-size:11.5px;color:var(--text-muted);margin-top:8px;">Outline-only — make sure Stroke width below is above 0.</p>'}
    </div>
    <div class="panel-section">
      <div class="section-label">Stroke</div>
      <div class="input-row">
        <label>Color</label>
        <input type="color" id="shapeStroke" value="${State.shapeStroke}">
      </div>
      ${slider('Width', 0, 20, State.shapeStrokeWidth, 'px', 'data-prop="shapeStrokeWidth"')}
    </div>
    <div class="panel-section">
      ${slider('Opacity', 0, 100, State.shapeOpacity, '%', 'data-prop="shapeOpacity"')}
      <p style="font-size:11.5px;color:var(--text-muted);margin-top:8px;">Click and drag on the image to draw the selected shape.</p>
    </div>
  `;
}
