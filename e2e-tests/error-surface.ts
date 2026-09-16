import { Page } from '@playwright/test';

export const DISPATCH_FAILED =
  "The wallet didn't respond. Your last action may not have been applied.";
export const WINDOW_FAILED = "Couldn't open the window. Please try again.";

// Breaks this page's transport to the background, and only this page's; it
// rejects rather than throws, and `onlyTypes` narrows the break to those types.
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
