import Browser from 'webextension-polyfill';

export async function closeWindow() {
  const windowId = await Browser.runtime.sendMessage({ type: 'get-window-id' });

  try {
    if (windowId) {
      await Browser.windows.remove(windowId);
    } else {
      // This allows the FE to call close popup without querying for window id to pass.
      const currentWindow = await Browser.windows.getCurrent();
      if (currentWindow.type === 'popup' && currentWindow.id) {
        await Browser.windows.remove(currentWindow.id);
      }
    }
  } catch (error) {
    throw error;
  }
}
