import Browser from 'webextension-polyfill';

// TODO: very similar utility is in the import account, moving it to the background script will'll always return the currently focused window, which could be more raliable and also work better with window manager in background script as well

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
