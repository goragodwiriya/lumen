/**
 * History panel — clickable list of snapshots.
 */
import { State } from '../../core/state.js';

export function renderHistory() {
  return `
    <div class="panel-section">
      <div class="section-label">
        <span>History (${State.history.length})</span>
        <button class="reset-link" data-action="clear-history">Clear</button>
      </div>
      <div class="history-list">
        ${State.history.length === 0 ? '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:11.5px;">No history yet</div>' :
          State.history.map((h, i) => `
            <div class="history-item ${i === State.historyIndex ? 'current' : ''}" data-history="${i}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${h.label}</span>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;
}
