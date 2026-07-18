/**
 * Wires up controls inside the rendered panel.
 * Bindings are attribute-driven (data-prop, data-action, ...) so any
 * panel can use them; controls that don't exist are simply skipped.
 */
import { $ } from '../lib/dom.js';
import { uid } from '../lib/utils.js';
import { State } from '../core/state.js';
import { Engine } from '../core/engine.js';
import { History } from '../core/history.js';
import { Loader } from '../core/loader.js';
import {
  applyTextSettingsToSelection,
  applyShapeSettingsToSelection,
  updateWatermarkOverlay,
  selectOverlay,
  getSelectedOverlay
} from '../core/overlays.js';
import { FILTER_PRESETS } from '../config/filters.js';
import { toast } from './toast.js';
import { showModal } from './modal.js';
import { drawFilterPreview } from './panels/filters.js';
import { handleAction } from './panel-actions.js';
import { setCropAspect } from './crop-box.js';
import { hasPlugin, runPlugin } from '../core/plugin-runner.js';
import { sliceAndDownload } from '../core/slicer.js';
import { ensureGoogleFont } from '../core/font-loader.js';

export function bindPanelControls(panel) {
  const root = panel.container;

  bindSliders(root, panel);
  bindPickers(root, panel);
  bindColorInputs(root, panel);
  bindTextControls(root);
  bindShapeControls(root, panel);
  bindWatermarkControls(root, panel);
  bindBackgroundControls(root, panel);
  bindExportControls(root, panel);
  bindListItems(root, panel);

  root.querySelectorAll('[data-action]').forEach(b => {
    b.onclick = () => handleAction(b.dataset.action, panel);
  });
}

function updateSliderValue(input, text) {
  const head = input.previousElementSibling;
  if (head && head.classList.contains('slider-head')) {
    const valEl = head.querySelector('.slider-value');
    if (valEl) valEl.textContent = text;
  }
}

/** Keeps a slider's unit suffix (%, °, px) while updating its live value display. */
function liveSliderUpdate(input, value) {
  const head = input.previousElementSibling;
  const valEl = head?.querySelector('.slider-value');
  const unit = valEl?.textContent.match(/[%°px]/)?.[0] || '';
  updateSliderValue(input, value + unit);
}

const TEXT_LIVE_PROPS = new Set(['textSize', 'textOpacity', 'textRotation']);
const SHAPE_LIVE_PROPS = new Set(['shapeStrokeWidth', 'shapeOpacity']);

function bindSliders(root, panel) {
  root.querySelectorAll('input[type="range"][data-prop]').forEach(input => {
    input.addEventListener('input', (e) => {
      const prop = e.target.dataset.prop;
      const group = e.target.dataset.group;
      const value = parseFloat(e.target.value);

      if (group === 'adjustments') { State.adjustments[prop] = value; Engine.requestRender(); }
      else if (group === 'transform') { State.transform[prop] = value; Engine.requestRender(); }
      else if (group === 'enhance') { State.enhance[prop] = value; Engine.requestRender(); }
      else if (group === 'effects') { State.effects[prop] = value; Engine.requestRender(); }
      else if (prop === 'filterIntensity') { State.filterIntensity = value; }
      else if (prop in State) {
        State[prop] = value;
        if (TEXT_LIVE_PROPS.has(prop)) applyTextSettingsToSelection();
        else if (SHAPE_LIVE_PROPS.has(prop)) applyShapeSettingsToSelection();
      }

      liveSliderUpdate(e.target, value);
    });
    input.addEventListener('change', (e) => {
      const group = e.target.dataset.group;
      if (['adjustments', 'transform', 'enhance', 'effects'].includes(group)) {
        Engine.render();
        const label = group === 'enhance' ? 'Enhance ' : group === 'effects' ? 'Effect ' : 'Adjust ';
        History.push(label + e.target.dataset.prop);
      }
    });
  });

  // Watermark sliders — live-update the watermark overlay
  root.querySelectorAll('input[type="range"][data-wm-prop]').forEach(input => {
    input.addEventListener('input', (e) => {
      const prop = e.target.dataset.wmProp;
      State.watermark[prop] = parseFloat(e.target.value);
      liveSliderUpdate(e.target, e.target.value);
      updateWatermarkOverlay();
    });
  });

  // Export sliders — refresh the panel so the size preview updates
  root.querySelectorAll('input[type="range"][data-export-prop]').forEach(input => {
    input.addEventListener('input', (e) => {
      State.export[e.target.dataset.exportProp] = parseFloat(e.target.value);
      panel.refreshActive();
    });
  });
}

