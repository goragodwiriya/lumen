/**
 * Watermark panel — text/image watermark, position grid, settings.
 */
import { State } from '../../core/state.js';
import { slider } from './shared.js';

const POSITIONS = [
  { id: 'tl', name: '↖' }, { id: 'tc', name: '↑' }, { id: 'tr', name: '↗' },
  { id: 'ml', name: '←' }, { id: 'mc', name: '·' }, { id: 'mr', name: '→' },
  { id: 'bl', name: '↙' }, { id: 'bc', name: '↓' }, { id: 'br', name: '↘' }
];

export function renderWatermark() {
  const hasWatermark = State.overlays.some(o => o.type === 'watermark');
  return `
    <div class="panel-section">
      <div class="section-label">Type</div>
      <div class="btn-row">
        <button class="btn ${State.watermark.type === 'text' ? 'primary' : ''}" data-wm-type="text">Text</button>
        <button class="btn ${State.watermark.type === 'image' ? 'primary' : ''}" data-wm-type="image">Image</button>
      </div>
    </div>
    ${State.watermark.type === 'text' ? `
    <div class="panel-section">
      <div class="section-label">Content</div>
      <div class="input-row">
        <input type="text" id="wmText" value="${State.watermark.text}" style="width:100%;flex:1;">
      </div>
    </div>` : `
    <div class="panel-section">
      <div class="section-label">Image</div>
      ${State.watermark.image ? `<img src="${State.watermark.image}" style="max-width:100%;border-radius:6px;margin-bottom:8px;display:block;">` : ''}
      <button class="btn full" data-action="wm-upload">${State.watermark.image ? 'Change Image' : 'Upload Image'}</button>
    </div>`}
    <div class="panel-section">
      <div class="section-label">Position</div>
      <div class="aspect-grid" style="grid-template-columns:repeat(3,1fr);">
        ${POSITIONS.map(p => `<button class="aspect-btn ${State.watermark.position === p.id ? 'active' : ''}" data-wm-pos="${p.id}" style="font-size:16px;">${p.name}</button>`).join('')}
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">Settings</div>
      ${slider('Opacity', 5, 100, State.watermark.opacity, '%', 'data-wm-prop="opacity"')}
      ${slider('Scale', 10, 200, State.watermark.scale, '%', 'data-wm-prop="scale"')}
      ${slider('Rotation', -180, 180, State.watermark.rotation, '°', 'data-wm-prop="rotation"')}
    </div>
    <div class="panel-section">
      <button class="btn primary full" data-action="wm-apply">${hasWatermark ? 'Update Watermark' : 'Add Watermark'}</button>
      ${hasWatermark ? '<button class="btn full" data-action="wm-remove" style="margin-top:6px;">Remove Watermark</button>' : ''}
    </div>
  `;
}
