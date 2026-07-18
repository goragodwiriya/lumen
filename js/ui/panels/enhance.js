/**
 * Enhance panel — real, live pixel-level detail adjustments
 * (unsharp-mask sharpen/clarity/texture, blur-blend noise/smooth,
 * cheap filter-based dehaze). No separate "Apply" step — same
 * live-slider convention as the Adjust panel.
 */
import { State } from '../../core/state.js';
import { slider } from './shared.js';

export function renderEnhance() {
  const e = State.enhance;
  const enh = (label, prop, value) => slider(label, 0, 100, value, '%', `data-prop="${prop}" data-group="enhance"`);
  return `
    <div class="panel-section">
      <div class="section-label">Detail Enhancement</div>
      <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:12px;">Changes apply live as you drag, just like Adjust.</p>
      ${enh('Sharpen', 'sharpen', e.sharpen)}
      ${enh('Clarity', 'clarity', e.clarity)}
      ${enh('Texture', 'texture', e.texture)}
    </div>
    <div class="panel-section">
      <div class="section-label">Noise & Smooth</div>
      ${enh('Noise Reduction', 'noise', e.noise)}
      ${enh('Smooth Skin', 'smooth', e.smooth)}
      ${enh('Dehaze', 'dehaze', e.dehaze)}
    </div>
    <div class="panel-section">
      <button class="btn full" data-action="reset-enhance">Reset Enhancements</button>
    </div>
  `;
}
