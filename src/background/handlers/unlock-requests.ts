import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { randomBytes, utf8ToBytes } from '@noble/hashes/utils';

import { LOGIN_RETRY_ATTEMPTS_LIMIT } from '@src/constants';

import { broadcastPopupState } from '@background/redux/broadcast-popup-state';
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
  deriveScryptKey,
  verifyPasswordOffThread
} from '@background/workers/scrypt-off-thread';

import {
  constantTimeEqualHex,
  generateRandomSaltHex
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

/**
 * Keyed on a secret generated for this process, so the stored digest is not a
 * brute-force oracle for anyone who reads it without also reading this key.
 * Never persist this.
 */
const memoDigestKey = randomBytes(32);

export function digestPassword(password: string): string {
  return convertBytesToHex(hmac(sha256, memoDigestKey, utf8ToBytes(password)));
}

const MEMO_LIMIT = 8;

// Bounds how long a verdict can be replayed; must outlive the page's retry
// window for a dropped response (background-port.ts: +250, +500ms).
const MEMO_TTL_MS = 10_000;

interface MemoEntry {
  passwordDigest: string;
  result: Promise<UnlockResult>;
  createdAt: number;
}

/**
 * Keyed on `${type}:${attemptId}` AND a digest of the password: the id is
 * caller-chosen, so replaying a verdict for another password, or a VERIFY verdict
 * for an UNLOCK, would answer without deriving or dispatching `unlockVault`.
 * Holds the in-flight promise so a retry replays rather than counting an attempt.
 */
const memo = new Map<string, MemoEntry>();

/**
 * One derivation at a time, process-wide: concurrent scrypt runs (~256MB each)
 * would OOM the service worker, and serialised the same burst is just attempts
 * that hit the lockout.
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
  passwordDigest: string,
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
  const entry: MemoEntry = { passwordDigest, result, createdAt: Date.now() };
  memo.set(memoKey, entry);

  // Re-stamp once the verdict exists: measured from enqueue, a request that sat
  // queued would miss the caller's retry, re-derive, and count one attempt twice.
  const stamp = () => {
    entry.createdAt = Date.now();
  };
  result.then(stamp, stamp);
}

async function runUnlock(
  type: string,
  password: string,
  store: MainStore
): Promise<UnlockResult> {
  const release = anchorServiceWorker('unlock');

  try {
    const state = store.getState();

    // Derivations are serialised, so the lockout can have been armed while this
    // request sat queued — check before starting the expensive derivation.
    if (selectHasLoginRetryLockoutTime(state)) {
      return { status: 'lockedOut' };
    }

    const passwordHash = selectPasswordHash(state);
    const passwordSaltHash = selectPasswordSaltHash(state);

    if (passwordHash == null || passwordSaltHash == null) {
      throw Error('No password is set');
    }

    const isCorrect = await verifyPasswordOffThread(
      passwordHash,
      passwordSaltHash,
      password
    );

    if (!isCorrect) {
      store.dispatch(loginRetryCountIncremented());
      // Re-read the COUNT, not the lockout flag: the answer must not depend on
      // when the saga arming the lockout lands relative to this handler.
      const count = selectLoginRetryCount(store.getState());

      return count >= LOGIN_RETRY_ATTEMPTS_LIMIT
        ? { status: 'lockedOut' }
        : { status: 'wrong', attemptsLeft: LOGIN_RETRY_ATTEMPTS_LIMIT - count };
    }

    // The lockout can have been armed while this request sat queued; re-check
    // before acting on a now-stale `isCorrect`.
    if (selectHasLoginRetryLockoutTime(store.getState())) {
      return { status: 'lockedOut' };
    }

    if (type === UNLOCK_REQUEST_TYPE) {
      const { keys, vaultCipher } = store.getState();

      if (keys.keyDerivationSaltHash == null || vaultCipher == null) {
        throw Error('No vault to unlock');
      }

      const encryptionKeyHash = convertBytesToHex(
        await deriveScryptKey(password, keys.keyDerivationSaltHash)
      );
      const vault = await decryptVault(encryptionKeyHash, vaultCipher);

      const newKeyDerivationSaltHash = generateRandomSaltHex();
      const newEncryptionKeyHash = convertBytesToHex(
        await deriveScryptKey(password, newKeyDerivationSaltHash)
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
    // The broadcast is what unmounts the page; without one here a dropped
    // broadcast is unrecoverable, as the retry lands here and dispatches nothing.
    broadcastPopupState(state);
    return { status: 'ok' };
  }

  // Before the memo lookup, so a memo can never be a path past a live lockout.
  if (selectHasLoginRetryLockoutTime(state)) {
    return { status: 'lockedOut' };
  }

  const memoKey = `${request.type}:${attemptId}`;
  const passwordDigest = digestPassword(password);
  const cached = memo.get(memoKey);
  if (cached != null) {
    if (Date.now() - cached.createdAt > MEMO_TTL_MS) {
      memo.delete(memoKey);
    } else if (constantTimeEqualHex(cached.passwordDigest, passwordDigest)) {
      return cached.result;
    }
  }

  const result = serialise(() => runUnlock(request.type, password, store));
  remember(memoKey, passwordDigest, result);

  return result;
}
