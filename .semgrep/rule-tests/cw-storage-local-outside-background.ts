// @ts-nocheck — semgrep pattern fixture, not type-checked code.
// Test fixture for cw-storage-local-outside-background.
// `paths.exclude` (src/background/**, *.test.ts) is not exercised — see README.

export async function bare() {
  // ruleid: cw-storage-local-outside-background
  await storage.local.get('vaultCipher');
  // ruleid: cw-storage-local-outside-background
  await storage.local.set({ a: 1 });
  // ruleid: cw-storage-local-outside-background
  await storage.local.remove('a');
}

export async function namespaced() {
  // ruleid: cw-storage-local-outside-background
  await browser.storage.local.get('a');
  // ruleid: cw-storage-local-outside-background
  await chrome.storage.local.set({ a: 1 });
  // ruleid: cw-storage-local-outside-background
  await chrome.storage.local.remove('a');
}

export async function insideCallback() {
  setTimeout(async () => {
    // ruleid: cw-storage-local-outside-background
    await browser.storage.local.set({ nested: true });
  }, 0);
}

export async function sessionArea() {
  // ruleid: cw-storage-local-outside-background
  await storage.session.get('a');
  // ruleid: cw-storage-local-outside-background
  await storage.session.set({ a: 1 });
  // ruleid: cw-storage-local-outside-background
  await storage.session.remove('a');
  // ruleid: cw-storage-local-outside-background
  await browser.storage.session.get('a');
  // ruleid: cw-storage-local-outside-background
  await browser.storage.session.set({ a: 1 });
  // ruleid: cw-storage-local-outside-background
  await browser.storage.session.remove('a');
  // ruleid: cw-storage-local-outside-background
  await chrome.storage.session.get('a');
  // ruleid: cw-storage-local-outside-background
  await chrome.storage.session.set({ a: 1 });
  // ruleid: cw-storage-local-outside-background
  await chrome.storage.session.remove('a');
}

export async function safeAlternatives() {
  // ok: cw-storage-local-outside-background
  await storage.sync.get('a');
  // ok: cw-storage-local-outside-background
  window.localStorage.getItem('a');
  // ok: cw-storage-local-outside-background
  await browser.runtime.sendMessage({ type: 'getState' });
}