/** Toggle-style pickers: aspect ratio, filter presets, draw tool, shape kind. */
function bindPickers(root, panel) {
  const activate = (selector, btn) => {
    root.querySelectorAll(selector).forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
  };

  root.querySelectorAll('[data-aspect]').forEach(b => {
    b.onclick = () => {
      setCropAspect(b.dataset.aspect);
      activate('[data-aspect]', b);
      toast(`Aspect: ${b.dataset.aspect}`, 'info', 1200);
    };
  });

  root.querySelectorAll('[data-filter]').forEach(c => {
    c.onclick = () => {
      State.filter = c.dataset.filter;
      activate('[data-filter]', c);
      Engine.render();
      History.push('Filter: ' + FILTER_PRESETS[State.filter].name);
    };
  });
  root.querySelectorAll('canvas[data-filter-preview]').forEach(c => {
    drawFilterPreview(c, c.dataset.filterPreview);
  });

  root.querySelectorAll('[data-draw-tool]').forEach(b => {
    b.onclick = () => {
      State.drawTool = b.dataset.drawTool;
      activate('[data-draw-tool]', b);
    };
  });

  root.querySelectorAll('[data-shape]').forEach(b => {
    b.onclick = () => {
      State.shapeKind = b.dataset.shape;
      activate('[data-shape]', b);
      const o = getSelectedOverlay();
      if (o?.type === 'shape') { o.kind = b.dataset.shape; Engine.renderOverlays(); }
    };
  });
}

function bindColorInputs(root, panel) {
  const activateSwatch = (selector, el) => {
    root.querySelectorAll(selector).forEach(x => x.classList.remove('active'));
    el.classList.add('active');
  };

  root.querySelectorAll('[data-draw-color]').forEach(s => {
    s.onclick = () => {
      State.drawColor = s.dataset.drawColor;
      activateSwatch('[data-draw-color]', s);
      syncColorFields('drawColor', 'drawColorHex', State.drawColor);
    };
  });
  root.querySelectorAll('[data-shape-fill]').forEach(s => {
    s.onclick = () => {
      State.shapeFill = s.dataset.shapeFill;
      activateSwatch('[data-shape-fill]', s);
      syncColorFields('shapeFill', 'shapeFillHex', State.shapeFill);
      applyShapeSettingsToSelection();
    };
  });
  root.querySelectorAll('[data-text-color]').forEach(s => {
    s.onclick = () => {
      State.textColor = s.dataset.textColor;
      activateSwatch('[data-text-color]', s);
      syncColorFields('textColor', 'textColorHex', State.textColor);
      applyTextSettingsToSelection();
    };
  });
  root.querySelectorAll('[data-bg-color]').forEach(s => {
    s.onclick = () => {
      State.background.color = s.dataset.bgColor;
      Engine.render();
      panel.refreshActive();
    };
  });
  root.querySelectorAll('[data-bg-gradient]').forEach(s => {
    s.onclick = () => {
      const [start, end] = s.dataset.bgGradient.split('|');
      State.background.gradientStart = start;
      State.background.gradientEnd = end;
      Engine.render();
      panel.refreshActive();
    };
  });

  bindColorPair('drawColor', 'drawColorHex', v => { State.drawColor = v; });
  bindColorPair('shapeFill', 'shapeFillHex', v => { State.shapeFill = v; applyShapeSettingsToSelection(); });
  bindColorPair('textColor', 'textColorHex', v => { State.textColor = v; applyTextSettingsToSelection(); });
  bindColorPair('bgColor', 'bgColorHex', v => { State.background.color = v; Engine.render(); });
}

function syncColorFields(inputId, hexId, value) {
  const inp = $(`#${inputId}`); if (inp) inp.value = value;
  const hex = $(`#${hexId}`); if (hex) hex.value = value;
}

function bindColorPair(inputId, hexId, setValue) {
  const inp = $(`#${inputId}`);
  const hex = $(`#${hexId}`);
  if (inp) inp.oninput = () => {
    setValue(inp.value);
    if (hex) hex.value = inp.value;
  };
  if (hex) hex.oninput = () => {
    if (/^#[0-9a-f]{6}$/i.test(hex.value)) {
      setValue(hex.value);
      if (inp) inp.value = hex.value;
    }
  };
}

function bindTextControls(root) {
  const tc = $('#textContent');
  if (tc) tc.oninput = () => { State.textContent = tc.value; applyTextSettingsToSelection(); };
  const tf = $('#textFont');
  if (tf) tf.onchange = () => {
    State.textFont = tf.value;
    applyTextSettingsToSelection();
    ensureGoogleFont(tf.value).then(() => Engine.renderOverlays());
  };
  const ts = $('#textStroke');
  if (ts) ts.onchange = () => {
    State.textStroke = ts.checked;
    $('#textStrokeColorRow').style.display = ts.checked ? '' : 'none';
    applyTextSettingsToSelection();
  };
  const tsc = $('#textStrokeColor');
  if (tsc) tsc.oninput = () => { State.textStrokeColor = tsc.value; applyTextSettingsToSelection(); };
  const tsh = $('#textShadow');
  if (tsh) tsh.onchange = () => { State.textShadow = tsh.checked; applyTextSettingsToSelection(); };
}

