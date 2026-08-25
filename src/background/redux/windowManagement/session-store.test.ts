import { MAX_OPEN_REQUESTS, MAX_RESPONDED_TOMBSTONES } from './reducer';
import {
  MAX_SESSION_ROWS,
  REQUEST_SESSION_KEY,
  SessionRecord,
  clearRequestSession,
  readRequestSession,
  writeRequestSession
} from './session-store';
import { Request } from './types';

// `isEphemeralBackgroundBuild` is FALSE under jest: `npm test` sets no BROWSER
// and DefinePlugin is webpack-only. Without this mock every case below would
// exercise the disabled path and pass while asserting nothing.
let mockIsEphemeralBackgroundBuild = true;

jest.mock('@src/utils', () => ({
  get isEphemeralBackgroundBuild() {
    return mockIsEphemeralBackgroundBuild;
  }
}));

const sessionGet = jest.fn<Promise<Record<string, unknown>>, [unknown]>();
const sessionSet = jest.fn<Promise<void>, [unknown]>();
const sessionRemove = jest.fn<Promise<void>, [unknown]>();

// The area itself is swappable: `@types/webextension-polyfill` declares
// `session` non-optional, so "the browser has no session area" is a state only
// the runtime can be in.
let mockSessionArea: unknown = {
  get: (...args: unknown[]) => sessionGet(...(args as [unknown])),
  set: (...args: unknown[]) => sessionSet(...(args as [unknown])),
  remove: (...args: unknown[]) => sessionRemove(...(args as [unknown]))
};

jest.mock('webextension-polyfill', () => ({
  storage: {
    get session() {
      return mockSessionArea;
    }
  }
}));

const openRow = (overrides: Record<string, unknown> = {}) => ({
  status: 'open',
  tabId: 7,
  origin: 'https://dapp.example',
  method: 'sign',
  windowIds: [11],
  awaitingDeviceConfirmation: false,
  seq: 0,
  ...overrides
});

const storedRecord = (record: unknown) => ({ [REQUEST_SESSION_KEY]: record });

const lastWrittenRecord = (): SessionRecord => {
  const [written] = sessionSet.mock.calls[sessionSet.mock.calls.length - 1];

  return (written as Record<string, SessionRecord>)[REQUEST_SESSION_KEY];
};

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mockIsEphemeralBackgroundBuild = true;
  mockSessionArea = {
    get: (...args: unknown[]) => sessionGet(...(args as [unknown])),
    set: (...args: unknown[]) => sessionSet(...(args as [unknown])),
    remove: (...args: unknown[]) => sessionRemove(...(args as [unknown]))
  };
  sessionGet.mockResolvedValue({});
  sessionSet.mockResolvedValue(undefined);
  sessionRemove.mockResolvedValue(undefined);
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe('session-store — the gate', () => {
  it('reads and writes nothing on a persistent-background build', async () => {
    mockIsEphemeralBackgroundBuild = false;

    await expect(readRequestSession()).resolves.toEqual({
      requests: {},
      windowId: null
    });
    await writeRequestSession({
      requests: { a: openRow() as Request },
      windowId: 3
    });

    expect(sessionGet).not.toHaveBeenCalled();
    expect(sessionSet).not.toHaveBeenCalled();
  });

  it('reads and writes nothing when the runtime has no session area', async () => {
    mockSessionArea = undefined;

    await expect(readRequestSession()).resolves.toEqual({
      requests: {},
      windowId: null
    });
    await writeRequestSession({ requests: {}, windowId: 3 });

    expect(sessionSet).not.toHaveBeenCalled();
  });

  it('reads and writes when the build is ephemeral and the area exists', async () => {
    sessionGet.mockResolvedValue(
      storedRecord({ requests: { 'req-1': openRow() }, windowId: 3 })
    );

    await expect(readRequestSession()).resolves.toEqual({
      requests: { 'req-1': openRow() },
      windowId: 3
    });

    await writeRequestSession({ requests: {}, windowId: 3 });

    expect(sessionSet).toHaveBeenCalledTimes(1);
  });
});

