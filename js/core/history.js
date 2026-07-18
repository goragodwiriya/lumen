/**
 * HistoryManager — snapshot-based undo/redo over the editable state.
 * Emits bus events instead of touching UI panels directly.
 */
import { $ } from '../lib/dom.js';
import { State, defaultEnhance, defaultEffects } from './state.js';
import { Engine } from './engine.js';
import { bus } from './bus.js';
import { toast } from '../ui/toast.js';

const clone = (obj) => JSON.parse(JSON.stringify(obj));

class HistoryManager {
  constructor() { this.maxSize = 50; }

  snapshot() {
    return {
      adjustments: clone(State.adjustments),
      enhance: clone(State.enhance),
      effects: clone(State.effects),
      filter: State.filter,
      filterIntensity: State.filterIntensity,
      transform: clone(State.transform),
      overlays: clone(State.overlays),
      background: clone(State.background),
      watermark: clone(State.watermark)
    };
  }

  push(label = 'Edit') {
    // Drop redo branch
    State.history = State.history.slice(0, State.historyIndex + 1);
    State.history.push({ label, state: this.snapshot() });
    if (State.history.length > this.maxSize) State.history.shift();
    State.historyIndex = State.history.length - 1;
    this.updateButtons();
    bus.emit('history:changed');
  }

  restore(index) {
    if (index < 0 || index >= State.history.length) return;
    const s = State.history[index].state;
    State.adjustments = clone(s.adjustments);
    State.enhance = s.enhance ? clone(s.enhance) : defaultEnhance();
    State.effects = s.effects ? clone(s.effects) : defaultEffects();
    State.filter = s.filter;
    State.filterIntensity = s.filterIntensity;
    State.transform = clone(s.transform);
    State.overlays = clone(s.overlays);
    State.background = clone(s.background);
    State.watermark = clone(s.watermark);
    State.historyIndex = index;
    Engine.render();
    this.updateButtons();
    bus.emit('state:restored');
  }

  undo() {
    if (State.historyIndex > 0) {
      this.restore(State.historyIndex - 1);
      toast('Undo', 'info', 1200);
    }
  }

  redo() {
    if (State.historyIndex < State.history.length - 1) {
      this.restore(State.historyIndex + 1);
      toast('Redo', 'info', 1200);
    }
  }

  reset() {
    if (State.history.length > 0) {
      this.restore(0);
    }
  }

  updateButtons() {
    $('#btnUndo').disabled = State.historyIndex <= 0;
    $('#btnRedo').disabled = State.historyIndex >= State.history.length - 1;
  }
}

export const History = new HistoryManager();
