import { BrowserContext, Page } from '@playwright/test';

const GENERATION_KEY = '__casperWorkerGeneration';

const STOP_TIMEOUT_MS = 15000;

function currentWorker(context: BrowserContext) {
  // Index 0 is not necessarily the extension: other registered workers can share
  // the context, and their position in the list is not guaranteed.
  const worker = context
    .serviceWorkers()
    .find(w => w.url().startsWith('chrome-extension://'));

  if (!worker) {
    throw new Error('No extension service worker is registered.');
  }

  return worker;
}

/**
 * Stamps a token on the running worker's global scope. It dies with the worker, so
 * a later read that no longer returns it is proof the worker really restarted —
 * which `context.serviceWorkers()` cannot give: its entry survives a stop.
 */
export async function markServiceWorker(
  context: BrowserContext
): Promise<string> {
  const token = `gen-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await currentWorker(context).evaluate(
    ([key, value]) => {
      (self as unknown as Record<string, string>)[key] = value;
    },
    [GENERATION_KEY, token]
  );

  return token;
}

/** The token from `markServiceWorker`, or undefined once the worker restarted. */
export async function readServiceWorkerMark(
  context: BrowserContext
): Promise<string | undefined> {
  try {
    return await currentWorker(context).evaluate(
      key => (self as unknown as Record<string, string | undefined>)[key],
      GENERATION_KEY
    );
  } catch {
    return undefined;
  }
}

/**
 * Terminates the extension's MV3 service worker over CDP — `Worker` has no
 * `close()`, and `stopAllWorkers` is global, so the page it is sent from does not
 * matter. Resolution waits for the worker's own `stopped` transition: every probe
 * that polls the worker would start it again.
 */
export async function stopServiceWorker(
  context: BrowserContext,
  page: Page
): Promise<void> {
  const scriptUrl = currentWorker(context).url();
  const client = await context.newCDPSession(page);

  const stopped = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Service worker did not report a stop.'));
    }, STOP_TIMEOUT_MS);

    client.on('ServiceWorker.workerVersionUpdated', ({ versions }) => {
      const isStopped = versions.some(
        version =>
          version.scriptURL === scriptUrl && version.runningStatus === 'stopped'
      );

      if (isStopped) {
        clearTimeout(timer);
        resolve();
      }
    });
  });

  await client.send('ServiceWorker.enable');
  await client.send('ServiceWorker.stopAllWorkers');

  try {
    await stopped;
  } finally {
    await client.detach();
  }
}
