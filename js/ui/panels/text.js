/**
 * Text panel — content, font, appearance settings.
 */
import { State } from '../../core/state.js';
import { slider, swatches, SWATCH_COLORS } from './shared.js';
import { GOOGLE_FONTS, SYSTEM_FONTS } from '../../config/google-fonts.js';

export function renderText() {
  return `
    <div class="panel-section">
      <div class="section-label">Content</div>
      <div class="input-row">
        <input type="text" id="textContent" value="${State.textContent}" placeholder="Enter text..." style="width:100%;flex:1;">
      </div>
      <button class="btn primary full" data-action="add-text" style="margin-top:6px;">Click on image to place</button>
    </div>
    <div class="panel-section">
      <div class="section-label">Font</div>
      <div class="input-row">
        <label>Family</label>
        <select id="textFont">
          <optgroup label="Google Fonts">
            ${GOOGLE_FONTS.map(f => `<option value="${f}" ${State.textFont === f ? 'selected' : ''}>${f}</option>`).join('')}
          </optgroup>
          <optgroup label="System Fonts">
            ${SYSTEM_FONTS.map(f => `<option value="${f}" ${State.textFont === f ? 'selected' : ''}>${f}</option>`).join('')}
          </optgroup>
        </select>
      </div>
      ${slider('Size', 8, 200, State.textSize, 'px', 'data-prop="textSize"')}
    </div>
    <div class="panel-section">
      <div class="section-label">Appearance</div>
      <div class="input-row">
        <label>Color</label>
        <input type="color" id="textColor" value="${State.textColor}">
        <input type="text" id="textColorHex" value="${State.textColor}" style="width:80px;">
      </div>
      <div class="color-swatches">
        ${swatches(SWATCH_COLORS, State.textColor, 'data-text-color')}
      </div>
      <div class="switch-row" style="margin-top:10px;">
        <span>Stroke</span>
        <label class="switch"><input type="checkbox" id="textStroke" ${State.textStroke ? 'checked' : ''}><span class="switch-slider"></span></label>
      </div>
      <div class="input-row" id="textStrokeColorRow" style="${State.textStroke ? '' : 'display:none;'}">
        <label>Stroke</label>
        <input type="color" id="textStrokeColor" value="${State.textStrokeColor}">
      </div>
      <div class="switch-row">
        <span>Shadow</span>
        <label class="switch"><input type="checkbox" id="textShadow" ${State.textShadow ? 'checked' : ''}><span class="switch-slider"></span></label>
      </div>
      <div style="margin-top:8px;">
        ${slider('Opacity', 0, 100, State.textOpacity, '%', 'data-prop="textOpacity"')}
      </div>
      ${slider('Rotation', -180, 180, State.textRotation, '°', 'data-prop="textRotation"')}
    </div>
  `;
}
