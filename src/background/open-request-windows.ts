import { Windows, runtime, windows } from 'webextension-polyfill';

import { redactUrlQuery } from '@background/redact-url-query';

// Every page a `?requestId=` can legitimately reach. `popup.html` never carries
// one today, but it is `use-ledger.ts`'s default `domain`.
export const REQUEST_BEARING_PATHNAMES = new Set([
  '/signature-request.html',
  '/connect-to-app.html',
  '/popup.html'
]);

/**
 * Every `requestId` a tab of this extension currently displays, or `null` if the
 * enumeration failed — never collapse `null` into an empty set, the caller deletes
 * signing payloads on this reading. Scheme, host AND pathname must match: a
 * web-accessible page under this origin could otherwise claim any `requestId`.
 */
export async function collectRequestIdsFromOpenWindows(): Promise<Set<string> | null> {
  let allWindows: Windows.Window[];

  try {
    allWindows = await windows.getAll({ populate: true });
  } catch (error) {
    console.error(
      'collectRequestIdsFromOpenWindows: could not enumerate windows',
      redactUrlQuery(error)
    );

    return null;
  }

  const requestIds = new Set<string>();
  // Compared piecewise rather than by `.origin`, which is the opaque "null" for
  // non-special schemes and would equate every extension's pages with ours.
  const extensionUrl = new URL(runtime.getURL(''));

  for (const browserWindow of allWindows) {
    for (const tab of browserWindow.tabs ?? []) {
      // `pendingUrl` (Chrome-only) is set while `url` is still empty.
      const url = tab.url || tab.pendingUrl;

      if (!url) {
        continue;
      }

      let tabUrl: URL;

      try {
        tabUrl = new URL(url);
      } catch (error) {
        // The url is logged too: `Invalid URL` names no tab. Both redacted —
        // a `signMessage` approval url carries the plaintext message.
        console.error(
          'collectRequestIdsFromOpenWindows: could not parse a tab url',
          redactUrlQuery(url),
          redactUrlQuery(error)
        );

        continue;
      }

      if (
        tabUrl.protocol !== extensionUrl.protocol ||
        tabUrl.host !== extensionUrl.host ||
        !REQUEST_BEARING_PATHNAMES.has(tabUrl.pathname)
      ) {
        continue;
      }

      const requestId = tabUrl.searchParams.get('requestId');

      if (requestId) {
        requestIds.add(requestId);
      }
    }
  }

  return requestIds;
}
