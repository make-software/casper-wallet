import { scryptAsync } from '@noble/hashes/scrypt';

import {
  constantTimeEqualHex,
  createScryptOptions
} from '@libs/crypto/hashing';
import { convertBytesToHex, convertHexToBytes } from '@libs/crypto/utils';

import { spawnScryptWorker } from './spawn-scrypt-worker';
import { isWorkerError } from './types';

// `scryptAsync` awaits an empty promise between blocks, which queues a microtask
// and never returns to the event loop, so a derivation blocks its thread for its
// whole duration. On the MV2 builds the background is a persistent page sharing
// the popup's thread, so that freezes the UI; a Worker moves it off. MV3 service
// workers have no Worker constructor, but there the background thread is not the
// popup's to begin with.
const canOffloadToWorker = typeof Worker !== 'undefined';

const DERIVATION_TIMEOUT_MS = 30_000;

interface ScryptResult {
  key: Uint8Array;
}

export function deriveScryptKey(
  password: string,
  saltHash: string
): Promise<Uint8Array> {
  if (!canOffloadToWorker) {
    return scryptAsync(
      password,
      convertHexToBytes(saltHash),
      createScryptOptions()
    );
  }

  return new Promise<Uint8Array>((resolve, reject) => {
    const worker = spawnScryptWorker();
    let settled = false;

    const settle = (outcome: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      outcome();
    };

    // `unlock-requests.ts` chains every derivation on one promise, and a promise
    // that stays pending can never be displaced — so a worker that dies without
    // firing `onerror` would wedge the queue until the background restarts. Far
    // above a real derivation (~350ms) and below the port's own 60s, so the
    // caller sees a failed attempt rather than a transport timeout.
    const timer = setTimeout(
      () => settle(() => reject(Error('Key derivation timed out'))),
      DERIVATION_TIMEOUT_MS
    );

    worker.onmessage = (
      event: MessageEvent<ScryptResult | { error: true }>
    ) => {
      settle(() => {
        if (isWorkerError(event.data)) {
          reject(Error('Key derivation failed'));
          return;
        }

        resolve(event.data.key);
      });
    };

    worker.onerror = () => {
      settle(() => reject(Error('Key derivation failed')));
    };

    worker.postMessage({ password, saltHash });
  });
}

export async function encodePasswordOffThread(
  password: string,
  saltHash: string
): Promise<string> {
  return convertBytesToHex(await deriveScryptKey(password, saltHash));
}

export async function verifyPasswordOffThread(
  passwordHash: string,
  passwordSaltHash: string,
  password: string | undefined
): Promise<boolean> {
  const digest = convertBytesToHex(
    await deriveScryptKey(password || '', passwordSaltHash)
  );

  return constantTimeEqualHex(passwordHash, digest);
}
