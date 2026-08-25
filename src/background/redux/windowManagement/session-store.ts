import { Storage, storage } from 'webextension-polyfill';

import { isEphemeralBackgroundBuild } from '@src/utils';

import { redactUrlQuery } from '@background/redact-url-query';

import { MAX_RESPONDED_TOMBSTONES } from './reducer';
import { MAX_REQUEST_ID_LENGTH, isStorableRequestId } from './request-map';
import { CancellableMethod, Request, WindowManagementState } from './types';

// Follows the obfuscated `storage.local` convention for consistency only. This
// one is NOT immutable the way those are: `storage.session` is cleared on
// extension reload and update, so no data ever crosses a version boundary and a
// later rename would strand nothing.
export const REQUEST_SESSION_KEY = 'q7Rk2vHs4nTbX';

// What the mirror carries. `exportKeysWindowId` is excluded — a local flow with
// no dapp waiting — and so is `ledger.windowId`, which is memory-only.
export type SessionRecord = {
  requests: WindowManagementState['requests'];
  windowId: number | null;
};

// Write-side row cap: the reducer's tombstone bound plus headroom for the open
// rows that can exist alongside them. The read stays uncapped, so no drop order
// has to be defined there and key hoisting can never decide which rows survive.
const MAX_SESSION_ROWS = MAX_RESPONDED_TOMBSTONES + 20;

const MAX_ORIGIN_LENGTH = 256;
const MAX_WINDOW_IDS = 16;

const emptyRecord = (): SessionRecord => ({ requests: {}, windowId: null });

// The area must stay at Chrome's default `TRUSTED_CONTEXTS` — the map holds
// every dapp origin with a pending or recently answered request, its tab ids
// and live request ids. Nothing calls `setAccessLevel` and nothing should.
//
// Both halves of the gate are required. Firefox 115+ and Safari 16.4+ also have
// the area, but their background pages are `"persistent": true` and lose
// nothing, so a bare feature detect would enable an untested path there; and the
// runtime half is still needed because `@types/webextension-polyfill` declares
// `session` non-optional, so the type lies about availability.
//
// The polyfill exposes the area by pass-through, so this is the raw
// `chrome.storage.session` and its rejections are not polyfill-normalised — a
// catch here must not assume an `Error`.
function sessionAreaOrNull(): Storage.StorageArea | null {
  if (!isEphemeralBackgroundBuild) {
    return null;
  }

  const area: Storage.StorageArea | undefined = storage.session;

  return area ?? null;
}

const isNonNegativeInteger = (raw: unknown): raw is number =>
  typeof raw === 'number' && Number.isInteger(raw) && raw >= 0;

// A `Record` rather than a `Set` so adding a method to the union is a compile
// error here rather than a row the sanitizer silently drops.
const CANCELLABLE_METHODS: Record<CancellableMethod, true> = {
  connect: true,
  switchAccount: true,
  sign: true,
  signMessage: true,
  signTypedData: true,
  decryptMessage: true
};

const isCancellableMethod = (raw: unknown): raw is CancellableMethod =>
  typeof raw === 'string' &&
  Object.prototype.hasOwnProperty.call(CANCELLABLE_METHODS, raw);

