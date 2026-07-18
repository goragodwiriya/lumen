/**
 * Pixel-level effects (unsharp mask, soften blend) used by the Enhance panel.
 * Pure Canvas 2D, no GPU path — cost scales with image resolution, so
 * callers should coalesce calls (see Engine.requestRender).
 */

/** Separable box blur; a cheap, good-enough stand-in for a Gaussian blur. */
function boxBlur(data, w, h, radius) {
  const r = Math.round(radius);
  if (r < 1) return data.slice();
  const size = r * 2 + 1;
  const tmp = new Uint8ClampedArray(data.length);
  const out = new Uint8ClampedArray(data.length);

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    const rowStart = y * w * 4;
    let ro = 0, go = 0, bo = 0, ao = 0;
    for (let x = -r; x <= r; x++) {
      const xi = Math.min(w - 1, Math.max(0, x));
      const i = rowStart + xi * 4;
      ro += data[i]; go += data[i + 1]; bo += data[i + 2]; ao += data[i + 3];
    }
    for (let x = 0; x < w; x++) {
      const i = rowStart + x * 4;
      tmp[i] = ro / size; tmp[i + 1] = go / size; tmp[i + 2] = bo / size; tmp[i + 3] = ao / size;
      const addX = Math.min(w - 1, x + r + 1), subX = Math.max(0, x - r);
      const addI = rowStart + addX * 4, subI = rowStart + subX * 4;
      ro += data[addI] - data[subI]; go += data[addI + 1] - data[subI + 1];
      bo += data[addI + 2] - data[subI + 2]; ao += data[addI + 3] - data[subI + 3];
    }
  }
  // Vertical pass
  for (let x = 0; x < w; x++) {
    let ro = 0, go = 0, bo = 0, ao = 0;
    for (let y = -r; y <= r; y++) {
      const yi = Math.min(h - 1, Math.max(0, y));
      const i = yi * w * 4 + x * 4;
      ro += tmp[i]; go += tmp[i + 1]; bo += tmp[i + 2]; ao += tmp[i + 3];
    }
    for (let y = 0; y < h; y++) {
      const i = y * w * 4 + x * 4;
      out[i] = ro / size; out[i + 1] = go / size; out[i + 2] = bo / size; out[i + 3] = ao / size;
      const addY = Math.min(h - 1, y + r + 1), subY = Math.max(0, y - r);
      const addI = addY * w * 4 + x * 4, subI = subY * w * 4 + x * 4;
      ro += tmp[addI] - tmp[subI]; go += tmp[addI + 1] - tmp[subI + 1];
      bo += tmp[addI + 2] - tmp[subI + 2]; ao += tmp[addI + 3] - tmp[subI + 3];
    }
  }
  return out;
}

/** Adds `amount` of (original - blurred) back onto the image, i.e. unsharp mask. */
export function unsharpMask(imageData, radius, amount) {
  if (amount <= 0) return imageData;
  const { data, width, height } = imageData;
  const blurred = boxBlur(data, width, height, radius);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = data[i + c] + (data[i + c] - blurred[i + c]) * amount;
    }
  }
  return imageData;
}

/** Blends a box-blurred copy back over the original by `mix` (0..1). */
export function softenBlend(imageData, radius, mix) {
  if (mix <= 0 || radius < 1) return imageData;
  const { data, width, height } = imageData;
  const blurred = boxBlur(data, width, height, radius);
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = data[i + c] * (1 - mix) + blurred[i + c] * mix;
    }
  }
  return imageData;
}
