/**
 * ExportEngine — flattens main + overlay canvases and downloads
 * the result in the selected format.
 */
import { formatBytes } from '../lib/utils.js';
import { State } from './state.js';
import { Engine } from './engine.js';
import { toast } from '../ui/toast.js';

const MIME = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif'
};

class ExportEngine {
  async export() {
    if (!State.image) {
      toast('No image to export', 'error');
      return;
    }
    const scale = State.export.scale / 100;
    const w = Math.round(Engine.canvas.width * scale);
    const h = Math.round(Engine.canvas.height * scale);

    // Hide the selection outline so it doesn't get baked into the file.
    const selected = State.selectedOverlayId;
    if (selected) { State.selectedOverlayId = null; Engine.renderOverlays(); }

    const expCanvas = document.createElement('canvas');
    expCanvas.width = w;
    expCanvas.height = h;
    const exCtx = expCanvas.getContext('2d');
    exCtx.drawImage(Engine.canvas, 0, 0, w, h);
    exCtx.drawImage(Engine.overlay, 0, 0, w, h);

    if (selected) { State.selectedOverlayId = selected; Engine.renderOverlays(); }

    const fmt = State.export.format;
    if (fmt === 'pdf') {
      this.exportPdf(expCanvas.toDataURL('image/png'));
      return;
    }

    const quality = State.export.quality / 100;
    expCanvas.toBlob((blob) => {
      if (!blob) {
        toast('Export failed', 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${State.export.filename || 'lumen-export'}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported as ${fmt.toUpperCase()} (${formatBytes(blob.size)})`, 'success');
    }, MIME[fmt] || 'image/png', quality);
  }

  /** Open a print window; the browser's print dialog can save as PDF. */
  exportPdf(imgData) {
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>${State.export.filename}</title></head><body style="margin:0;padding:0;"><img src="${imgData}" style="width:100%;height:auto;" onload="setTimeout(()=>window.print(),300)"/></body></html>`);
    win.document.close();
    toast('Use browser print to save as PDF', 'info', 4000);
  }

  estimateSize() {
    if (!State.image) return 0;
    const w = Engine.canvas.width * (State.export.scale / 100);
    const h = Engine.canvas.height * (State.export.scale / 100);
    const pixels = w * h;
    const q = State.export.quality / 100;
    if (State.export.format === 'png') return pixels * 1.5; // PNG is lossless
    if (State.export.format === 'jpg') return pixels * 0.15 * q + pixels * 0.05;
    if (State.export.format === 'webp') return pixels * 0.1 * q + pixels * 0.03;
    if (State.export.format === 'avif') return pixels * 0.07 * q + pixels * 0.02;
    return pixels * 0.2;
  }
}

export const Exporter = new ExportEngine();
