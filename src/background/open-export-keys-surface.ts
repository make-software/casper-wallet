import { windows } from 'webextension-polyfill';

export async function closeExportKeysSurface(): Promise<void> {
  try {
    const currentWindow = await windows.getCurrent();

    // Only ever remove a dedicated popup window, never a normal browser window
    // with the user's other tabs in it. This flow always opens type:'popup',
    // but popup.html is URL-addressable, so if the export page is ever rendered
    // in a plain tab getCurrent() would return that whole window. Same guard as
    // close-current-window.ts.
    if (currentWindow.type === 'popup' && currentWindow.id != null) {
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