function bindShapeControls(root, panel) {
  const ss = $('#shapeStroke');
  if (ss) ss.oninput = () => { State.shapeStroke = ss.value; applyShapeSettingsToSelection(); };

  const sfe = $('#shapeFillEnabled');
  if (sfe) sfe.onchange = () => {
    State.shapeFillEnabled = sfe.checked;
    if (!sfe.checked && State.shapeStrokeWidth === 0) State.shapeStrokeWidth = 2;
    applyShapeSettingsToSelection();
    panel.refreshActive();
  };
}

function bindWatermarkControls(root, panel) {
  root.querySelectorAll('[data-wm-type]').forEach(b => {
    b.onclick = () => { State.watermark.type = b.dataset.wmType; panel.refreshActive(); };
  });
  root.querySelectorAll('[data-wm-pos]').forEach(b => {
    b.onclick = () => {
      State.watermark.position = b.dataset.wmPos;
      root.querySelectorAll('[data-wm-pos]').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      updateWatermarkOverlay();
    };
  });
  const wmt = $('#wmText');
  if (wmt) wmt.oninput = () => { State.watermark.text = wmt.value; updateWatermarkOverlay(); };
}

function bindBackgroundControls(root, panel) {
  root.querySelectorAll('[data-bg-type]').forEach(b => {
    b.onclick = () => {
      State.background.type = b.dataset.bgType;
      Engine.render();
      panel.refreshActive();
    };
  });
  const bgs = $('#bgGradStart');
  if (bgs) bgs.oninput = () => { State.background.gradientStart = bgs.value; Engine.render(); };
  const bge = $('#bgGradEnd');
  if (bge) bge.oninput = () => { State.background.gradientEnd = bge.value; Engine.render(); };
  root.querySelectorAll('input[data-bg-prop]').forEach(i => {
    i.oninput = () => {
      State.background[i.dataset.bgProp] = parseFloat(i.value);
      liveSliderUpdate(i, i.value);
      Engine.requestRender();
    };
  });
}

function bindExportControls(root, panel) {
  root.querySelectorAll('[data-export-fmt]').forEach(b => {
    b.onclick = () => {
      State.export.format = b.dataset.exportFmt;
      panel.refreshActive();
    };
  });
  const en = $('#exportName');
  if (en) en.oninput = () => State.export.filename = en.value;

  root.querySelectorAll('[data-slice]').forEach(b => {
    b.onclick = () => sliceAndDownload(parseInt(b.dataset.slice));
  });
}

function bindListItems(root, panel) {
  root.querySelectorAll('[data-history]').forEach(item => {
    item.onclick = () => History.restore(parseInt(item.dataset.history));
  });

  root.querySelectorAll('[data-layer-select]').forEach(item => {
    item.onclick = (e) => {
      if (e.target.closest('[data-layer-remove]')) return;
      selectOverlay(item.dataset.layerSelect);
    };
  });
  root.querySelectorAll('[data-layer-remove]').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.layerRemove);
      const removed = State.overlays[idx];
      State.overlays.splice(idx, 1);
      if (removed && removed.id === State.selectedOverlayId) State.selectedOverlayId = null;
      Engine.renderOverlays();
      History.push('Remove layer');
      panel.refreshActive();
    };
  });

  root.querySelectorAll('[data-recent]').forEach(item => {
    item.onclick = () => {
      const entry = State.recentFiles.find(f => f.name === item.dataset.recent);
      if (entry) Loader.loadRecent(entry);
    };
  });

  root.querySelectorAll('[data-ai]').forEach(c => {
    c.onclick = () => runAICard(c, panel);
  });
}

async function runAICard(card, panel) {
  const id = card.dataset.ai;
  if (!hasPlugin(id)) {
    showModal('AI Module Not Connected',
      `This AI tool (${id}) requires a model endpoint. Register a plugin with Lumen.plugin.register({ name: '${id}', run: async (blob, meta) => {...} }) to connect it — see README.md for the full guide.`,
      [{ label: 'OK' }, { label: 'Learn More', style: 'primary' }]);
    return;
  }

  const name = card.querySelector('.ai-name')?.textContent || id;
  card.disabled = true;
  card.classList.add('busy');
  toast(`Running ${name}…`, 'info', 4000);
  try {
    const res = await runPlugin(id, `AI: ${name}`);
    toast(res.replaced ? `${name} applied` : `${name} finished`, 'success');
    if (res.replaced) panel.refreshActive();
  } catch (err) {
    toast(`${name} failed: ${err?.message || 'unknown error'}`, 'error', 4000);
  } finally {
    card.disabled = false;
    card.classList.remove('busy');
  }
}
