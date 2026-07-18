/**
 * Batch export — applies the current adjustments/filter/enhance/watermark/
 * background to a list of images and bundles the results into a .zip.
 * Per-image overlays (text/shapes/paths) are intentionally excluded since
 * they're positioned for one specific photo; the watermark is kept since
 * it's meant to apply uniformly. Requires the global JSZip (loaded via CDN
 * in index.html).
 */
import { State } from './state.js';
import { Engine } from './engine.js';

const MIME = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function canvasToBlob(canvas, format, quality) {
  return new Promise(resolve => canvas.toBlob(resolve, MIME[format] || 'image/png', quality));
}

export async function runBatchExport(files, { format = 'jpg', quality = 90, onProgress } = {}) {
  const zip = new JSZip();

  const saved = {
    image: State.image, name: State.imageName, type: State.imageType, size: State.imageSize,
    w: State.originalWidth, h: State.originalHeight, overlays: State.overlays
  };
  State.overlays = saved.overlays.filter(o => o.type === 'watermark');

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.(i, files.length, file.name);
      const img = await loadImage(file);
      State.image = img;
      State.originalWidth = img.naturalWidth;
      State.originalHeight = img.naturalHeight;
      Engine.setSize(img.naturalWidth, img.naturalHeight);
      Engine.render();

      const out = document.createElement('canvas');
      out.width = img.naturalWidth;
      out.height = img.naturalHeight;
      const octx = out.getContext('2d');
      octx.drawImage(Engine.canvas, 0, 0);
      octx.drawImage(Engine.overlay, 0, 0);

      const blob = await canvasToBlob(out, format, quality / 100);
      zip.file(`${file.name.replace(/\.[^.]+$/, '')}.${format}`, blob);
    }
    onProgress?.(files.length, files.length, '');
    return await zip.generateAsync({ type: 'blob' });
  } finally {
    State.image = saved.image;
    State.imageName = saved.name; State.imageType = saved.type; State.imageSize = saved.size;
    State.originalWidth = saved.w; State.originalHeight = saved.h;
    State.overlays = saved.overlays;
    if (saved.image) { Engine.setSize(saved.w, saved.h); Engine.render(); }
  }
}
