import browser from 'webextension-polyfill';

export async function closeActiveTab() {
  const tabs = await browser.tabs.query({
    active: true,
    currentWindow: true
  });
  if (tabs.length > 0 && tabs[0].id != null) {
    await browser.tabs.remove(tabs[0].id);
  }
}
