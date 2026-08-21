import { encodePassword } from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';

import { isWorkerError } from './types';

const SALT = '00'.repeat(32);

type Posted = { key?: Uint8Array; error?: true };

/**
 * The worker installs a global `onmessage` and answers through a global
 * `postMessage`. Nothing else executes this file — the offload wrapper's tests
 * drive a hand-written fake — so without this the two sides of the message
 * contract are never checked against each other.
 */
async function runWorker(data: { password: string; saltHash: string }) {
  const posted: Posted[] = [];
  const globals = globalThis as unknown as {
    postMessage: (message: Posted) => void;
    onmessage: ((event: { data: unknown }) => Promise<void>) | null;
  };
  globals.postMessage = message => posted.push(message);

  jest.resetModules();
  await import('./scrypt-worker');

  await globals.onmessage?.({ data });

  return posted;
}

afterEach(() => {
  const globals = globalThis as unknown as Record<string, unknown>;
  delete globals.postMessage;
  delete globals.onmessage;
  jest.resetModules();
});

it('answers with the { key } envelope the wrapper unwraps', async () => {
  const posted = await runWorker({ password: 'pass', saltHash: SALT });

  expect(posted).toHaveLength(1);
  // A bare `postMessage(key)` also "works" until the wrapper reads `.key` and
  // gets undefined — which breaks unlock, verify, onboarding and change-password
  // together on the MV2 builds.
  expect(isWorkerError(posted[0])).toBe(false);
  expect(posted[0].key).toHaveLength(32);
});

it('derives the same key the hashing module would', async () => {
  const posted = await runWorker({ password: 'pass', saltHash: SALT });

  expect(convertBytesToHex(posted[0].key as Uint8Array)).toBe(
    await encodePassword('pass', SALT)
  );
});

it('reports failure as a message, since an async onmessage rejection raises no error event', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => undefined);

  // `convertHexToBytes` truncates a bad salt rather than throwing, so the
  // failure has to come from the derivation itself.
  const posted = await runWorker({
    password: 42 as unknown as string,
    saltHash: SALT
  });

  expect(posted).toHaveLength(1);
  expect(isWorkerError(posted[0])).toBe(true);
});
