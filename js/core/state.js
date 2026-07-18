/**
 * Single mutable application state shared by all modules.
 * Modules mutate State directly and re-render via Engine.
 */
export function defaultAdjustments() {
  return {
    brightness: 100,
    contrast: 100,
    exposure: 0,
    gamma: 100,
    saturation: 100,
    vibrance: 0,
    hue: 0,
    temperature: 0,
    tint: 0,
    shadows: 0,
    highlights: 0,
    whites: 0,
    blacks: 0,
    opacity: 100,
    blur: 0,
    sharpen: 0
  };
}

export function defaultEnhance() {
  return { sharpen: 0, clarity: 0, texture: 0, noise: 0, smooth: 0, dehaze: 0 };
}

export function defaultEffects() {
  return { motion: 0, pixelate: 0, mosaic: 0, vignette: 0, glow: 0, shadow: 0 };
}

export const State = {
  image: null,           // HTMLImageElement
  imageName: 'untitled',
  imageType: 'png',
  imageSize: 0,
  originalWidth: 0,
  originalHeight: 0,

  adjustments: defaultAdjustments(),
  enhance: defaultEnhance(),
  effects: defaultEffects(),

  filter: 'original',
  filterIntensity: 100,

  transform: {
    rotation: 0,
    flipH: false,
    flipV: false
  },

  crop: null,            // {x, y, w, h} in image coords
  cropAspect: 'free',

  overlays: [],          // {id, type, ...}
  selectedOverlayId: null,

  zoom: 1,
  pan: { x: 0, y: 0 },

  tool: 'select',
  drawTool: 'brush',     // pencil, brush, marker, eraser, picker
  drawColor: '#ff6b35',
  drawSize: 8,
  drawOpacity: 100,
  drawHardness: 80,

  shapeKind: 'rect',
  shapeFill: '#ff6b35',
  shapeFillEnabled: true,
  shapeStroke: '#000000',
  shapeStrokeWidth: 2,
  shapeOpacity: 100,

  textContent: 'Your text',
  textFont: 'Manrope',
  textSize: 48,
  textColor: '#ff6b35',
  textStroke: false,
  textStrokeColor: '#000000',
  textShadow: false,
  textOpacity: 100,
  textRotation: 0,

  watermark: {
    type: 'text',
    text: '© Lumen',
    image: null,
    position: 'br',
    opacity: 50,
    scale: 100,
    rotation: 0
  },

  background: {
    type: 'transparent',
    color: '#ffffff',
    gradientStart: '#ff6b35',
    gradientEnd: '#4ecdc4',
    blur: 12,
    padding: 12
  },

  export: {
    format: 'png',
    quality: 90,
    scale: 100,
    filename: 'lumen-export',
    sliceSwap: false
  },

  history: [],
  historyIndex: -1,

  theme: 'dark',
  showGrid: false,
  showRulers: false,
  showNavigator: true,
  isDrawing: false,
  isPanning: false,
  isShapeDragging: false,
  currentPath: null,
  recentFiles: []
};
