/**
 * Minimal pub/sub event bus.
 * Used to decouple core modules (history, loader) from UI modules —
 * core emits events, UI subscribes, so imports stay one-directional.
 *
 * Events:
 *   'image:loaded'    — a new image became the working image
 *   'history:changed' — an entry was pushed (undo/redo buttons, history panel)
 *   'state:restored'  — state was replaced by a history snapshot
 */
const listeners = {};

export const bus = {
  on(event, fn) {
    (listeners[event] ||= []).push(fn);
  },
  emit(event, ...args) {
    (listeners[event] || []).forEach(fn => fn(...args));
  }
};
