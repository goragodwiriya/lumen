/**
 * Tool registry — one entry per left-toolbar tool / right-panel view.
 */
import { ICON } from './icons.js';

export const TOOLS = [
  { id: 'select', name: 'Select', icon: ICON.select, label: 'Move', desc: 'Move and select layers' },
  { id: 'crop', name: 'Crop', icon: ICON.crop, label: 'Crop', desc: 'Crop, rotate and flip' },
  { id: 'adjust', name: 'Adjust', icon: ICON.adjust, label: 'Adjust', desc: 'Color and tone adjustments' },
  { id: 'enhance', name: 'Enhance', icon: ICON.enhance, label: 'Enhance', desc: 'Detail and clarity enhancements' },
  { id: 'filters', name: 'Filters', icon: ICON.filter, label: 'Filters', desc: 'Preset filter looks' },
  { id: 'effects', name: 'Effects', icon: ICON.effects, label: 'Effects', desc: 'Blur, vignette, glow and more' },
  { id: 'text', name: 'Text', icon: ICON.text, label: 'Text', desc: 'Add text layers' },
  { id: 'shapes', name: 'Shapes', icon: ICON.shapes, label: 'Shapes', desc: 'Add vector shapes' },
  { id: 'draw', name: 'Draw', icon: ICON.draw, label: 'Draw', desc: 'Drawing tools' },
  { id: 'watermark', name: 'Watermark', icon: ICON.watermark, label: 'Mark', desc: 'Add watermarks' },
  { id: 'background', name: 'Background', icon: ICON.background, label: 'BG', desc: 'Background settings' },
  { id: 'export', name: 'Export', icon: ICON.export, label: 'Export', desc: 'Save and export' },
  { id: 'history', name: 'History', icon: ICON.history, label: 'History', desc: 'Edit history' },
  { id: 'info', name: 'Info', icon: ICON.info, label: 'Info', desc: 'Image metadata' },
  { id: 'ai', name: 'AI', icon: ICON.ai, label: 'AI', desc: 'AI tools (coming soon)' }
];
