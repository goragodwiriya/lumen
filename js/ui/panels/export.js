/**
 * Export panel — format, filename, scale/quality, size preview, batch.
 */
import { formatBytes } from '../../lib/utils.js';
import { State } from '../../core/state.js';
import { Engine } from '../../core/engine.js';
import { Exporter } from '../../core/exporter.js';
import { gridForCount } from '../../core/slicer.js';
import { slider } from './shared.js';

export function renderExport() {
  const hasQuality = State.export.format !== 'png' && State.export.format !== 'pdf';
  return `
    <div class="panel-section">
      <div class="section-label">Format</div>
      <div class="aspect-grid" style="grid-template-columns:repeat(5,1fr);">
        ${['png', 'jpg', 'webp', 'avif', 'pdf'].map(f => `<button class="aspect-btn ${State.export.format === f ? 'active' : ''}" data-export-fmt="${f}" style="text-transform:uppercase;font-size:10px;">${f}</button>`).join('')}
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">File</div>
      <div class="input-row">
        <label>Name</label>
        <input type="text" id="exportName" value="${State.export.filename}" style="width:100%;flex:1;">
      </div>
      ${slider('Scale', 10, 400, State.export.scale, '%', 'data-export-prop="scale" step="10"')}
      ${hasQuality ? slider('Quality', 10, 100, State.export.quality, '%', 'data-export-prop="quality"') : ''}
    </div>
    <div class="panel-section">
      <div class="section-label">Preview</div>
      <div class="size-preview">
        <div class="size-preview-row"><span>Format</span><span>${State.export.format.toUpperCase()}</span></div>
        <div class="size-preview-row"><span>Dimensions</span><span>${State.image ? Math.round(Engine.canvas.width * State.export.scale / 100) + '×' + Math.round(Engine.canvas.height * State.export.scale / 100) : '—'}</span></div>
        <div class="size-preview-row"><span>Est. size</span><span>${formatBytes(Exporter.estimateSize())}</span></div>
        <div class="size-bar"><div class="size-bar-fill" style="width:${Math.min(100, Exporter.estimateSize() / 100000)}%"></div></div>
      </div>
    </div>
    <div class="panel-section">
      <button class="btn primary full" data-action="export-now" style="font-size:14px;padding:11px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export Image
      </button>
    </div>
    <div class="panel-section">
      <div class="section-label" style="display:flex;align-items:center;justify-content:space-between;">
        <span>Slice</span>
        <button class="btn ${State.export.sliceSwap ? 'primary' : ''}" data-action="slice-swap" title="Swap rows/columns orientation" style="font-size:11px;padding:3px 8px;display:flex;align-items:center;gap:4px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="8 21 3 21 3 16"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
          Swap
        </button>
      </div>
      <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:8px;">Split the image into equal parts, downloaded together as a .zip.</p>
      <div class="aspect-grid" style="grid-template-columns:repeat(4,1fr);">
        ${[2, 4, 6, 8].map(n => {
          const { cols, rows } = gridForCount(n, State.export.sliceSwap);
          return `<button class="aspect-btn" data-slice="${n}" title="${cols}×${rows} grid">${n}<div style="font-size:9px;color:var(--text-muted);">${cols}×${rows}</div></button>`;
        }).join('')}
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">Batch Process</div>
      <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:10px;">Process multiple images with the same operation.</p>
      <button class="btn full" data-action="batch">Open Batch Processor</button>
    </div>
  `;
}
