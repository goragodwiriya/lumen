/**
 * Crop panel — aspect presets, rotate/flip, resize.
 */
import { State } from '../../core/state.js';
import { Engine } from '../../core/engine.js';

const ASPECTS = [
  { id: 'free', label: 'Free' },
  { id: '1:1', label: '1:1' },
  { id: '3:4', label: '3:4' },
  { id: '4:3', label: '4:3' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
  { id: '2:3', label: '2:3' },
  { id: 'a4', label: 'A4' }
];

export function renderCrop() {
  return `
    <div class="panel-section">
      <div class="section-label">Aspect Ratio</div>
      <div class="aspect-grid">
        ${ASPECTS.map(a => `<button class="aspect-btn ${State.cropAspect === a.id ? 'active' : ''}" data-aspect="${a.id}">${a.label}</button>`).join('')}
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">Transform</div>
      <div class="btn-row" style="margin-bottom:8px;">
        <button class="btn" data-action="rotate-left"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>-90°</button>
        <button class="btn" data-action="rotate-right"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:scaleX(-1)"><path d="M3 2v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>+90°</button>
      </div>
      <div class="btn-row" style="margin-bottom:8px;">
        <button class="btn" data-action="flip-h">Flip H</button>
        <button class="btn" data-action="flip-v">Flip V</button>
      </div>
      <div class="slider-row">
        <div class="slider-head"><label>Free Rotate</label><span class="slider-value">${State.transform.rotation}°</span></div>
        <input type="range" min="-180" max="180" value="${State.transform.rotation}" data-prop="rotation" data-group="transform">
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">Resize</div>
      <div class="input-row">
        <label>Width</label>
        <input type="number" id="resizeW" value="${State.image ? Engine.canvas.width : 0}" min="1">
      </div>
      <div class="input-row">
        <label>Height</label>
        <input type="number" id="resizeH" value="${State.image ? Engine.canvas.height : 0}" min="1">
      </div>
      <div class="switch-row">
        <span>Maintain aspect ratio</span>
        <label class="switch"><input type="checkbox" id="resizeAspect" checked><span class="switch-slider"></span></label>
      </div>
      <button class="btn primary full" data-action="resize-apply" style="margin-top:8px;">Apply Resize</button>
    </div>
    <div class="panel-section">
      <div class="section-label">Crop Actions</div>
      <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:8px;">Drag the box on the image, or grab a corner/edge to resize.</p>
      <div class="btn-row" style="margin-bottom:6px;">
        <button class="btn primary" data-action="crop-apply">Apply Crop</button>
        <button class="btn" data-action="crop-cancel">Cancel</button>
      </div>
      <button class="btn full" data-action="copy-image" style="margin-bottom:8px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy Selection to Clipboard</button>
      <button class="btn full" data-action="crop-reset">Reset Rotation/Flip</button>
    </div>
  `;
}
