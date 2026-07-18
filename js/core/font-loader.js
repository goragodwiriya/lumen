/**
 * Lazily loads a Google Font the first time it's selected, then waits for
 * the browser to actually finish downloading it — Canvas text silently
 * falls back to a default font if you draw before the webfont is ready.
 */
import { SYSTEM_FONTS } from '../config/google-fonts.js';

const requested = new Set();

export function ensureGoogleFont(family) {
  if (!family || SYSTEM_FONTS.includes(family)) return Promise.resolve();
  if (requested.has(family)) return document.fonts.ready;
  requested.add(family);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@400;600;700;800&display=swap`;
  document.head.appendChild(link);

  return document.fonts.load(`600 16px "${family}"`).catch(() => {});
}
