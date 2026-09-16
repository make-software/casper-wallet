import { windows } from 'webextension-polyfill';

export async function closeExportKeysSurface(): Promise<void> {
  try {
    const currentWindow = await windows.getCurrent();

    // Only ever remove a dedicated popup window: popup.html is URL-addressable,
    // so getCurrent() could otherwise be the user's whole browser window.
    if (currentWindow.type === 'popup' && currentWindow.id != null) {
      await windows.remove(currentWindow.id);
    }
  } catch (error) {
    // Recoverable: the user can still close the window from the title bar.
    console.error(
      'closeExportKeysSurface: failed to close export window',
      error
    );
  }
}
