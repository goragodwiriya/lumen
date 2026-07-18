/**
 * Adjust panel — light / color / output sliders.
 */
import { State } from '../../core/state.js';
import { slider } from './shared.js';

export function renderAdjust() {
  const a = State.adjustments;
  const adj = (label, prop, min, max, value, unit = '') =>
    slider(label, min, max, value, unit, `data-prop="${prop}" data-group="adjustments"`);
  return `
    <div class="panel-section">
      <div class="section-label">
        <span>Quick</span>
        <button class="reset-link" data-action="auto-adjust">Auto Adjust</button>
      </div>
      <div class="btn-row">
        <button class="btn" data-action="auto-adjust">Auto</button>
        <button class="btn" data-action="reset-adjust">Reset</button>
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">Light</div>
      ${adj('Brightness', 'brightness', 0, 200, a.brightness, '%')}
      ${adj('Contrast', 'contrast', 0, 200, a.contrast, '%')}
      ${adj('Exposure', 'exposure', -100, 100, a.exposure)}
      ${adj('Gamma', 'gamma', 20, 200, a.gamma, '%')}
      ${adj('Shadows', 'shadows', -100, 100, a.shadows)}
      ${adj('Highlights', 'highlights', -100, 100, a.highlights)}
      ${adj('Whites', 'whites', -100, 100, a.whites)}
      ${adj('Blacks', 'blacks', -100, 100, a.blacks)}
    </div>
    <div class="panel-section">
      <div class="section-label">Color</div>
      ${adj('Saturation', 'saturation', 0, 200, a.saturation, '%')}
      ${adj('Vibrance', 'vibrance', -100, 100, a.vibrance)}
      ${adj('Hue', 'hue', -180, 180, a.hue, '°')}
      ${adj('Temperature', 'temperature', -100, 100, a.temperature)}
      ${adj('Tint', 'tint', -100, 100, a.tint)}
    </div>
    <div class="panel-section">
      <div class="section-label">Output</div>
      ${adj('Opacity', 'opacity', 0, 100, a.opacity, '%')}
      ${adj('Blur', 'blur', 0, 20, a.blur, 'px')}
    </div>
  `;
}
