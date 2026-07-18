/**
 * Info panel — image metadata summary, EXIF and metadata options.
 */
import { formatBytes } from '../../lib/utils.js';
import { State } from '../../core/state.js';

export function renderInfo() {
  return `
    <div class="panel-section">
      <div class="section-label">Image Info</div>
      <div class="info-card">
        <div class="info-item"><span class="info-label">Name</span><span class="info-value">${State.imageName}</span></div>
        <div class="info-item"><span class="info-label">Format</span><span class="info-value">${State.imageType.toUpperCase()}</span></div>
        <div class="info-item"><span class="info-label">Width</span><span class="info-value">${State.originalWidth || '—'} px</span></div>
        <div class="info-item"><span class="info-label">Height</span><span class="info-value">${State.originalHeight || '—'} px</span></div>
        <div class="info-item"><span class="info-label">File size</span><span class="info-value">${formatBytes(State.imageSize)}</span></div>
        <div class="info-item"><span class="info-label">Megapixels</span><span class="info-value">${State.originalWidth ? ((State.originalWidth * State.originalHeight) / 1000000).toFixed(1) + ' MP' : '—'}</span></div>
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">EXIF</div>
      <p style="font-size:11.5px;color:var(--text-muted);">EXIF metadata extraction is available for JPEG/TIFF files. Most browser-loaded images retain EXIF.</p>
      <button class="btn full" data-action="view-exif" style="margin-top:8px;">View EXIF Data</button>
    </div>
    <div class="panel-section">
      <div class="section-label">Metadata</div>
      <button class="btn full" data-action="strip-metadata">Strip Metadata on Export</button>
      <div class="switch-row" style="margin-top:8px;">
        <span>Always strip on export</span>
        <label class="switch"><input type="checkbox" checked><span class="switch-slider"></span></label>
      </div>
    </div>
  `;
}
