import { windows } from 'webextension-polyfill';

export async function closeCurrentWindow() {
  try {
    const currentWindow = await windows.getCurrent();
    if (currentWindow.type === 'popup' && currentWindow.id) {
      await windows.remove(currentWindow.id);
    }
  } catch (error) {
    throw error;
  }
}
