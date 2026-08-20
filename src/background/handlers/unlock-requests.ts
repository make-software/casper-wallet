import { LOGIN_RETRY_ATTEMPTS_LIMIT } from '@src/constants';

import { MainStore } from '@background/redux/get-main-store';
import {
  selectPasswordHash,
  selectPasswordSaltHash
} from '@background/redux/keys/selectors';
import {
  loginRetryCountIncremented,
  loginRetryCountReseted
} from '@background/redux/login-retry-count/actions';
import { selectLoginRetryCount } from '@background/redux/login-retry-count/selectors';
import { selectHasLoginRetryLockoutTime } from '@background/redux/login-retry-lockout-time/selectors';
import { unlockVault } from '@background/redux/sagas/actions';
import { selectVaultIsLocked } from '@background/redux/session/selectors';
import { anchorServiceWorker } from '@background/sw-keep-alive-anchor';

import {
  deriveEncryptionKey,
  generateRandomSaltHex,
  verifyPasswordAgainstHash
} from '@libs/crypto/hashing';
import { convertBytesToHex } from '@libs/crypto/utils';
import { decryptVault, encryptVault } from '@libs/crypto/vault';

import { normaliseDecryptedVault } from './vault-normalisation';

export const VERIFY_PASSWORD_REQUEST_TYPE = 'VERIFY_PASSWORD_REQUEST' as const;
export const UNLOCK_REQUEST_TYPE = 'UNLOCK_REQUEST' as const;

export type UnlockResult =
  | { status: 'ok' }
  | { status: 'wrong'; attemptsLeft: number }
  | { status: 'lockedOut' }
  | { status: 'error' };

const MEMO_LIMIT = 8;

// Bounds how long a verdict can be replayed — not how long an entry stays in
// memory (only FIFO eviction or a lookup on that exact key does that). Must
// outlive the page's own retry window for a dropped response
// (background-port.ts retries at +250ms, then +500ms).
const MEMO_TTL_MS = 10_000;

interface MemoEntry {
  password: string;
  result: Promise<UnlockResult>;
  createdAt: number;
}

/**
 * Keyed on `${type}:${attemptId}` AND the password: the id is caller-chosen, so
 * replaying a verdict for a different password could answer a correct password
 * `wrong`, and replaying a VERIFY verdict for an UNLOCK with the same id would
 * report `ok` without ever dispatching `unlockVault`. Holds the in-flight
 * promise, not just the settled value, so a reconnect awaits the first
 * derivation instead of starting a second one that counts again — and a retry
 * that lands AFTER settlement (the actual `background-port.ts` retry case, once
 * the response itself was dropped) replays the same verdict instead of
 * deriving — and counting — a second time. Entries expire lazily on lookup
 * (see `MEMO_TTL_MS`) rather than being deleted on settlement.
 */
const memo = new Map<string, MemoEntry>();

/**
 * One derivation at a time, process-wide. Without this a single compromised
 * allowed page can start many concurrent scrypt runs (~256MB each) and OOM the
 * service worker; serialised, the same burst is just attempts that hit the
 * lockout.
 */
let derivationQueue: Promise<unknown> = Promise.resolve();

function serialise<T>(work: () => Promise<T>): Promise<T> {
  const next = derivationQueue.then(work, work);
  derivationQueue = next.catch(() => undefined);
  return next;
}

function isUnlockPayload(
  payload: unknown
): payload is { password: string; attemptId: string } {
  if (payload == null || typeof payload !== 'object') {
    return false;
  }

  const p = payload as Partial<{ password: string; attemptId: string }>;
  return typeof p.password === 'string' && typeof p.attemptId === 'string';
}

function remember(
  memoKey: string,
  password: string,
  result: Promise<UnlockResult>
) {
  if (memo.size >= MEMO_LIMIT) {
    // Map iterates in insertion order, so this is the oldest entry; size >=
    // MEMO_LIMIT (> 0) guarantees at least one.
    for (const key of memo.keys()) {
      memo.delete(key);
      break;
    }
  }
  memo.set(memoKey, { password, result, createdAt: Date.now() });
}

