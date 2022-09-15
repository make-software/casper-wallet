import browser from 'webextension-polyfill';
import { getWindowId } from '~src/libs/redux/import-account-actions-should-be-removed';

export async function closeWindow() {
  try {
    const windowId = await getWindowId();
    if (windowId) {
      await browser.windows.remove(windowId);
    } else {
      // If there is no windowId in the state it'll fallback to use currentWindow id to close
      const currentWindow = await browser.windows.getCurrent();
      if (currentWindow.id) {
        await browser.windows.remove(currentWindow.id);
      }
    }
  } catch (error) {
    throw error;
  }
}
