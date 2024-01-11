import { tabs } from 'webextension-polyfill';

export async function closeActiveTab() {
  try {
    const tabsList = await tabs.query({
      active: true,
      currentWindow: true
    });
    if (tabsList.length > 0 && tabsList[0].id != null) {
      await tabs.remove(tabsList[0].id);
    }
  } catch (e) {
    console.error(e);
  }
}
