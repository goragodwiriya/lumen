/**
 * Preset looks applied via CSS canvas filters.
 */
export const FILTER_PRESETS = {
  original: { name: 'Original', filter: '' },
  vintage: { name: 'Vintage', filter: 'sepia(0.5) contrast(1.1) brightness(0.95) saturate(1.3)' },
  warm: { name: 'Warm', filter: 'saturate(1.2) hue-rotate(-10deg) brightness(1.05)' },
  cool: { name: 'Cool', filter: 'saturate(1.1) hue-rotate(15deg) brightness(0.98)' },
  bw: { name: 'B&W', filter: 'grayscale(1) contrast(1.15)' },
  sepia: { name: 'Sepia', filter: 'sepia(0.85) contrast(1.05) brightness(1.05)' },
  hdr: { name: 'HDR', filter: 'contrast(1.3) saturate(1.4) brightness(1.05)' },
  film: { name: 'Film', filter: 'sepia(0.25) contrast(1.15) saturate(1.2) brightness(0.95)' },
  matte: { name: 'Matte', filter: 'contrast(0.9) brightness(1.05) saturate(0.9)' },
  soft: { name: 'Soft', filter: 'blur(0.4px) brightness(1.05) saturate(0.95) contrast(0.95)' },
  dramatic: { name: 'Drama', filter: 'contrast(1.4) saturate(1.3) brightness(0.9)' },
  mono: { name: 'Mono', filter: 'grayscale(1) contrast(1.3) brightness(0.95)' },
  cyberpunk: { name: 'Cyber', filter: 'saturate(1.5) hue-rotate(-20deg) contrast(1.2)' },
  sunset: { name: 'Sunset', filter: 'sepia(0.3) saturate(1.4) hue-rotate(-15deg) brightness(1.05)' }
};