async function runUnlock(
  type: string,
  password: string,
  store: MainStore
): Promise<UnlockResult> {
  const release = anchorServiceWorker('unlock');

  try {
    const state = store.getState();

    // Derivations are serialised, so a request may have sat queued behind
    // another window's failed attempts arming the lockout in the meantime —
    // check before starting the (expensive) derivation, not just after it.
    if (selectHasLoginRetryLockoutTime(state)) {
      return { status: 'lockedOut' };
    }

    const passwordHash = selectPasswordHash(state);
    const passwordSaltHash = selectPasswordSaltHash(state);

    if (passwordHash == null || passwordSaltHash == null) {
      throw Error('No password is set');
    }

    const isCorrect = await verifyPasswordAgainstHash(
      passwordHash,
      passwordSaltHash,
      password
    );

    if (!isCorrect) {
      store.dispatch(loginRetryCountIncremented());
      // Re-read the COUNT, not the lockout flag: the answer must not depend on
      // when the saga that arms the lockout in response to the increment has
      // put its result relative to this handler.
      const count = selectLoginRetryCount(store.getState());

      return count >= LOGIN_RETRY_ATTEMPTS_LIMIT
        ? { status: 'lockedOut' }
        : { status: 'wrong', attemptsLeft: LOGIN_RETRY_ATTEMPTS_LIMIT - count };
    }

    // Derivations are serialised, so this request may have sat queued behind
    // another window's failed attempts arming the lockout in the meantime.
    // Re-check before acting on a now-stale `isCorrect`, on both paths.
    if (selectHasLoginRetryLockoutTime(store.getState())) {
      return { status: 'lockedOut' };
    }

    if (type === UNLOCK_REQUEST_TYPE) {
      const { keys, vaultCipher } = store.getState();

      if (keys.keyDerivationSaltHash == null || vaultCipher == null) {
        throw Error('No vault to unlock');
      }

      const encryptionKeyHash = convertBytesToHex(
        await deriveEncryptionKey(password, keys.keyDerivationSaltHash)
      );
      const vault = await decryptVault(encryptionKeyHash, vaultCipher);

      const newKeyDerivationSaltHash = generateRandomSaltHex();
      const newEncryptionKeyHash = convertBytesToHex(
        await deriveEncryptionKey(password, newKeyDerivationSaltHash)
      );
      const newVaultCipher = await encryptVault(newEncryptionKeyHash, vault);

      store.dispatch(
        unlockVault({
          vault: normaliseDecryptedVault(vault),
          newKeyDerivationSaltHash,
          newVaultCipher,
          newEncryptionKeyHash
        })
      );

      // unlockVaultSaga resets the counter itself on this path.
      return { status: 'ok' };
    }

    store.dispatch(loginRetryCountReseted());
    return { status: 'ok' };
  } finally {
    release();
  }
}

export async function handleUnlockRequest(
  request: { type: string; payload?: unknown },
  store: MainStore
): Promise<UnlockResult | null> {
  if (
    request.type !== VERIFY_PASSWORD_REQUEST_TYPE &&
    request.type !== UNLOCK_REQUEST_TYPE
  ) {
    return null;
  }

  if (!isUnlockPayload(request.payload)) {
    return { status: 'error' };
  }

  const { password, attemptId } = request.payload;
  const state = store.getState();

  // Nothing to unlock, and no password was verified — do NOT touch the counter.
  if (request.type === UNLOCK_REQUEST_TYPE && !selectVaultIsLocked(state)) {
    return { status: 'ok' };
  }

  // Before the memo lookup, so a memo can never be a path past a live lockout.
  if (selectHasLoginRetryLockoutTime(state)) {
    return { status: 'lockedOut' };
  }

  // Keyed by type as well as attemptId: a VERIFY_PASSWORD_REQUEST verdict must
  // never be replayed to answer an UNLOCK_REQUEST (or vice versa) sharing the
  // same caller-chosen id — an UNLOCK replayed from a VERIFY's `ok` would report
  // success without ever dispatching `unlockVault`.
  const memoKey = `${request.type}:${attemptId}`;
  const cached = memo.get(memoKey);
  if (cached != null) {
    if (Date.now() - cached.createdAt > MEMO_TTL_MS) {
      memo.delete(memoKey);
    } else if (cached.password === password) {
      return cached.result;
    }
  }

  const result = serialise(() => runUnlock(request.type, password, store));
  remember(memoKey, password, result);

  return result;
}
