import { windows } from 'webextension-polyfill';

import { RouterPath } from '@popup/router/paths';

// WALLET-1345: key export must not run in the extension popup. On Safari the
// popup closes the moment a download steals focus; its document is torn down,
// the browser revokes the blob: URL mid-read, and the file never lands. The
// anchor+blob mechanism itself is fine — it only needs a context that outlives
// the click, which is why nothing in download-account-keys/utils.ts changed.
const EXPORT_KEYS_URL = `popup.html#${RouterPath.DownloadAccountKeys}`;

// Matches the sizing in create-open-window.ts (360 + 16 cross-platform width
// offset) so the 360px-wide popup UI is not clipped.
const SURFACE_WIDTH = 376;
const SURFACE_HEIGHT = 700;

// Both helpers are called fire-and-forget from onClick handlers, so they settle
// their own failures rather than leaving an unhandled rejection. Same reasoning
// as open-window.ts: a silent no-op with no trace is the worst outcome.

export async function openExportKeysSurface(): Promise<void> {
  try {
    const currentWindow = await windows.getCurrent();

    // Firefox ignores width/height when the parent window is fullscreen and
    // would open a tiny popup instead; omitting them lets it size the window
    // itself. Chrome and Safari do this by default. Mirrors
    // create-open-window.ts.
    const isFullscreen = currentWindow.state === 'fullscreen';

    await windows.create({
      url: EXPORT_KEYS_URL,
      type: 'popup',
      focused: true,
      ...(isFullscreen ? {} : { width: SURFACE_WIDTH, height: SURFACE_HEIGHT })
    });
  } catch (error) {
    console.error('openExportKeysSurface: failed to open export window', error);
  }
}

export async function closeExportKeysSurface(): Promise<void> {
  try {
    const currentWindow = await windows.getCurrent();

    if (currentWindow.id != null) {
      await windows.remove(currentWindow.id);
    }
  } catch (error) {
    // The window stays open and the user can still close it from the title bar,
    // so this is recoverable — but it must not vanish without a trace.
    console.error(
      'closeExportKeysSurface: failed to close export window',
      error
    );
  }
}
