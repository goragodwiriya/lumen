---
name: verify
description: How to drive and verify Lumen (static ES-module image editor) end-to-end with headless Chrome + CDP.
---

# Verifying Lumen

Lumen is a static site already served by Apache at `http://localhost/tools/lumen/`
(needs HTTP, not file://; needs internet for the JSZip + Google Fonts CDNs).

## Handle: headless Chrome + CDP (python websockets)

```bash
google-chrome --headless=new --remote-debugging-port=9666 \
  --user-data-dir=<tmp>/profile --no-first-run --disable-gpu about:blank &
```

Connect to the browser websocket from `http://127.0.0.1:9666/json/version`,
then `Target.createTarget` + `Target.attachToTarget {flatten:true}` and drive
the page session. Python `websockets` is installed; PIL is installed for
checking output images. Playwright/puppeteer are NOT installed.

## Gotchas that cost time

- **Set a real viewport first**: `Emulation.setDeviceMetricsOverride`
  (e.g. 1500×950). The default headless window is ~780×492 — the canvas area
  is tiny and synthetic mouse events land on the status bar instead of
  `#canvasStage`, silently doing nothing.
- App state is reachable from the page because modules are served by URL:
  `await import('./js/core/state.js')` in `Runtime.evaluate` returns the same
  `State` singleton the app uses. Same for `Engine`, `Loader`, `Exporter`.
- Open an image the real way with `DOM.setFileInputFiles` on `#fileInput`.
- Paste can be driven two real ways: dispatch a `ClipboardEvent('paste', {clipboardData})`
  built from `new DataTransfer()` (dragdrop.js path), or grant
  `clipboardReadWrite` via `Browser.grantPermissions`, write with
  `navigator.clipboard.write`, and send Ctrl+V via `Input.dispatchKeyEvent`
  with `modifiers: 2` (keyboard.js path).
- Downloads: `Browser.setDownloadBehavior {behavior:'allow', downloadPath}`
  on the browser session, then poll the dir (zips finish in ~1-2s).
- Image-space → screen coords for mouse events:
  `stageRect.left + ix * State.zoom` (stage rect already includes the CSS transform).

## Flows worth driving

- Open image → paste (both paths) → chooser modal → New Layer / New Image.
- Drag layer center; drag bottom-right handle of a selected image layer (resize).
- Ctrl+Z / Ctrl+Y around overlay operations.
- Export panel → `[data-slice]` buttons → unzip and check tile dimensions
  (grid flips for portrait images) and per-tile content (use a quadrant-colored
  test PNG so each tile is distinguishable).
- Export with an overlay selected → exported PNG must contain no
  `#ff6b35` selection-outline pixels.
