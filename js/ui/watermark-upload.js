/**
 * Wires the dedicated watermark-image file input (kept separate from the
 * main "open image" input so picking a watermark never replaces the photo).
 */
import { $ } from '../lib/dom.js';
import { State } from '../core/state.js';
import { updateWatermarkOverlay } from '../core/overlays.js';
import { Panel } from './panel-controller.js';
import { toast } from './toast.js';

export function initWatermarkUpload() {
  $('#wmFileInput').onchange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      State.watermark.image = ev.target.result;
      updateWatermarkOverlay();
      if (Panel.currentTool === 'watermark') Panel.refreshActive();
      toast('Watermark image set', 'success');
    };
    reader.readAsDataURL(file);
  };
}
