/**
 * Left toolbar (and its mobile clone) — tool buttons + tool switching.
 */
import { $, $$ } from '../lib/dom.js';
import { TOOLS } from '../config/tools.js';
import { State } from '../core/state.js';
import { Panel } from './panel-controller.js';
import { showCropBox, hideCropBox } from './crop-box.js';

export function initToolbar() {
  const tb = $('#leftToolbar');
  const mtb = $('#mobileToolbar');
  TOOLS.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.dataset.tool = t.id;
    btn.dataset.tip = t.name;
    btn.innerHTML = `${t.icon}<span class="tool-label">${t.label}</span>`;
    btn.onclick = () => selectTool(t.id);
    tb.appendChild(btn);
    const clone = btn.cloneNode(true);
    clone.onclick = () => selectTool(t.id);
    mtb.appendChild(clone);
  });
}

export function selectTool(id) {
  State.tool = id;
  $$('.tool-btn').forEach(b => b.classList.toggle('active', b.dataset.tool === id));
  $('#statusTool').textContent = TOOLS.find(t => t.id === id)?.name || 'Select';
  Panel.render(id);

  if (id === 'crop') showCropBox(); else hideCropBox();

  // On mobile, slide the panel up
  if (window.innerWidth <= 768) {
    $('#rightPanel').classList.add('open');
  }

  const crosshairTools = ['draw', 'text', 'shapes', 'crop'];
  $('#canvasArea').style.cursor = crosshairTools.includes(id) ? 'crosshair' : id === 'select' ? 'grab' : 'default';
}
