import { runtime } from 'webextension-polyfill';

/** Only this port name reaches the privileged router; anything else is ignored. */
export const BACKGROUND_PORT_NAME = 'cw-privileged';

/** A disconnect means the message never produced a result — safe to re-send. */
const PORT_RETRY_DELAYS_MS = [250, 500];

/**
 * Liveness backstop. A message delivered before the background attached its
 * listener produces neither a response nor a disconnect, so retry alone cannot
 * see it.
 *
 * Sized for the requests this port is built to carry, not for the one it
 * carries today. `changePassword` is acked as soon as the handler dispatches,
 * ahead of any derivation — but the unlock and verify requests answer only
 * *after* their scrypt, and those derivations are serialised process-wide, so a
 * queued request waits out every one ahead of it. `request-with-retry.ts`'s 5s
 * could not bound that, which is why this is a different order of magnitude.
 */
export const PORT_RESPONSE_TIMEOUT_MS = 60_000;

class PortDisconnectedError extends Error {
  constructor() {
    super('Background port disconnected');
    this.name = 'PortDisconnectedError';
  }
}

interface PortRequest {
  type: string;
  payload?: unknown;
}

function attempt<Res>(request: PortRequest): Promise<Res> {
  return new Promise<Res>((resolve, reject) => {
    let settled = false;
    const port = runtime.connect({ name: BACKGROUND_PORT_NAME });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      port.disconnect();
      reject(new Error('Background port timed out'));
    }, PORT_RESPONSE_TIMEOUT_MS);

    port.onMessage.addListener(message => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      port.disconnect();
      resolve(message as Res);
    });

    port.onDisconnect.addListener(() => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new PortDisconnectedError());
    });

    try {
      port.postMessage(request);
    } catch (error) {
      // Same shape as the two listeners above: without it this exit leaves the
      // timeout armed, holding the closure — and the request's passwords — for
      // its full duration.
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        port.disconnect();
        reject(error);
      }
    }
  });
}

/**
 * One short-lived port per request. Retries only a disconnect-before-response —
 * a timeout is NOT retried, because the request may have already been acted on.
 */
export async function requestOverPort<Res>(request: PortRequest): Promise<Res> {
  let lastError: unknown;

  for (let i = 0; i <= PORT_RETRY_DELAYS_MS.length; i++) {
    if (i > 0) {
      await new Promise(resolve =>
        setTimeout(resolve, PORT_RETRY_DELAYS_MS[i - 1])
      );
    }

    try {
      return await attempt<Res>(request);
    } catch (error) {
      if (!(error instanceof PortDisconnectedError)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
}
