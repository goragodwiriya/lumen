/**
 * PanelController — renders the right panel for the active tool
 * and re-renders in response to core events.
 */
import { $ } from '../lib/dom.js';
import { TOOLS } from '../config/tools.js';
import { bus } from '../core/bus.js';
import { PANELS } from './panels/index.js';
import { bindPanelControls } from './panel-bindings.js';

class PanelController {
  constructor() {
    this.container = $('#rightPanel');
    this.currentTool = 'select';
  }

  render(tool) {
    this.currentTool = tool;
    const t = TOOLS.find(x => x.id === tool);
    const renderBody = PANELS[tool] || (() => '');
    this.container.innerHTML = `
      <div class="panel-header">
        <div class="panel-title">${t.icon}${t.name}</div>
        <div class="panel-subtitle">${t.desc}</div>
      </div>
      ${renderBody()}
    `;
    bindPanelControls(this);
  }

  refreshActive() {
    this.render(this.currentTool);
  }
}

export const Panel = new PanelController();

// Core events → panel refresh (avoids core importing UI)
bus.on('image:loaded', () => Panel.refreshActive());
bus.on('state:restored', () => Panel.refreshActive());
bus.on('history:changed', () => {
  if (Panel.currentTool === 'history') Panel.refreshActive();
});
bus.on('overlay:selected', () => {
  if (['select', 'text', 'shapes'].includes(Panel.currentTool)) Panel.refreshActive();
});
bus.on('plugin:registered', () => {
  if (Panel.currentTool === 'ai') Panel.refreshActive();
});
