import Browser from 'webextension-polyfill';

export async function closeWindow() {
  try {
    // This allows the FE to call close popup without querying for window id to pass.
    const currentWindow = await Browser.windows.getCurrent();
    if (currentWindow.type === 'popup' && currentWindow.id) {
      await Browser.windows.remove(currentWindow.id);
    }
  } catch (error) {
    throw error;
  }
}
