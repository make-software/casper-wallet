import { Windows, runtime, windows } from 'webextension-polyfill';

import { redactUrlQuery } from '@background/redact-url-query';

// Every page a `?requestId=` can legitimately reach. `popup.html` never carries
// one today, but it is `use-ledger.ts`'s default `domain` and none of these is
// web-accessible, so listing it costs nothing and fails toward keeping.
const REQUEST_BEARING_PATHNAMES = new Set([
  '/signature-request.html',
  '/connect-to-app.html',
  '/popup.html'
]);

/**
 * Every `requestId` currently displayed by a tab at one of this extension's own
 * `REQUEST_BEARING_PATHNAMES`, or `null` if the enumeration failed. Never
 * collapse `null` into an empty set: the caller deletes signing payloads on
 * this reading, and deleting on no evidence takes the transaction away from an
 * approval window that is on screen.
 *
 * A tab counts only when its scheme, its host AND its pathname match.
 * `requestId` is dapp-chosen and `sdk.bundle.js` is web-accessible under this
 * extension's own origin, so an origin-only test would let a page hold every
 * payload slot open with `?requestId=` values of its choosing.
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
        // One unparseable tab must not turn the whole reading into no evidence,
        // but a silent skip purges a live request with nothing pointing here.
        console.error(
          'collectRequestIdsFromOpenWindows: could not parse a tab url',
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
