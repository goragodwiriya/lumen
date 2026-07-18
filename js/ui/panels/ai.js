/**
 * AI panel — cards wired to the plugin system (js/core/plugins.js +
 * js/core/plugin-runner.js). A card whose id matches a registered
 * plugin's `name` shows as Connected and actually runs that plugin when
 * clicked; unregistered cards show a "Not Connected" explainer instead.
 */
import { ICON } from '../../config/icons.js';
import { Lumen } from '../../core/plugins.js';

const AI_TOOLS = [
  { id: 'enhance', name: 'AI Enhance', desc: 'Auto-improve quality' },
  { id: 'upscale', name: 'AI Upscale', desc: '2× super resolution' },
  { id: 'remove-bg', name: 'Remove BG', desc: 'Background removal' },
  { id: 'object', name: 'Object Removal', desc: 'Erase unwanted objects' },
  { id: 'face', name: 'Face Enhance', desc: 'Restore face details' },
  { id: 'colorize', name: 'Colorize', desc: 'Color B&W photos' },
  { id: 'deblur', name: 'AI Deblur', desc: 'Fix motion blur' },
  { id: 'sky', name: 'Sky Replace', desc: 'Swap sky content' }
];

export function renderAI() {
  return `
    <div class="panel-section">
      <div class="section-label">AI Tools <span style="color:var(--accent);font-size:9px;background:var(--accent-soft);padding:2px 6px;border-radius:3px;">BETA</span></div>
      <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:12px;">AI modules are designed as independent plugins. Connect your own model endpoints to enable these features.</p>
      <div class="ai-grid">
        ${AI_TOOLS.map(a => {
          const connected = !!Lumen.plugin.get(a.id);
          return `
          <button class="ai-card ${connected ? 'connected' : ''}" data-ai="${a.id}">
            <div class="ai-icon">${ICON.ai}</div>
            <div class="ai-name">${a.name}</div>
            <div class="ai-desc">${a.desc}</div>
            ${connected ? '<div class="ai-status">● Connected</div>' : ''}
          </button>
        `;
        }).join('')}
      </div>
    </div>
    <div class="panel-section">
      <div class="section-label">Plugin System</div>
      <p style="font-size:11.5px;color:var(--text-muted);margin-bottom:10px;">Register a plugin whose <code>name</code> matches one of the card ids above (e.g. <code>remove-bg</code>) to connect it — the card lights up and clicking it actually runs your code. See README.md for the full contract and a worked example.</p>
      <pre style="background:var(--panel-2);padding:10px;border-radius:6px;font-size:10.5px;overflow-x:auto;color:var(--teal);font-family:'Courier New',monospace;">Lumen.plugin.register({
  name: 'remove-bg',
  run: async (imageBlob, meta) => {
    // return a Blob (PNG/JPEG/WebP) to replace the working image,
    // or null/undefined to just do something else (no-op for the canvas)
    return resultBlob;
  }
})</pre>
    </div>
  `;
}
