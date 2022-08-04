import Browser from 'webextension-polyfill';
import { getWindowId } from '@src/apps/popup/redux/remote-actions';

export async function closeWindow() {
  const windowId = await getWindowId();

  try {
    if (windowId) {
      await Browser.windows.remove(windowId);
    } else {
      // This allows the FE to call close popup without querying for window id to pass.
      const currentWindow = await Browser.windows.getCurrent();
      // TODO: not sure about this check if the type eq popup is necessary, it'll cause other windows not close correctly
      if (currentWindow.type === 'popup' && currentWindow.id) {
        await Browser.windows.remove(currentWindow.id);
      }
    }
  } catch (error) {
    throw error;
  }
}
