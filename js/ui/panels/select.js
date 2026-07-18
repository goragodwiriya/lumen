/**
 * Select panel — quick actions, layer list, recent files, tips.
 */
import { formatBytes } from '../../lib/utils.js';
import { State } from '../../core/state.js';
import { ICON } from '../../config/icons.js';
import { copyTarget } from '../../core/clipboard.js';

export function renderSelect() {
  const copyLabel = copyTarget() === 'layer' ? 'Copy Selected Layer' : 'Copy Image';
  return `
    <div class="panel-section">
      <div class="section-label">Quick Actions</div>
      <div class="btn-row" style="margin-bottom:8px;">
        <button class="btn" data-action="undo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 2.8L3 13"/></svg>Undo</button>
        <button class="btn" data-action="redo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 2.8L21 13"/></svg>Redo</button>
      </div>
      <button class="btn full" data-action="reset" style="margin-bottom:8px;">Reset All</button>
      <button class="btn full" data-action="duplicate" style="margin-bottom:8px;">Duplicate Image</button>
      <button class="btn full" data-action="copy-image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>${copyLabel}</button>
    </div>
    <div class="panel-section">
      <div class="section-label">Layers (${State.overlays.length})</div>
      ${State.overlays.length === 0 ? '<div style="font-size:11.5px;color:var(--text-muted);text-align:center;padding:14px 0;">No layers yet. Use Text, Shapes, or Draw tools to add.</div>' :
        State.overlays.slice().reverse().map((o, i) => {
          const idx = State.overlays.length - 1 - i;
          const isSel = o.id === State.selectedOverlayId;
          const icon = o.type === 'text' ? ICON.text : o.type === 'shape' ? ICON.shapes : o.type === 'watermark' ? ICON.watermark : o.type === 'image' ? ICON.background : ICON.draw;
          const label = o.type === 'text' ? 'Text: ' + (o.text || '').slice(0, 18)
            : o.type === 'shape' ? 'Shape: ' + o.kind
            : o.type === 'watermark' ? 'Watermark'
            : o.type === 'image' ? `Image: ${Math.round(o.w)}×${Math.round(o.h)}`
            : 'Path';
          return `
            <div class="history-item ${isSel ? 'current' : ''}" data-layer-select="${o.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>
              <span>${label}</span>
              <button class="layer-remove" data-layer-remove="${idx}" title="Delete">×</button>
            </div>
          `;
        }).join('')
      }
    </div>
    <div class="panel-section">
      <div class="section-label">Recent Files</div>
      ${State.recentFiles.length === 0 ? '<div style="font-size:11.5px;color:var(--text-muted);text-align:center;padding:10px 0;">No recent files</div>' :
        `<div class="recent-list">${State.recentFiles.map(f => `
          <div class="recent-item" data-recent="${f.name}">
            <img class="recent-thumb" src="${f.dataUrl}" alt="">
            <div class="recent-info">
              <div class="recent-name">${f.name}</div>
              <div class="recent-meta">${formatBytes(f.size)}</div>
            </div>
          </div>
        `).join('')}</div>`
      }
    </div>
    <div class="panel-section">
      <div class="section-label">Tips</div>
      <div style="font-size:11.5px;color:var(--text-muted);line-height:1.6;">
        <div style="margin-bottom:6px;">Click a layer on the image or in the list to select it, then drag to move</div>
        <div style="margin-bottom:6px;">Drag empty canvas to pan around the image</div>
        <div style="margin-bottom:6px;"><kbd style="background:var(--panel-2);padding:2px 6px;border-radius:4px;font-size:10px;">Arrows</kbd> nudge selected layer</div>
        <div style="margin-bottom:6px;"><kbd style="background:var(--panel-2);padding:2px 6px;border-radius:4px;font-size:10px;">Ctrl+D</kbd> duplicate, <kbd style="background:var(--panel-2);padding:2px 6px;border-radius:4px;font-size:10px;">Del</kbd> delete</div>
        <div style="margin-bottom:6px;"><kbd style="background:var(--panel-2);padding:2px 6px;border-radius:4px;font-size:10px;">Ctrl+C</kbd> copy selected layer (or whole image) to clipboard</div>
        <div>Mouse wheel to zoom, <kbd style="background:var(--panel-2);padding:2px 6px;border-radius:4px;font-size:10px;">0</kbd> to fit screen</div>
      </div>
    </div>
  `;
}