const isDeliverableOrigin = (raw: unknown): raw is string => {
  if (typeof raw !== 'string' || raw.length > MAX_ORIGIN_LENGTH) {
    return false;
  }

  try {
    const { protocol } = new URL(raw);

    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

// Total: it drops what it cannot vouch for and never throws — a throw would
// leave the background unable to start at all.
function sanitizeRequest(raw: unknown): Request | undefined {
  if (typeof raw !== 'object' || raw == null) {
    return undefined;
  }

  const row = raw as Record<string, unknown>;
  const seq = row.seq;

  // Required, not optional: the area is cleared on extension update and the
  // ordinal shipped first, so a `seq`-less row cannot exist.
  if (typeof seq !== 'number' || !Number.isInteger(seq)) {
    return undefined;
  }

  if (row.status === 'responded') {
    return { status: 'responded', seq };
  }

  if (row.status !== 'open') {
    return undefined;
  }

  const { tabId, origin, method, windowIds, awaitingDeviceConfirmation } = row;

  if (
    !isNonNegativeInteger(tabId) ||
    !isDeliverableOrigin(origin) ||
    !isCancellableMethod(method) ||
    !Array.isArray(windowIds) ||
    windowIds.length > MAX_WINDOW_IDS ||
    !windowIds.every(isNonNegativeInteger) ||
    typeof awaitingDeviceConfirmation !== 'boolean'
  ) {
    return undefined;
  }

  // `frameId` is kept only when `isNonNegativeInteger` — so `0` (top frame,
  // falsy) survives verbatim — and otherwise omitted, never defaulted, so an
  // absent or malformed (including negative) value degrades to today's
  // unscoped send rather than dropping the row.
  return {
    status: 'open',
    tabId,
    origin,
    method,
    windowIds,
    awaitingDeviceConfirmation,
    seq,
    ...(isNonNegativeInteger(row.frameId) ? { frameId: row.frameId } : {})
  };
}

function sanitizeRequestMap(raw: unknown): WindowManagementState['requests'] {
  if (typeof raw !== 'object' || raw == null || Array.isArray(raw)) {
    return {};
  }

  const requests: WindowManagementState['requests'] = {};

  for (const [requestId, value] of Object.entries(raw)) {
    if (
      !isStorableRequestId(requestId) ||
      requestId.length > MAX_REQUEST_ID_LENGTH
    ) {
      continue;
    }

    const request = sanitizeRequest(value);

    if (request != null) {
      requests[requestId] = request;
    }
  }

  return requests;
}

const sanitizeWindowId = (raw: unknown): number | null =>
  isNonNegativeInteger(raw) ? raw : null;

// Tombstones go before open rows, oldest first by ordinal: a dropped open row
// is a request whose window is on screen, a dropped tombstone only costs a dedup.
function capRows(
  requests: WindowManagementState['requests']
): WindowManagementState['requests'] {
  const rows = Object.entries(requests).flatMap(([requestId, request]) =>
    request == null ? [] : [[requestId, request] as const]
  );
  const overflow = rows.length - MAX_SESSION_ROWS;

  if (overflow <= 0) {
    return requests;
  }

  const dropped = new Set(
    [...rows]
      .sort(
        ([, a], [, b]) =>
          Number(a.status === 'open') - Number(b.status === 'open') ||
          a.seq - b.seq
      )
      .slice(0, overflow)
      .map(([requestId]) => requestId)
  );

  return Object.fromEntries(
    rows.filter(([requestId]) => !dropped.has(requestId))
  );
}

/**
 * The mirrored record, or the empty one on a missing area, a rejected read or
 * unparseable content. Never throws.
 */
export async function readRequestSession(): Promise<SessionRecord> {
  const area = sessionAreaOrNull();

  if (area == null) {
    return emptyRecord();
  }

  try {
    const stored = await area.get(REQUEST_SESSION_KEY);
    const record = stored?.[REQUEST_SESSION_KEY] as unknown;

    if (typeof record !== 'object' || record == null) {
      return emptyRecord();
    }

    const { requests, windowId } = record as Record<string, unknown>;

    return {
      requests: sanitizeRequestMap(requests),
      windowId: sanitizeWindowId(windowId)
    };
  } catch (error) {
    console.error('Read request mirror failed: ', redactUrlQuery(error));

    return emptyRecord();
  }
}

// Writes are serialised: two in-flight `set` calls have no documented landing
// order, and an older one landing last leaves a STALE mirror — the unsafe
// direction. The snapshot is taken at flush, so a superseded one is skipped.
let pendingRecord: SessionRecord | null = null;
let flushQueued = false;
let writeChain: Promise<void> = Promise.resolve();

// Must never reject: `writeChain.then(flush)` would skip every later flush
// forever. Both catches therefore live inside it, never attached to the chain.
async function flush(area: Storage.StorageArea): Promise<void> {
  const record = pendingRecord;

  pendingRecord = null;
  flushQueued = false;

  if (record == null) {
    return;
  }

  try {
    await area.set({
      [REQUEST_SESSION_KEY]: {
        requests: capRows(record.requests),
        windowId: record.windowId
      }
    });
  } catch (error) {
    console.error('Persist request mirror failed: ', redactUrlQuery(error));

    try {
      // Degrade to absent, which behaves exactly like today. A stale mirror
      // does not. `remove` can reject too, hence the second catch.
      await area.remove(REQUEST_SESSION_KEY);
    } catch {
      // Nothing left to try.
    }
  }
}

export function writeRequestSession(record: SessionRecord): Promise<void> {
  const area = sessionAreaOrNull();

  if (area == null) {
    return Promise.resolve();
  }

  pendingRecord = record;

  if (!flushQueued) {
    flushQueued = true;
    writeChain = writeChain.then(() => flush(area));
  }

  return writeChain;
}
