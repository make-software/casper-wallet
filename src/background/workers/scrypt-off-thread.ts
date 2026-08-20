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

    worker.onmessage = (
      event: MessageEvent<ScryptResult | { error: true }>
    ) => {
      worker.terminate();

      if (isWorkerError(event.data)) {
        reject(Error('Key derivation failed'));
        return;
      }

      resolve(event.data.key);
    };

    worker.onerror = () => {
      worker.terminate();
      reject(Error('Key derivation failed'));
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
