import browser from 'webextension-polyfill';

export async function closeActiveTab() {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    if (tabs.length > 0 && tabs[0].id != null) {
      await browser.tabs.remove(tabs[0].id);
    }
  } catch (e) {
    console.error(e);
  }
}
