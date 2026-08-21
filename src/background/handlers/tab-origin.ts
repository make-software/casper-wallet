import { tabs } from 'webextension-polyfill';

// The live origin of a tab's TOP-LEVEL document, or null when it cannot be
// established: the tab is gone, it carries no url, or the url is unparseable or
// opaque. Never throws — the caller treats null as "unverifiable" and withholds
// the response. Never logs the url either: a dapp url can carry user content in
// its query, and the caller logs the identifiers it needs.
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
