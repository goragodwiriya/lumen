/**
 * Small generic utilities shared across the app.
 */
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const debounce = (fn, ms) => {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
};

export const uid = () => 'id_' + Math.random().toString(36).slice(2, 9);

export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}
