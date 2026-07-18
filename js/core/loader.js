/**
 * ImageLoader — opens images from file, URL, clipboard, or recent list,
 * and makes them the working image.
 */
import { $ } from '../lib/dom.js';
import { State, defaultAdjustments, defaultEnhance, defaultEffects } from './state.js';
import { Engine } from './engine.js';
import { History } from './history.js';
import { bus } from './bus.js';
import { addImageOverlay } from './overlays.js';
import { toast } from '../ui/toast.js';

class ImageLoader {
  async loadFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      toast('Unsupported file type', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        this.applyImage(img, {
          name: file.name.replace(/\.[^.]+$/, ''),
          type: file.name.split('.').pop().toLowerCase().replace('jpeg', 'jpg'),
          size: file.size
        });
        this.addToRecent(file.name, e.target.result, file.size);
        toast(`Loaded ${file.name}`, 'success');
      };
      img.onerror = () => toast('Failed to load image', 'error');
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /** Install a decoded image as the working image and reset edit state. */
  applyImage(img, { name, type, size }) {
    State.image = img;
    State.imageName = name;
    State.imageType = type;
    State.imageSize = size;
    State.originalWidth = img.naturalWidth;
    State.originalHeight = img.naturalHeight;
    Engine.setSize(img.naturalWidth, img.naturalHeight);

    $('#canvasStage').style.display = 'block';
    $('#emptyState').classList.add('hidden');
    $('#canvasControls').style.display = 'flex';
    $('#navigator').classList.remove('hidden');

    State.overlays = [];
    State.selectedOverlayId = null;
    State.crop = null;
    State.transform = { rotation: 0, flipH: false, flipV: false };
    State.adjustments = defaultAdjustments();
    State.enhance = defaultEnhance();
    State.effects = defaultEffects();
    State.filter = 'original';
    State.history = [];
    State.historyIndex = -1;
    History.push('Open image');

    Engine.fitToScreen();
    Engine.render();
    bus.emit('image:loaded');
  }

  async loadFromUrl(url, name = 'sample') {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], name + '.jpg', { type: 'image/jpeg' });
      this.loadFile(file);
    } catch (err) {
      toast('Failed to load image', 'error');
    }
  }

  /** Open an image file as a new movable layer on top of the working image. */
  loadFileAsLayer(file) {
    if (!file || !file.type.startsWith('image/')) {
      toast('Unsupported file type', 'error');
      return;
    }
    if (!State.image) { this.loadFile(file); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        addImageOverlay(img, e.target.result);
        History.push('Paste layer');
        toast('Pasted as new layer', 'success');
      };
      img.onerror = () => toast('Failed to load image', 'error');
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /** Read the first image on the clipboard as a File, or null (with a toast) if there is none. */
  async readClipboardImage() {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            return new File([blob], 'clipboard.' + type.split('/')[1], { type });
          }
        }
      }
      toast('No image in clipboard', 'info');
    } catch (err) {
      toast('Clipboard access denied', 'error');
    }
    return null;
  }

  loadRecent(entry) {
    const img = new Image();
    img.onload = () => {
      this.applyImage(img, {
        name: entry.name.replace(/\.[^.]+$/, ''),
        type: entry.name.split('.').pop().toLowerCase(),
        size: entry.size
      });
      toast(`Loaded ${entry.name}`, 'success');
    };
    img.src = entry.dataUrl;
  }

  addToRecent(name, dataUrl, size) {
    State.recentFiles = State.recentFiles.filter(f => f.name !== name);
    State.recentFiles.unshift({ name, dataUrl, size, time: Date.now() });
    State.recentFiles = State.recentFiles.slice(0, 8);
  }
}

export const Loader = new ImageLoader();
