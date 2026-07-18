/**
 * Capture a photo from the webcam into the editor.
 */
import { $ } from '../lib/dom.js';
import { Loader } from '../core/loader.js';
import { toast } from './toast.js';
import { showModal } from './modal.js';

export async function openCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    showModal('Camera', '<video id="camVideo" autoplay style="width:100%;border-radius:8px;"></video><div style="margin-top:10px;font-size:11px;color:var(--text-muted)">Click capture to take a photo</div>', [
      { label: 'Cancel', onClick: () => stream.getTracks().forEach(t => t.stop()) },
      { label: 'Capture', style: 'primary', keepOpen: true, onClick: () => {
        const video = $('#camVideo');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          const file = new File([blob], 'camera.jpg', { type: 'image/jpeg' });
          Loader.loadFile(file);
          stream.getTracks().forEach(t => t.stop());
        }, 'image/jpeg', 0.9);
      } }
    ]);
    setTimeout(() => {
      const v = $('#camVideo');
      if (v) v.srcObject = stream;
    }, 100);
  } catch (err) {
    toast('Camera access denied', 'error');
  }
}
