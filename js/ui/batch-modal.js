/**
 * Batch export modal — pick multiple images, apply current edit settings
 * to each, download one .zip.
 */
import { $ } from '../lib/dom.js';
import { showModal, closeModal } from './modal.js';
import { toast } from './toast.js';
import { runBatchExport } from '../core/batch.js';

export function openBatchModal() {
  showModal(
    'Batch Export',
    `<p style="margin-bottom:10px;">Applies your current adjustments, filter, enhancements, watermark and background to every selected image, then downloads one .zip. Per-image text/shapes/drawings are not included.</p>
     <input type="file" id="batchFiles" accept="image/*" multiple style="width:100%;margin-bottom:10px;">
     <div class="input-row">
       <label>Format</label>
       <select id="batchFormat">
         <option value="jpg" selected>JPG</option>
         <option value="png">PNG</option>
         <option value="webp">WEBP</option>
       </select>
     </div>
     <div id="batchProgress" style="font-size:11.5px;color:var(--text-muted);margin-top:8px;"></div>`,
    [
      { label: 'Cancel' },
      { label: 'Start', style: 'primary', keepOpen: true, onClick: startBatch }
    ]
  );
}

async function startBatch() {
  const files = Array.from($('#batchFiles')?.files || []);
  const progress = $('#batchProgress');
  if (files.length === 0) {
    toast('Choose at least one image', 'error');
    return;
  }
  const format = $('#batchFormat')?.value || 'jpg';

  try {
    const blob = await runBatchExport(files, {
      format,
      quality: 90,
      onProgress: (done, total, name) => {
        if (!progress) return;
        progress.textContent = done < total ? `Processing ${done + 1}/${total}: ${name}` : `Zipping ${total} images…`;
      }
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lumen-batch.zip';
    a.click();
    URL.revokeObjectURL(url);
    toast(`Batch export ready (${files.length} images)`, 'success');
    closeModal();
  } catch (err) {
    toast('Batch export failed', 'error');
  }
}
