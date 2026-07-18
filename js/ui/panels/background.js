/**
 * Background panel — transparent / solid / gradient / blur backgrounds.
 */
import { State } from '../../core/state.js';
import { slider, swatches } from './shared.js';

const BG_COLORS = ['#ffffff', '#000000', '#ff6b35', '#4ecdc4', '#f25c5c', '#5cdb95', '#a855f7', '#fbbf24'];

const GRADIENTS = [
  ['#ff6b35', '#4ecdc4'], ['#a855f7', '#ec4899'], ['#fbbf24', '#ef4444'],
  ['#10b981', '#3b82f6'], ['#000000', '#ff6b35'], ['#4ecdc4', '#5cdb95'],
  ['#f97316', '#a855f7'], ['#ffffff', '#000000']
];

export function renderBackground() {
  return `
    <div class="panel-section">
      <div class="section-label">Type</div>
      <div class="btn-row" style="margin-bottom:8px;">
        <button class="btn ${State.background.type === 'transparent' ? 'primary' : ''}" data-bg-type="transparent">Transparent</button>
        <button class="btn ${State.background.type === 'solid' ? 'primary' : ''}" data-bg-type="solid">Solid</button>
      </div>
      <div class="btn-row">
        <button class="btn ${State.background.type === 'gradient' ? 'primary' : ''}" data-bg-type="gradient">Gradient</button>
        <button class="btn ${State.background.type === 'blur' ? 'primary' : ''}" data-bg-type="blur">Blur BG</button>
      </div>
    </div>
    ${State.background.type !== 'transparent' ? `
    <div class="panel-section">
      ${slider('Padding', 0, 40, State.background.padding, '%', 'data-bg-prop="padding"')}
      <p style="font-size:11.5px;color:var(--text-muted);margin-top:6px;">Shrinks the photo so the background shows around it.</p>
    </div>` : ''}
    ${State.background.type === 'solid' ? `
    <div class="panel-section">
      <div class="section-label">Color</div>
      <div class="input-row">
        <input type="color" id="bgColor" value="${State.background.color}">
        <input type="text" id="bgColorHex" value="${State.background.color}" style="width:80px;">
      </div>
      <div class="color-swatches">
        ${swatches(BG_COLORS, State.background.color, 'data-bg-color')}
      </div>
    </div>` : ''}
    ${State.background.type === 'gradient' ? `
    <div class="panel-section">
      <div class="section-label">Gradient Stops</div>
      <div class="input-row">
        <label>Start</label>
        <input type="color" id="bgGradStart" value="${State.background.gradientStart}">
      </div>
      <div class="input-row">
        <label>End</label>
        <input type="color" id="bgGradEnd" value="${State.background.gradientEnd}">
      </div>
      <div class="color-swatches" style="grid-template-columns:repeat(4,1fr);">
        ${GRADIENTS.map(([s, e]) => `<div class="swatch" style="background:linear-gradient(135deg,${s},${e})" data-bg-gradient="${s}|${e}"></div>`).join('')}
      </div>
    </div>` : ''}
    ${State.background.type === 'blur' ? `
    <div class="panel-section">
      <div class="section-label">Blur Background</div>
      <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:10px;">Blurs a copy of the image as background, useful for letterboxing.</p>
      ${slider('Blur', 0, 50, State.background.blur, 'px', 'data-bg-prop="blur"')}
    </div>` : ''}
    <div class="panel-section">
      <button class="btn primary full" data-action="bg-apply">Apply Background</button>
    </div>
  `;
}
