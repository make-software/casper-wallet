import { Windows, runtime, windows } from 'webextension-polyfill';

// Matches open-window.ts: a browser error message is unbounded.
const MAX_LOGGED_ERROR_LENGTH = 200;

// A `signMessage` approval URL carries the user's plaintext message as a search
// param, and a windows-API rejection can quote the URL it failed on.
function redactUrlQuery(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  return message.split('?')[0].slice(0, MAX_LOGGED_ERROR_LENGTH);
}

/**
 * Every `requestId` currently displayed by a browser window, or `null` if the
 * enumeration failed. Never collapse `null` into an empty set: the caller
 * deletes signing payloads on this reading, and deleting on no evidence takes
 * the transaction away from an approval window that is on screen.
 *
 * Only this extension's own pages are read. `requestId` is dapp-chosen, so
 * without the origin test any page could pin a slot forever by putting a
 * `?requestId=` of its choosing in its own URL.
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
  const extensionUrlPrefix = runtime.getURL('');

  for (const browserWindow of allWindows) {
    for (const tab of browserWindow.tabs ?? []) {
      // `pendingUrl` (Chrome-only) is set while `url` is still empty.
      const url = tab.url || tab.pendingUrl;

      if (!url || !url.startsWith(extensionUrlPrefix)) {
        continue;
      }

      let requestId: string | null;

      try {
        requestId = new URL(url).searchParams.get('requestId');
      } catch {
        // One unparseable tab must not turn the whole reading into no evidence.
        continue;
      }

      if (requestId) {
        requestIds.add(requestId);
      }
    }
  }

  return requestIds;
}