describe('session-store — read path', () => {
  it('returns the empty record when the key is absent', async () => {
    sessionGet.mockResolvedValue({});

    await expect(readRequestSession()).resolves.toEqual({
      requests: {},
      windowId: null
    });
  });

  it('returns the empty record, and never throws, when the read rejects', async () => {
    sessionGet.mockRejectedValue('not an Error — the area is not polyfilled');

    await expect(readRequestSession()).resolves.toEqual({
      requests: {},
      windowId: null
    });
  });

  it.each([
    ['a non-object payload', 'nope'],
    ['null', null],
    ['an array', ['a']]
  ])('drops %s wholesale', async (_label, record) => {
    sessionGet.mockResolvedValue(storedRecord(record));

    await expect(readRequestSession()).resolves.toEqual({
      requests: {},
      windowId: null
    });
  });

  // `typeof record !== 'object' || record == null` is deletable and the VALUE
  // above still passes: destructuring `null` without the guard throws, which
  // the outer `catch` swallows into the same `emptyRecord()`. The only
  // observable difference is the catch's side effect — it LOGS. (A string
  // like 'nope' would not distinguish this: object-destructuring a primitive
  // string does not throw, so its result is identical with or without the
  // guard.)
  it('returns the empty record for a null session record without logging', async () => {
    sessionGet.mockResolvedValue(storedRecord(null));

    await expect(readRequestSession()).resolves.toEqual({
      requests: {},
      windowId: null
    });
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('drops a non-object requests map to {} without touching windowId', async () => {
    sessionGet.mockResolvedValue(
      storedRecord({ requests: ['not', 'a', 'map'], windowId: 4 })
    );

    await expect(readRequestSession()).resolves.toEqual({
      requests: {},
      windowId: 4
    });
  });

  it('drops an array of otherwise-valid rows to {}, not index-keyed entries', async () => {
    // Every element here individually passes `sanitizeRequest`, so this is
    // blind to the `Array.isArray` guard specifically: without it,
    // `Object.entries` on an array hydrates as `{'0': …, '1': …}` instead of
    // `{}`.
    sessionGet.mockResolvedValue(
      storedRecord({ requests: [openRow(), openRow()], windowId: null })
    );

    await expect(readRequestSession()).resolves.toEqual({
      requests: {},
      windowId: null
    });
  });

  it.each([
    ['a non-integer', 1.5],
    ['a string', '4'],
    ['undefined', undefined],
    ['negative', -1]
  ])('nulls a windowId that is %s', async (_label, windowId) => {
    sessionGet.mockResolvedValue(storedRecord({ requests: {}, windowId }));

    expect((await readRequestSession()).windowId).toBeNull();
  });

  it('keeps a tombstone row', async () => {
    sessionGet.mockResolvedValue(
      storedRecord({
        requests: { 'req-1': { status: 'responded', seq: 4 } },
        windowId: null
      })
    );

    expect((await readRequestSession()).requests).toEqual({
      'req-1': { status: 'responded', seq: 4 }
    });
  });
});

describe('session-store — frameId', () => {
  it('keeps frameId 0 (top frame) verbatim through hydration', async () => {
    sessionGet.mockResolvedValue(
      storedRecord({
        requests: { 'req-1': openRow({ frameId: 0 }) },
        windowId: null
      })
    );

    expect((await readRequestSession()).requests).toEqual({
      'req-1': openRow({ frameId: 0 })
    });
  });

  it('keeps a positive frameId verbatim through hydration', async () => {
    sessionGet.mockResolvedValue(
      storedRecord({
        requests: { 'req-1': openRow({ frameId: 4 }) },
        windowId: null
      })
    );

    expect((await readRequestSession()).requests).toEqual({
      'req-1': openRow({ frameId: 4 })
    });
  });

  it('leaves frameId absent when the stored row has none', async () => {
    sessionGet.mockResolvedValue(
      storedRecord({ requests: { 'req-1': openRow() }, windowId: null })
    );

    const { requests } = await readRequestSession();

    expect(requests).toEqual({ 'req-1': openRow() });
    expect('frameId' in (requests['req-1'] as object)).toBe(false);
  });

  it.each([
    ['a stringified frameId', '1'],
    ['a fractional frameId', 1.5],
    ['a negative frameId', -1],
    ['null', null]
  ])(
    'drops the frameId field but keeps the row for %s',
    async (_label, frameId) => {
      sessionGet.mockResolvedValue(
        storedRecord({
          requests: { 'req-1': openRow({ frameId }) },
          windowId: null
        })
      );

      const { requests } = await readRequestSession();

      expect(requests).toEqual({ 'req-1': openRow() });
      expect('frameId' in (requests['req-1'] as object)).toBe(false);
    }
  );
});

describe('session-store — the sanitizer drops only the row it cannot vouch for', () => {
  const survivingRow = openRow({ seq: 9 });

  const cases: [string, Record<string, unknown>][] = [
    ['a bogus status', openRow({ status: 'pending' })],
    ['a missing seq', openRow({ seq: undefined })],
    ['a fractional seq', openRow({ seq: 1.5 })],
    ['a stringified seq', openRow({ seq: '1' })],
    ['a negative tabId', openRow({ tabId: -1 })],
    ['a fractional tabId', openRow({ tabId: 1.5 })],
    ['a stringified tabId', openRow({ tabId: '7' })],
    ['a null tabId', openRow({ tabId: null })],
    ['a non-http origin', openRow({ origin: 'chrome-extension://abc/x.html' })],
    // Interpolated so eslint's `no-script-url` does not flag the literal.
    ['a script-url origin', openRow({ origin: `javascript:${'alert(1)'}` })],
    ['an unparseable origin', openRow({ origin: 'not a url' })],
    [
      'an over-long origin',
      openRow({ origin: `https://${'a'.repeat(300)}.example` })
    ],
    ['an unknown method', openRow({ method: 'transfer' })],
    ['a non-array windowIds', openRow({ windowIds: 11 })],
    ['a non-integer windowIds member', openRow({ windowIds: [11, '12'] })],
    [
      'an over-long windowIds',
      openRow({ windowIds: Array.from({ length: 17 }, (_, i) => i) })
    ],
    [
      'a truthy non-boolean awaitingDeviceConfirmation',
      openRow({ awaitingDeviceConfirmation: 1 })
    ],
    ['a non-object row', 'nope' as unknown as Record<string, unknown>],
    // `typeof null === 'object'`, so this exercises the `raw == null` half of
    // the guard specifically — the `typeof raw !== 'object'` half alone would
    // let a null row through as "an object".
    ['a null row', null as unknown as Record<string, unknown>],
    ['an undefined row', undefined as unknown as Record<string, unknown>]
  ];

  it.each(cases)('drops a row with %s', async (_label, row) => {
    sessionGet.mockResolvedValue(
      storedRecord({
        requests: { bad: row, good: survivingRow },
        windowId: null
      })
    );

    expect((await readRequestSession()).requests).toEqual({
      good: survivingRow
    });
  });

  it('drops a __proto__ key and an over-long key, keeping the rest', async () => {
    sessionGet.mockResolvedValue(
      storedRecord({
        // Computed keys, so `__proto__` is an OWN property rather than the
        // literal's prototype setter.
        requests: {
          ['__proto__']: openRow(),
          ['x'.repeat(257)]: openRow(),
          good: survivingRow
        },
        windowId: null
      })
    );

    const { requests } = await readRequestSession();

    expect(requests).toEqual({ good: survivingRow });
    expect(Object.keys(requests)).toEqual(['good']);
    // `__proto__` must be dropped as a KEY, not assigned — assigning it inside
    // the sanitizer's output builder would set the object's PROTOTYPE instead,
    // silently making every later lookup on this map inherit `openRow()`.
    expect(Object.getPrototypeOf(requests)).toBe(Object.prototype);
  });

  it('keeps awaitingDeviceConfirmation: true and an empty windowIds', async () => {
    const row = openRow({ awaitingDeviceConfirmation: true, windowIds: [] });
    sessionGet.mockResolvedValue(
      storedRecord({ requests: { 'req-1': row }, windowId: null })
    );

    expect((await readRequestSession()).requests).toEqual({ 'req-1': row });
  });
});

// The completeness pin moved to session-store.ts, colocated with
// `sanitizeRequest`'s open-row literal it actually guards — a copy here was
// satisfiable inside the test file alone (add a field to BOTH the pin and a
// hand-maintained runtime list, and the build stays green while the
// sanitizer itself still silently drops it).

describe('session-store — write path', () => {
  it('writes the record under the session key', async () => {
    await writeRequestSession({
      requests: { 'req-1': openRow() as Request },
      windowId: 3
    });

    expect(sessionSet).toHaveBeenCalledWith({
      [REQUEST_SESSION_KEY]: {
        requests: { 'req-1': openRow() },
        windowId: 3
      }
    });
  });

  it('round-trips frameId, including 0, through the write path', async () => {
    await writeRequestSession({
      requests: { 'req-1': openRow({ frameId: 0 }) as Request },
      windowId: 3
    });

    expect(sessionSet).toHaveBeenCalledWith({
      [REQUEST_SESSION_KEY]: {
        requests: { 'req-1': openRow({ frameId: 0 }) },
        windowId: 3
      }
    });
  });

  it('removes the key when the write rejects, so the mirror degrades to absent', async () => {
    sessionSet.mockRejectedValue(new Error('QuotaExceeded'));

    await writeRequestSession({ requests: {}, windowId: 1 });

    expect(sessionRemove).toHaveBeenCalledWith(REQUEST_SESSION_KEY);
  });

  it('swallows a rejecting remove', async () => {
    sessionSet.mockRejectedValue('context invalidated');
    sessionRemove.mockRejectedValue('context invalidated');

    await expect(
      writeRequestSession({ requests: {}, windowId: 1 })
    ).resolves.toBeUndefined();
  });

  it('still lands a write issued after a rejected one — the chain is never poisoned', async () => {
    sessionSet.mockRejectedValueOnce(new Error('QuotaExceeded'));

    await writeRequestSession({ requests: {}, windowId: 1 });
    await writeRequestSession({ requests: {}, windowId: 2 });

    expect(sessionSet).toHaveBeenCalledTimes(2);
    expect(lastWrittenRecord()).toEqual({ requests: {}, windowId: 2 });
  });

  it('lands two rapid writes in order', async () => {
    const first = writeRequestSession({ requests: {}, windowId: 1 });
    await first;
    const second = writeRequestSession({ requests: {}, windowId: 2 });
    await second;

    expect(
      sessionSet.mock.calls.map(
        ([written]) =>
          (written as Record<string, SessionRecord>)[REQUEST_SESSION_KEY]
            .windowId
      )
    ).toEqual([1, 2]);
  });

  it('coalesces same-tick writes onto the newest snapshot', async () => {
    void writeRequestSession({ requests: {}, windowId: 1 });
    await writeRequestSession({ requests: {}, windowId: 2 });

    expect(sessionSet).toHaveBeenCalledTimes(1);
    expect(lastWrittenRecord().windowId).toBe(2);
  });

  it('does not start a queued flush until the in-flight one settles', async () => {
    let resolveA: (() => void) | undefined;
    sessionSet.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          resolveA = resolve;
        })
    );

    const writeA = writeRequestSession({ requests: {}, windowId: 1 });
    // Let flush() run up to its `await area.set(...)` — this is what resets
    // `flushQueued` before A's write has actually landed.
    await Promise.resolve();

    const writeB = writeRequestSession({ requests: {}, windowId: 2 });
    // One more tick: if B's flush were merely CHAINED but not yet started
    // (the real, serialised behaviour), this changes nothing — it is still
    // waiting on A's unresolved `set`. If `writeChain` were rebuilt from a
    // fresh `Promise.resolve()` instead of chained onto the existing one
    // (serialisation lost), B's flush would be a microtask away from running
    // regardless of A — this tick is what lets that difference surface as a
    // second `sessionSet` call, which asserting synchronously right after the
    // `writeB` call cannot see.
    await Promise.resolve();
    // The reset queue only lets B's flush get CHAINED after A's — A's `set`
    // promise is still pending, so B's flush cannot have started yet.
    expect(sessionSet).toHaveBeenCalledTimes(1);

    resolveA?.();
    await writeA;
    await writeB;

    expect(sessionSet).toHaveBeenCalledTimes(2);
    expect(lastWrittenRecord().windowId).toBe(2);
  });

  it('bounds the write cap to exactly what the two request states can hold', () => {
    // A row is either a tombstone or an open request — no third state — so the
    // sum of their individual caps is the only correct figure, not headroom
    // picked separately from the reducer's own open-request bound.
    expect(MAX_SESSION_ROWS).toBe(MAX_RESPONDED_TOMBSTONES + MAX_OPEN_REQUESTS);
  });

  it('caps rows on the write side, dropping tombstones before open rows and oldest first', async () => {
    const requests: Record<string, Request> = {};
    // Two over the cap, with the two oldest tombstones expected to go.
    const rowCount = MAX_RESPONDED_TOMBSTONES + 22;

    for (let seq = 0; seq < rowCount; seq += 1) {
      requests[`req-${seq}`] =
        seq < 30
          ? ({ status: 'responded', seq } as Request)
          : (openRow({ seq }) as Request);
    }

    await writeRequestSession({ requests, windowId: null });

    const written = lastWrittenRecord().requests;

    expect(Object.keys(written)).toHaveLength(MAX_RESPONDED_TOMBSTONES + 20);
    expect(written['req-0']).toBeUndefined();
    expect(written['req-1']).toBeUndefined();
    expect(written['req-2']).toBeDefined();
    // Every open row survives: a dropped one is a live approval window.
    for (let seq = 30; seq < rowCount; seq += 1) {
      expect(written[`req-${seq}`]).toBeDefined();
    }
  });

  it('ranks the write cap by seq, not by key hoisting', async () => {
    const requests: Record<string, Request> = {};

    for (let seq = 0; seq < MAX_RESPONDED_TOMBSTONES + 21; seq += 1) {
      // `"42"` enumerates ahead of every string key; its ordinal is the newest.
      const requestId =
        seq === MAX_RESPONDED_TOMBSTONES + 20 ? '42' : `req-${seq}`;
      requests[requestId] = { status: 'responded', seq } as Request;
    }

    await writeRequestSession({ requests, windowId: null });

    const written = lastWrittenRecord().requests;

    expect(written['42']).toBeDefined();
    expect(written['req-0']).toBeUndefined();
  });
});

