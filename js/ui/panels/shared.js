/**
 * Markup snippets shared by several panels.
 */

/** A labeled range slider. `attrs` is the raw attribute string for the input. */
export const slider = (label, min, max, value, unit = '', attrs = '') => `
  <div class="slider-row">
    <div class="slider-head"><label>${label}</label><span class="slider-value">${value}${unit}</span></div>
    <input type="range" min="${min}" max="${max}" value="${value}" ${attrs}>
  </div>
`;

/** A grid of clickable color swatches. `dataAttr` e.g. 'data-draw-color'. */
export const swatches = (colors, activeColor, dataAttr) =>
  colors.map(c => `<div class="swatch ${activeColor === c ? 'active' : ''}" style="background:${c}" ${dataAttr}="${c}"></div>`).join('');

export const SWATCH_COLORS = ['#ff6b35', '#ffffff', '#000000', '#4ecdc4', '#ffb547', '#f25c5c', '#5cdb95', '#a855f7'];
