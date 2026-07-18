/**
 * Effects panel — real compositing passes (pixelate, motion blur, glow,
 * vignette, edge shadow). Live, no separate "Apply" step, same
 * convention as Adjust/Enhance. Gaussian Blur reuses the Adjust panel's
 * blur value directly so there's a single source of truth.
 */
import { State } from '../../core/state.js';
import { slider } from './shared.js';

export function renderEffects() {
  const e = State.effects;
  const fx = (label, prop, value) => slider(label, 0, 100, value, '%', `data-prop="${prop}" data-group="effects"`);
  return `
    <div class="panel-section">
      <div class="section-label">Blur & Pixelation</div>
      ${slider('Gaussian Blur', 0, 30, State.adjustments.blur, 'px', 'data-prop="blur" data-group="adjustments"')}
      ${fx('Motion Blur', 'motion', e.motion)}
      ${fx('Pixelate', 'pixelate', e.pixelate)}
      ${fx('Mosaic', 'mosaic', e.mosaic)}
    </div>
    <div class="panel-section">
      <div class="section-label">Light Effects</div>
      ${fx('Vignette', 'vignette', e.vignette)}
      ${fx('Glow', 'glow', e.glow)}
      ${fx('Shadow', 'shadow', e.shadow)}
    </div>
    <div class="panel-section">
      <button class="btn full" data-action="reset-effects">Reset Effects</button>
    </div>
  `;
}
