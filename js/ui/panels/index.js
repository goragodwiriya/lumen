/**
 * Panel registry — maps tool id to its render function.
 */
import { renderSelect } from './select.js';
import { renderCrop } from './crop.js';
import { renderAdjust } from './adjust.js';
import { renderEnhance } from './enhance.js';
import { renderFilters } from './filters.js';
import { renderEffects } from './effects.js';
import { renderText } from './text.js';
import { renderShapes } from './shapes.js';
import { renderDraw } from './draw.js';
import { renderWatermark } from './watermark.js';
import { renderBackground } from './background.js';
import { renderExport } from './export.js';
import { renderHistory } from './history.js';
import { renderInfo } from './info.js';
import { renderAI } from './ai.js';

export const PANELS = {
  select: renderSelect,
  crop: renderCrop,
  adjust: renderAdjust,
  enhance: renderEnhance,
  filters: renderFilters,
  effects: renderEffects,
  text: renderText,
  shapes: renderShapes,
  draw: renderDraw,
  watermark: renderWatermark,
  background: renderBackground,
  export: renderExport,
  history: renderHistory,
  info: renderInfo,
  ai: renderAI
};
