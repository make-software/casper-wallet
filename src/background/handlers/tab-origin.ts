import { tabs } from 'webextension-polyfill';

// The live origin of a tab's TOP-LEVEL document, or null when unverifiable.
// Never throws, and never logs the url, which can carry user content.
export async function getLiveTabOrigin(tabId: number): Promise<string | null> {
  let url: string | undefined;

  try {
    url = (await tabs.get(tabId)).url;
  } catch {
    return null;
  }

  if (!url) {
    return null;
  }

  try {
    const { origin } = new URL(url);

    // `new URL('about:blank').origin` is the STRING "null" — no request
    // descriptor can hold that, so it must not compare equal to anything.
    return origin === 'null' ? null : origin;
  } catch {
    return null;
  }
}