describe('session-store — clearRequestSession (spec §8.3)', () => {
  it('writes the empty record under the session key, joining the write chain', async () => {
    await clearRequestSession();

    expect(sessionSet).toHaveBeenCalledWith({
      [REQUEST_SESSION_KEY]: { requests: {}, windowId: null }
    });
  });

  it('coalesces with a same-tick writeRequestSession call onto the newest snapshot', async () => {
    void writeRequestSession({
      requests: { 'req-1': openRow() as Request },
      windowId: 3
    });
    await clearRequestSession();

    expect(sessionSet).toHaveBeenCalledTimes(1);
    expect(lastWrittenRecord()).toEqual({ requests: {}, windowId: null });
  });

  it('is a no-op on a persistent-background build', async () => {
    mockIsEphemeralBackgroundBuild = false;

    await clearRequestSession();

    expect(sessionSet).not.toHaveBeenCalled();
  });
});

describe('session-store — logging discipline', () => {
  it('never logs a raw URL query or the sanitizer input', async () => {
    sessionGet.mockRejectedValue(
      new Error(
        'chrome-extension://abc/signature-request.html?message=secret failed'
      )
    );
    sessionSet.mockRejectedValue(
      new Error(
        'chrome-extension://abc/signature-request.html?signingPublicKeyHex=01ab failed'
      )
    );

    await readRequestSession();
    await writeRequestSession({
      requests: { 'req-1': openRow() as Request },
      windowId: 1
    });

    const logged = consoleErrorSpy.mock.calls.flat().join(' ');

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(logged).not.toContain('?');
    expect(logged).not.toContain('dapp.example');
  });
});
