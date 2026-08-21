import { BrowserContext, Page } from '@playwright/test';

const GENERATION_KEY = '__casperWorkerGeneration';

const STOP_TIMEOUT_MS = 15000;

function currentWorker(context: BrowserContext) {
  const worker = context.serviceWorkers()[0];

  if (!worker) {
    throw new Error('No extension service worker is registered.');
  }

  return worker;
}

/**
 * Stamps a token on the running worker's global scope. It dies with the worker,
 * so a later read that no longer returns it is proof the worker really restarted
 * — which `context.serviceWorkers()` cannot give: the list keeps its entry
 * across a stop, and `Worker.evaluate` keeps answering because the evaluate
 * itself starts a fresh worker.
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
 * Terminates the extension's MV3 service worker. There is no Playwright API for
 * it — `Worker` has no `close()` — so it goes over CDP; `stopAllWorkers` is
 * global despite being sent on a page session, so the page it is sent from does
 * not matter.
 *
 * Resolution waits for the worker's own `stopped` transition rather than
 * polling it. Polling would be self-defeating: every probe that touches the
 * worker starts it again, and a caller that needs it to STAY dead would be the
 * one waking it.
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
