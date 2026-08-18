import { Page } from '@playwright/test';

export const DISPATCH_FAILED =
  "The wallet didn't respond. Your last action may not have been applied.";
export const WINDOW_FAILED = "Couldn't open the window. Please try again.";

// Breaks this page's transport to the background, and only this page's.
//
// A rejected promise, not a synchronous throw: current Chrome exposes `browser`
// natively, so `webextension-polyfill` re-exports it instead of wrapping
// `chrome`, and the app therefore calls this function directly. A `throw` here
// is handled — `dispatchToMainStore` calls `sendMessage` inside a `then` — but a
// rejection is the shape a sleeping service worker actually produces, which is
// what this feature is about.
//
// Stopping the service worker would not reproduce it either: in MV3 an incoming
// message is itself the event that cold-starts a stopped worker, and while the
// vault is unlocked the keep-alive alarm wakes it within 30s anyway.
//
// `onlyTypes` narrows the break to those action types and lets everything else
// through. Some flows put non-redux sends on the same transport — the import
// page's `checkAccountNameIsTaken` runs in submit-time validation and
// `checkSecretKeyExist` inside the file reader, neither through
// `dispatchToMainStore` — so breaking the whole transport stops the flow before
// the dispatch under test is ever reached. Pass the type to aim at the seam.
export async function breakTransport(page: Page, onlyTypes: string[] = []) {
  await page.evaluate(types => {
    const { runtime } = (
      window as unknown as {
        chrome: {
          runtime: {
            sendMessage: (...args: unknown[]) => Promise<unknown>;
          };
        };
      }
    ).chrome;

    const send = runtime.sendMessage.bind(runtime);

    runtime.sendMessage = (...args: unknown[]) => {
      const type = (args[0] as { type?: string } | undefined)?.type;

      if (types.length > 0 && (type === undefined || !types.includes(type))) {
        return send(...args);
      }

      return Promise.reject(new Error('e2e: forced transport failure'));
    };
  }, onlyTypes);
}

export async function breakWindowCreation(page: Page) {
  await page.evaluate(() => {
    (
      window as unknown as {
        chrome: { windows: { create: () => Promise<never> } };
      }
    ).chrome.windows.create = () =>
      Promise.reject(new Error('e2e: forced window failure'));
  });
}
