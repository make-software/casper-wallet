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

// Rejects on failure — the caller is expected to tell the user. If this window
// never opens there is no other surface on which the export could report back,
// so swallowing here would leave the menu item looking simply dead.
export async function openExportKeysSurface(): Promise<void> {
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
