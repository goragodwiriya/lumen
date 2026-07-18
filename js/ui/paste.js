/**
 * Paste routing — with no image open a pasted image simply opens;
 * with one open, the user chooses between replacing the working image
 * or adding the pasted image as a new movable layer.
 */
import { State } from '../core/state.js';
import { Loader } from '../core/loader.js';
import { showModal } from './modal.js';
import { selectTool } from './toolbar.js';

export function handleImagePaste(file) {
  if (!file) return;
  if (!State.image) {
    Loader.loadFile(file);
    return;
  }
  showModal('Paste Image',
    'Add the pasted image as a layer on top of the current image, or open it as a new image (replaces the current one)?', [
    {
      label: 'New Layer', style: 'primary', onClick: () => {
        Loader.loadFileAsLayer(file);
        selectTool('select');
      }
    },
    { label: 'New Image', onClick: () => Loader.loadFile(file) },
    { label: 'Cancel' }
  ]);
}

export async function pasteFromClipboard() {
  const file = await Loader.readClipboardImage();
  if (file) handleImagePaste(file);
}
