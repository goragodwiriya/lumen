/**
 * Filters panel — preset cards with live previews + intensity slider.
 */
import { State } from '../../core/state.js';
import { FILTER_PRESETS } from '../../config/filters.js';
import { slider } from './shared.js';

export function renderFilters() {
  return `
    <div class="panel-section">
      <div class="section-label">
        <span>Presets</span>
        <button class="reset-link" data-action="reset-filter">Reset</button>
      </div>
      <div class="filter-grid" id="filterGrid">
        ${Object.entries(FILTER_PRESETS).map(([id, f]) => `
          <div class="filter-card ${State.filter === id ? 'active' : ''}" data-filter="${id}">
            <canvas data-filter-preview="${id}" width="80" height="80"></canvas>
            <div class="filter-name">${f.name}</div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="panel-section">
      ${slider('Intensity', 0, 100, State.filterIntensity, '%', 'data-prop="filterIntensity"')}
    </div>
  `;
}

/** Draw a square center-crop preview of the image with the preset applied. */
export function drawFilterPreview(canvas, filterId) {
  const ctx = canvas.getContext('2d');
  if (!State.image) {
    ctx.fillStyle = '#444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const preset = FILTER_PRESETS[filterId];
  ctx.filter = preset.filter || 'none';
  const size = Math.min(State.image.naturalWidth, State.image.naturalHeight);
  ctx.drawImage(State.image,
    (State.image.naturalWidth - size) / 2, (State.image.naturalHeight - size) / 2, size, size,
    0, 0, canvas.width, canvas.height);
}
