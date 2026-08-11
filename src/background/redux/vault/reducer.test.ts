import { windowRequestResponded } from '@background/redux/windowManagement/actions';

import {
  accountAdded,
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsAdded,
  accountsImported,
  activeAccountChanged,
  activeAccountSupportsChanged,
  addWatchingAccount,
  anotherAccountConnected,
  deployPayloadReceived,
  deploysReseted,
  eip712PayloadReceived,
  hideAccountFromListChanged,
  secretPhraseCreated,
  siteConnected,
  siteDisconnected,
  vaultLoaded,
  vaultReseted
} from './actions';
import { getPayload } from './payload-map';
import { MAX_STORED_PAYLOADS, reducer } from './reducer';
import { VaultState } from './types';

// Compact fixture — never real key material.
const acc = (name: string, publicKey = `01${name}`) =>
  ({ name, publicKey, secretKey: `sk-${name}`, hidden: false }) as any;

const initialState: VaultState = {
  secretPhrase: null,
  accounts: [],
  accountNamesByOriginDict: {},
  siteNameByOriginDict: {},
  activeAccountName: null,
  jsonById: {},
  eip712ById: {},
  payloadSeqById: {}
};

describe('vault reducer', () => {
  // 1
  it('has the expected initial state (@@INIT)', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual(initialState);
  });

  // vaultReseted resets to initial state
  it('resets to initial state on vaultReseted', () => {
    const seeded: VaultState = {
      ...initialState,
      accounts: [acc('a')],
      activeAccountName: 'a',
      secretPhrase: ['w1', 'w2']
    };
    expect(reducer(seeded, vaultReseted())).toEqual(initialState);
  });

  // 2
  describe('vaultLoaded', () => {
    const payload: VaultState = {
      secretPhrase: ['w1', 'w2'],
      accounts: [acc('a')],
      accountNamesByOriginDict: { o1: ['a'] },
      siteNameByOriginDict: { o1: 'Title' },
      activeAccountName: 'a',
      jsonById: { pj: 'payload-json' },
      eip712ById: { pe: 'payload-eip' },
      payloadSeqById: { pj: 0, pe: 1 }
    };

    it('takes the cipher payload dicts when the in-memory dicts are empty', () => {
      expect(reducer(initialState, vaultLoaded(payload))).toEqual({
        secretPhrase: ['w1', 'w2'],
        accounts: [acc('a')],
        accountNamesByOriginDict: { o1: ['a'] },
        siteNameByOriginDict: { o1: 'Title' },
        activeAccountName: 'a',
        jsonById: { pj: 'payload-json' },
        eip712ById: { pe: 'payload-eip' },
        payloadSeqById: { pj: 0, pe: 1 }
      });
    });

    it('merges the cipher dicts into the in-memory ones', () => {
      const state: VaultState = {
        ...initialState,
        jsonById: { existing: 'keep-json' },
        eip712ById: { existing: 'keep-eip' }
      };
      expect(reducer(state, vaultLoaded(payload))).toEqual({
        secretPhrase: ['w1', 'w2'],
        accounts: [acc('a')],
        accountNamesByOriginDict: { o1: ['a'] },
        siteNameByOriginDict: { o1: 'Title' },
        activeAccountName: 'a',
        jsonById: { pj: 'payload-json', existing: 'keep-json' },
        eip712ById: { pe: 'payload-eip', existing: 'keep-eip' },
        // Renumbered into one sequence: the two carried entries keep their
        // relative age and both sit below the in-memory one.
        payloadSeqById: { pj: 0, pe: 1, existing: 2 }
      });
    });

    // `updateVaultCipher` early-returns while locked, so memory holds the
    // later write.
    it('lets the in-memory value win on an id present in both dicts', () => {
      const state: VaultState = {
        ...initialState,
        jsonById: { pj: 'fresh-json' },
        eip712ById: { pe: 'fresh-eip' }
      };

      const s = reducer(state, vaultLoaded(payload));

      expect(s.jsonById).toEqual({ pj: 'fresh-json' });
      expect(s.eip712ById).toEqual({ pe: 'fresh-eip' });
    });

    // Asserted on what the reducer owns: at es2017 the merge is emitted as
    // `Object.assign`, where a string `__proto__` vanishes silently and an
    // object one replaces the map's prototype.
    it.each([
      ['a string', '"poison"'],
      ['an object, as the deploy path dispatches', '{ "poisoned": true }']
    ])(
      'drops a __proto__ key carrying %s from the loaded dicts',
      (_l, json) => {
        // Object-literal `__proto__` is prototype syntax, not a key;
        // `JSON.parse` is what creates the own property.
        const poisoned: VaultState = {
          ...payload,
          jsonById: JSON.parse(
            `{ "__proto__": ${json}, "pj": "payload-json" }`
          ),
          eip712ById: JSON.parse(
            `{ "__proto__": ${json}, "pe": "payload-eip" }`
          )
        };

        const s = reducer(initialState, vaultLoaded(poisoned));

        expect(Object.keys(s.jsonById)).toEqual(['pj']);
        expect(Object.keys(s.eip712ById)).toEqual(['pe']);
        expect(Object.getPrototypeOf(s.jsonById)).toBe(Object.prototype);
        expect(Object.getPrototypeOf(s.eip712ById)).toBe(Object.prototype);
        expect(getPayload(s.jsonById, '__proto__')).toBeUndefined();
        expect(getPayload(s.eip712ById, '__proto__')).toBeUndefined();
      }
    );

    // The sanitizer must not overreach: a request keyed `constructor` still has
    // a payload to sign.
    it.each(['toString', 'constructor', 'valueOf', 'hasOwnProperty'])(
      'keeps a cipher payload stored under the inherited name %s',
      key => {
        const state: VaultState = {
          ...initialState,
          jsonById: { inMemory: 'keep-json' },
          eip712ById: { inMemory: 'keep-eip' }
        };

        const s = reducer(
          state,
          vaultLoaded({
            ...payload,
            jsonById: { [key]: 'from-cipher' },
            eip712ById: { [key]: 'from-cipher' }
          })
        );

        expect(Object.prototype.hasOwnProperty.call(s.jsonById, key)).toBe(
          true
        );
        expect(Object.prototype.hasOwnProperty.call(s.eip712ById, key)).toBe(
          true
        );
        expect(getPayload(s.jsonById, key)).toBe('from-cipher');
        expect(getPayload(s.eip712ById, key)).toBe('from-cipher');
        expect(getPayload(s.jsonById, 'inMemory')).toBe('keep-json');
        expect(getPayload(s.eip712ById, 'inMemory')).toBe('keep-eip');
      }
    );

    // A cipher written before the field entered `VaultState` decrypts without
    // it — `decryptVault` is a bare cast and there is no migration — and a
    // throw here escapes into `unlockVaultSaga`'s catch, so the vault never
    // unlocks again.
    it.each(['jsonById', 'eip712ById'] as const)(
      'loads a cipher written before %s existed as an empty dict instead of throwing',
      field => {
        const legacy: VaultState = { ...payload };
        delete (legacy as Partial<VaultState>)[field];
        const other = field === 'jsonById' ? 'eip712ById' : 'jsonById';

        const s = reducer(initialState, vaultLoaded(legacy));

        expect(s[field]).toEqual({});
        expect(s[other]).toEqual(payload[other]);
      }
    );

    // `Object.keys`, not a bare lookup: an inherited name would answer the
    // latter.
    it('returns dicts owning nothing when cipher and memory are both empty', () => {
      const s = reducer(
        initialState,
        vaultLoaded({ ...payload, jsonById: {}, eip712ById: {} })
      );

      expect(Object.keys(s.jsonById)).toEqual([]);
      expect(Object.keys(s.eip712ById)).toEqual([]);
    });

    // The merge is the one writer to these maps no `storePayload` guard covers:
    // each side is capped at `MAX_STORED_PAYLOADS`, so their union can be twice
    // that. Bounded here rather than left to `reconcileStalePayloadsSaga`, which
    // returns without reclaiming on an empty entry read, on a failed window
    // enumeration and in its catch, and is a `takeLatest` with no retry.
    describe('over MAX_STORED_PAYLOADS', () => {
      const mapOf = (prefix: string, count: number) =>
        Object.fromEntries(
          Array.from({ length: count }, (_, i) => [
            `${prefix}-${i}`,
            `${prefix}-json-${i}`
          ])
        );

      const seqOf = (prefix: string, count: number, from = 0) =>
        Object.fromEntries(
          Array.from({ length: count }, (_, i) => [`${prefix}-${i}`, from + i])
        );

      const loaded = (
        cipher: Record<string, string>,
        inMemory: Record<string, string>,
        cipherSeq: Record<string, number> = {}
      ) =>
        reducer(
          { ...initialState, jsonById: inMemory, eip712ById: inMemory },
          vaultLoaded({
            ...payload,
            jsonById: cipher,
            eip712ById: cipher,
            payloadSeqById: cipherSeq
          })
        );

      it.each(['jsonById', 'eip712ById'] as const)(
        'caps the merged %s at MAX_STORED_PAYLOADS',
        map => {
          const s = loaded(
            mapOf('cipher', MAX_STORED_PAYLOADS),
            mapOf('memory', MAX_STORED_PAYLOADS)
          );

          expect(Object.keys(s[map])).toHaveLength(MAX_STORED_PAYLOADS);
        }
      );

      // An in-memory entry arrived in THIS worker session — `signRequest` has
      // no lock gate, so one lands even while locked — and cannot be a payload
      // stranded by an earlier session. A cipher entry can.
      it('keeps every in-memory entry and takes the drop from the cipher', () => {
        const inMemory = mapOf('memory', 4);

        const s = loaded(mapOf('cipher', MAX_STORED_PAYLOADS), inMemory);

        expect(Object.keys(s.jsonById)).toHaveLength(MAX_STORED_PAYLOADS);
        Object.entries(inMemory).forEach(([id, json]) => {
          expect(getPayload(s.jsonById, id)).toBe(json);
        });
      });

      // Cipher order is insertion order across sessions, and a rewrite keeps
      // its original position, so the oldest key is the entry that has survived
      // the most locks unanswered — a leak. The newest is the one written just
      // before this lock, the only one an approval window can still be on.
      it('drops the oldest cipher entries and keeps the newest', () => {
        const s = loaded(
          mapOf('cipher', MAX_STORED_PAYLOADS),
          mapOf('memory', 3)
        );

        expect(getPayload(s.jsonById, 'cipher-0')).toBeUndefined();
        expect(getPayload(s.jsonById, 'cipher-2')).toBeUndefined();
        expect(getPayload(s.jsonById, 'cipher-3')).toBe('cipher-json-3');
        expect(getPayload(s.jsonById, 'cipher-9')).toBe('cipher-json-9');
      });

      // Survivors stay ahead of the in-memory entries, so the next lock
      // persists them in the same order and "oldest" keeps its meaning.
      it('leaves the surviving cipher entries before the in-memory ones', () => {
        const s = loaded(mapOf('cipher', 6), mapOf('memory', 6));

        expect(Object.keys(s.jsonById)).toEqual([
          'cipher-2',
          'cipher-3',
          'cipher-4',
          'cipher-5',
          'memory-0',
          'memory-1',
          'memory-2',
          'memory-3',
          'memory-4',
          'memory-5'
        ]);
      });

      // `room` reaches 0 once the in-memory map is at the ceiling, and before
      // this the whole cipher side went with it — the live pre-lock request
      // included — on count alone. A page puts it there on demand:
      // `signRequest` has no lock gate, so ten requests fired at a locked
      // wallet fill the map.
      it('keeps the newest cipher entries when the in-memory map is at the ceiling', () => {
        const cipher = { ...mapOf('stale', 9), live: 'live-json' };
        const cipherSeq = { ...seqOf('stale', 9), live: 9 };

        const s = loaded(
          cipher,
          mapOf('memory', MAX_STORED_PAYLOADS),
          cipherSeq
        );

        expect(Object.keys(s.jsonById)).toHaveLength(MAX_STORED_PAYLOADS);
        expect(getPayload(s.jsonById, 'live')).toBe('live-json');
      });

      // The slots come out of the in-memory side oldest first: those writes
      // arrived while the vault was locked, none is approved, and their dapp
      // can still be told.
      it('takes the drop from the oldest in-memory entries, not the newest', () => {
        const cipher = { ...mapOf('stale', 9), live: 'live-json' };
        const cipherSeq = { ...seqOf('stale', 9), live: 9 };

        const s = loaded(
          cipher,
          mapOf('memory', MAX_STORED_PAYLOADS),
          cipherSeq
        );

        expect(getPayload(s.jsonById, 'memory-0')).toBeUndefined();
        expect(
          getPayload(s.jsonById, `memory-${MAX_STORED_PAYLOADS - 1}`)
        ).toBe(`memory-json-${MAX_STORED_PAYLOADS - 1}`);
      });

      it('leaves a union that fits under the ceiling untouched', () => {
        const cipher = mapOf('cipher', 5);
        const inMemory = mapOf('memory', 5);

        const s = loaded(cipher, inMemory);

        expect(s.jsonById).toEqual({ ...cipher, ...inMemory });
        expect(s.eip712ById).toEqual({ ...cipher, ...inMemory });
      });

      // An id on both sides is one entry: counting it twice would evict a
      // cipher entry to free a slot that was never spent.
      it('spends one slot on an id held by both sides', () => {
        const cipher = { ...mapOf('cipher', 9), shared: 'stale' };

        const s = loaded(cipher, { shared: 'fresh' });

        expect(Object.keys(s.jsonById)).toHaveLength(MAX_STORED_PAYLOADS);
        expect(getPayload(s.jsonById, 'cipher-0')).toBe('cipher-json-0');
        expect(getPayload(s.jsonById, 'shared')).toBe('fresh');
      });

      // "Newest" is read off `payloadSeqById`. Reading it off the map's own
      // key order is what these pin against: an object hoists integer-like
      // keys ahead of every string key, in ascending numeric order, and
      // `requestId` is dapp-chosen — only `__proto__` is rejected — so `"42"`
      // is an id the wallet accepts and stores.
      describe('ranked by payloadSeqById, not by key order', () => {
        it('evicts by ordinal even when the key order says the opposite', () => {
          const cipher = { ...mapOf('stale', 9), '42': 'live-json' };
          const cipherSeq = { ...seqOf('stale', 9), '42': 9 };

          // The hoisting the ranking must not follow: the entry written LAST
          // enumerates FIRST, where the eviction takes from.
          expect(Object.keys(cipher)[0]).toBe('42');

          const s = loaded(cipher, mapOf('memory', 1), cipherSeq);

          expect(getPayload(s.jsonById, '42')).toBe('live-json');
          expect(getPayload(s.jsonById, 'stale-0')).toBeUndefined();
        });

        // The mirror, so the rule reads as "follow the ordinal" rather than
        // "spare integer-like keys".
        it('evicts an integer-like id that really is the oldest', () => {
          const cipher = { ...mapOf('fresh', 9), '42': 'stale-json' };
          const cipherSeq = { '42': 0, ...seqOf('fresh', 9, 1) };

          const s = loaded(cipher, mapOf('memory', 1), cipherSeq);

          expect(getPayload(s.jsonById, '42')).toBeUndefined();
          expect(getPayload(s.jsonById, 'fresh-0')).toBe('fresh-json-0');
        });

        // An entry with no ordinal was written before the field existed, so it
        // predates everything stamped.
        it('treats an unstamped entry as older than every stamped one', () => {
          const cipher = { legacy: 'legacy-json', ...mapOf('stamped', 9) };

          const s = loaded(cipher, mapOf('memory', 1), seqOf('stamped', 9));

          expect(getPayload(s.jsonById, 'legacy')).toBeUndefined();
          expect(getPayload(s.jsonById, 'stamped-0')).toBe('stamped-json-0');
        });

        // A cipher written before the field existed carries no ordinals at
        // all, so the merge falls back to the map's own order — what it did
        // before this ranking, rather than treating every entry as unrankable.
        it('falls back to cipher order when the cipher predates the field', () => {
          const legacy: VaultState = {
            ...payload,
            jsonById: mapOf('cipher', MAX_STORED_PAYLOADS),
            eip712ById: {}
          };
          delete (legacy as Partial<VaultState>).payloadSeqById;

          const s = reducer(
            { ...initialState, jsonById: mapOf('memory', 3) },
            vaultLoaded(legacy)
          );

          expect(Object.keys(s.jsonById)).toHaveLength(MAX_STORED_PAYLOADS);
          expect(getPayload(s.jsonById, 'cipher-0')).toBeUndefined();
          expect(getPayload(s.jsonById, 'cipher-9')).toBe('cipher-json-9');
        });

        // The fallback order lies about exactly one class of id. An
        // integer-like key is hoisted to the front of the map whenever it was
        // written, so reading it as the oldest evicts the entry a legacy
        // cipher is least able to spare.
        it('does not evict an integer-like id from a cipher that predates the field', () => {
          const legacy: VaultState = {
            ...payload,
            jsonById: { ...mapOf('leak', 9), '42': 'live-json' },
            eip712ById: {}
          };
          delete (legacy as Partial<VaultState>).payloadSeqById;

          // The hoisting: written LAST, enumerates FIRST.
          expect(Object.keys(legacy.jsonById)[0]).toBe('42');

          const s = reducer(
            { ...initialState, jsonById: mapOf('memory', 3) },
            vaultLoaded(legacy)
          );

          expect(getPayload(s.jsonById, '42')).toBe('live-json');
          expect(getPayload(s.jsonById, 'leak-0')).toBeUndefined();
        });

        // An ordinary key's position IS its age, so the fallback still reads
        // it — the rule is "distrust the hoisted key", not "spare every
        // unstamped one".
        it('still evicts the oldest ordinary id from a cipher that predates the field', () => {
          const legacy: VaultState = {
            ...payload,
            jsonById: mapOf('leak', MAX_STORED_PAYLOADS),
            eip712ById: {}
          };
          delete (legacy as Partial<VaultState>).payloadSeqById;

          const s = reducer(
            { ...initialState, jsonById: mapOf('memory', 3) },
            vaultLoaded(legacy)
          );

          expect(getPayload(s.jsonById, 'leak-0')).toBeUndefined();
          expect(getPayload(s.jsonById, 'leak-9')).toBe('leak-json-9');
        });

        // The two sides' ordinals came from different counters — the cipher's
        // from before the lock, memory's restarted at 0 by `vaultReseted` —
        // so they are renumbered into one sequence rather than left to be
        // compared across epochs at the next unlock.
        it('renumbers the survivors into one sequence, carried entries first', () => {
          const s = loaded(
            mapOf('cipher', 6),
            mapOf('memory', 6),
            seqOf('cipher', 6)
          );

          expect(s.payloadSeqById).toEqual({
            'cipher-2': 0,
            'cipher-3': 1,
            'cipher-4': 2,
            'cipher-5': 3,
            'memory-0': 4,
            'memory-1': 5,
            'memory-2': 6,
            'memory-3': 7,
            'memory-4': 8,
            'memory-5': 9
          });
        });

        it('leaves no ordinal behind for an evicted entry', () => {
          const s = loaded(
            mapOf('cipher', MAX_STORED_PAYLOADS),
            mapOf('memory', 3),
            seqOf('cipher', MAX_STORED_PAYLOADS)
          );

          expect(Object.keys(s.payloadSeqById).sort()).toEqual(
            Object.keys(s.jsonById).sort()
          );
        });

        // The whole cycle, with no hand-written ordinal anywhere: every one of
        // them is the reducer's own. A dapp that numbers its requests fills the
        // map before a lock, the live request is the newest, and the unlock
        // must not hand its slot to nine leaks.
        it('keeps the live numerically-keyed request across a lock', () => {
          let preLock = initialState;

          for (let i = 0; i < MAX_STORED_PAYLOADS - 1; i++) {
            preLock = reducer(
              preLock,
              deployPayloadReceived({ id: `leak-${i}`, json: `leak-json-${i}` })
            );
          }

          // The request the user is about to confirm, keyed as a dapp may.
          preLock = reducer(
            preLock,
            deployPayloadReceived({ id: '42', json: 'live-json' })
          );

          // `lockVaultSaga` flushes the cipher BEFORE the reset, so `preLock`
          // is what the cipher holds while the in-memory map is emptied.
          const locked = reducer(preLock, vaultReseted());
          // `signRequest` has no lock gate: one lands while locked.
          const whileLocked = reducer(
            locked,
            deployPayloadReceived({ id: 'locked-0', json: 'locked-json-0' })
          );

          const s = reducer(whileLocked, vaultLoaded(preLock));

          expect(getPayload(s.jsonById, '42')).toBe('live-json');
          expect(getPayload(s.jsonById, 'leak-0')).toBeUndefined();
          expect(getPayload(s.jsonById, 'locked-0')).toBe('locked-json-0');
          expect(Object.keys(s.jsonById)).toHaveLength(MAX_STORED_PAYLOADS);
        });
      });
    });
  });

  // 3
  it('sets the secret phrase on secretPhraseCreated', () => {
    const s = reducer(initialState, secretPhraseCreated(['a', 'b'] as any));
    expect(s).toEqual({ ...initialState, secretPhrase: ['a', 'b'] });
  });

  // 4
  it('appends and activates on accountAdded', () => {
    const s1 = reducer(initialState, accountAdded(acc('a')));
    expect(s1).toEqual({
      ...initialState,
      accounts: [acc('a')],
      activeAccountName: 'a'
    });
    const s2 = reducer(s1, accountAdded(acc('b')));
    expect(s2.accounts).toEqual([acc('a'), acc('b')]);
    expect(s2.activeAccountName).toBe('b');
  });

  // 5
  describe('accountImported', () => {
    it('activates only when it is the first account', () => {
      const s = reducer(initialState, accountImported(acc('a')));
      expect(s).toEqual({
        ...initialState,
        accounts: [acc('a')],
        activeAccountName: 'a'
      });
    });

    it('appends without changing active when not the first', () => {
      const state: VaultState = {
        ...initialState,
        accounts: [acc('a')],
        activeAccountName: 'a'
      };
      const s = reducer(state, accountImported(acc('b')));
      expect(s.accounts).toEqual([acc('a'), acc('b')]);
      expect(s.activeAccountName).toBe('a');
    });
  });

  // 6
  describe('accountsAdded / accountsImported', () => {
    it('accountsAdded activates the first only when list was empty', () => {
      const empty = reducer(initialState, accountsAdded([acc('a'), acc('b')]));
      expect(empty.accounts).toEqual([acc('a'), acc('b')]);
      expect(empty.activeAccountName).toBe('a');

      const state: VaultState = {
        ...initialState,
        accounts: [acc('x')],
        activeAccountName: 'x'
      };
      const nonEmpty = reducer(state, accountsAdded([acc('a'), acc('b')]));
      expect(nonEmpty.accounts).toEqual([acc('x'), acc('a'), acc('b')]);
      expect(nonEmpty.activeAccountName).toBe('x');
    });

    it('accountsImported activates the first only when list was empty', () => {
      const empty = reducer(
        initialState,
        accountsImported([acc('a'), acc('b')])
      );
      expect(empty.accounts).toEqual([acc('a'), acc('b')]);
      expect(empty.activeAccountName).toBe('a');

      const state: VaultState = {
        ...initialState,
        accounts: [acc('x')],
        activeAccountName: 'x'
      };
      const nonEmpty = reducer(state, accountsImported([acc('a'), acc('b')]));
      expect(nonEmpty.accounts).toEqual([acc('x'), acc('a'), acc('b')]);
      expect(nonEmpty.activeAccountName).toBe('x');
    });
  });

  // 7
  describe('accountRemoved', () => {
    it('reassigns active to first remaining, drops single-member groups, filters name from remaining groups', () => {
      const state: VaultState = {
        ...initialState,
        accounts: [acc('a'), acc('b'), acc('c')],
        activeAccountName: 'b',
        accountNamesByOriginDict: { o1: ['b'], o2: ['a', 'b'] }
      };
      const s = reducer(state, accountRemoved({ accountName: 'b' }));
      expect(s).toEqual({
        ...initialState,
        accounts: [acc('a'), acc('c')],
        activeAccountName: 'a',
        accountNamesByOriginDict: { o2: ['a'] }
      });
    });

    it('sets active to null when removing the only account', () => {
      const state: VaultState = {
        ...initialState,
        accounts: [acc('a')],
        activeAccountName: 'a'
      };
      const s = reducer(state, accountRemoved({ accountName: 'a' }));
      expect(s.accounts).toEqual([]);
      expect(s.activeAccountName).toBeNull();
    });

    it('leaves active unchanged when removing a non-active account', () => {
      const state: VaultState = {
        ...initialState,
        accounts: [acc('a'), acc('b')],
        activeAccountName: 'a'
      };
      const s = reducer(state, accountRemoved({ accountName: 'b' }));
      expect(s.accounts).toEqual([acc('a')]);
      expect(s.activeAccountName).toBe('a');
    });

    it('defaults an undefined origin group to an empty list', () => {
      const state: VaultState = {
        ...initialState,
        accounts: [acc('a'), acc('b')],
        activeAccountName: 'a',
        accountNamesByOriginDict: { oUndef: undefined }
      };
      const s = reducer(state, accountRemoved({ accountName: 'b' }));
      expect(s.accountNamesByOriginDict).toEqual({ oUndef: [] });
    });
  });

  // 8
  it('renames across accounts, activeAccountName and origin groups on accountRenamed', () => {
    const state: VaultState = {
      ...initialState,
      accounts: [acc('a'), acc('b')],
      activeAccountName: 'a',
      accountNamesByOriginDict: { o1: ['a', 'b'], o2: ['a'] }
    };
    const s = reducer(state, accountRenamed({ oldName: 'a', newName: 'z' }));
    expect(s).toEqual({
      ...initialState,
      accounts: [{ ...acc('a'), name: 'z' }, acc('b')],
      activeAccountName: 'z',
      accountNamesByOriginDict: { o1: ['z', 'b'], o2: ['z'] }
    });
  });

  it('accountRenamed keeps active when the renamed account is not active and defaults undefined groups', () => {
    const state: VaultState = {
      ...initialState,
      accounts: [acc('a'), acc('b')],
      activeAccountName: 'b',
      accountNamesByOriginDict: { o1: ['a'], oUndef: undefined }
    };
    const s = reducer(state, accountRenamed({ oldName: 'a', newName: 'z' }));
    expect(s.activeAccountName).toBe('b');
    expect(s.accountNamesByOriginDict).toEqual({ o1: ['z'], oUndef: [] });
  });

  // 9
  describe('siteConnected', () => {
    it('records the site title and sets the account names for a fresh origin', () => {
      const s = reducer(
        initialState,
        siteConnected({
          siteOrigin: 'o1',
          accountNames: ['a', 'b'],
          siteTitle: 'Title'
        })
      );
      expect(s).toEqual({
        ...initialState,
        siteNameByOriginDict: { o1: 'Title' },
        accountNamesByOriginDict: { o1: ['a', 'b'] }
      });
    });

    it('appends account names when the origin group already has members', () => {
      const state: VaultState = {
        ...initialState,
        accountNamesByOriginDict: { o1: ['a'] }
      };
      const s = reducer(
        state,
        siteConnected({
          siteOrigin: 'o1',
          accountNames: ['b'],
          siteTitle: 'Title'
        })
      );
      expect(s.accountNamesByOriginDict).toEqual({ o1: ['a', 'b'] });
      expect(s.siteNameByOriginDict).toEqual({ o1: 'Title' });
    });
  });

  // 10
  describe('anotherAccountConnected', () => {
    it('appends a single name to an existing origin group', () => {
      const state: VaultState = {
        ...initialState,
        accountNamesByOriginDict: { o1: ['a'] }
      };
      const s = reducer(
        state,
        anotherAccountConnected({ siteOrigin: 'o1', accountName: 'b' })
      );
      expect(s.accountNamesByOriginDict).toEqual({ o1: ['a', 'b'] });
    });

    it('creates the origin group when it did not exist', () => {
      const s = reducer(
        initialState,
        anotherAccountConnected({ siteOrigin: 'o1', accountName: 'b' })
      );
      expect(s.accountNamesByOriginDict).toEqual({ o1: ['b'] });
    });
  });

  // 11
  describe('accountDisconnected', () => {
    it('drops the group when the disconnected account was the last member', () => {
      const state: VaultState = {
        ...initialState,
        accountNamesByOriginDict: { o1: ['a'], o2: ['a', 'b'] }
      };
      const s = reducer(
        state,
        accountDisconnected({ siteOrigin: 'o1', accountName: 'a' })
      );
      expect(s.accountNamesByOriginDict).toEqual({ o2: ['a', 'b'] });
    });

    it('removes only the name when the group has other members', () => {
      const state: VaultState = {
        ...initialState,
        accountNamesByOriginDict: { o1: ['a', 'b'] }
      };
      const s = reducer(
        state,
        accountDisconnected({ siteOrigin: 'o1', accountName: 'a' })
      );
      expect(s.accountNamesByOriginDict).toEqual({ o1: ['b'] });
    });

    it('leaves other-origin groups untouched and defaults undefined groups', () => {
      const state: VaultState = {
        ...initialState,
        accountNamesByOriginDict: { o1: ['a', 'b'], oUndef: undefined }
      };
      const s = reducer(
        state,
        accountDisconnected({ siteOrigin: 'oX', accountName: 'a' })
      );
      expect(s.accountNamesByOriginDict).toEqual({
        o1: ['a', 'b'],
        oUndef: []
      });
    });
  });

  // 12
  it('drops the origin key entirely on siteDisconnected', () => {
    const state: VaultState = {
      ...initialState,
      accountNamesByOriginDict: { o1: ['a'], o2: ['b'] }
    };
    const s = reducer(state, siteDisconnected({ siteOrigin: 'o1' }));
    expect(s.accountNamesByOriginDict).toEqual({ o2: ['b'] });
  });

  // 13
  it('sets the active account on activeAccountChanged', () => {
    const s = reducer(initialState, activeAccountChanged('a'));
    expect(s).toEqual({ ...initialState, activeAccountName: 'a' });
  });

  // 14
  it('updates only the active account supports on activeAccountSupportsChanged', () => {
    const state: VaultState = {
      ...initialState,
      accounts: [acc('a'), acc('b')],
      activeAccountName: 'a'
    };
    const supports = ['SIGN_DEPLOY'] as any;
    const s = reducer(state, activeAccountSupportsChanged(supports));
    expect(s.accounts).toEqual([{ ...acc('a'), supports }, acc('b')]);
  });

  // 15
  it('returns the FULL initial state on deploysReseted (wipes accounts)', () => {
    const seeded: VaultState = {
      secretPhrase: ['w1'],
      accounts: [acc('a'), acc('b')],
      accountNamesByOriginDict: { o1: ['a'] },
      siteNameByOriginDict: { o1: 'Title' },
      activeAccountName: 'a',
      jsonById: { j: 'x' },
      eip712ById: { e: 'y' },
      payloadSeqById: { j: 0, e: 1 }
    };
    expect(reducer(seeded, deploysReseted())).toEqual(initialState);
  });

  // 16
  describe('deployPayloadReceived / eip712PayloadReceived', () => {
    // The regression WALLET-1384 is about: these used to build a NEW
    // single-entry dict, so a second request erased the first one's payload.
    // `cancelRequestsDisplacedBy` spares a request another window still shows
    // (the Ledger permission window), so that survivor stayed 'open' on screen
    // with no transaction to sign.
    it('keeps an earlier deploy payload when a second request arrives', () => {
      const state: VaultState = {
        ...initialState,
        jsonById: { first: 'json-first' }
      };
      const s = reducer(
        state,
        deployPayloadReceived({ id: 'second', json: 'json-second' })
      );
      expect(s.jsonById).toEqual({
        first: 'json-first',
        second: 'json-second'
      });
    });

    it('keeps an earlier eip712 payload when a second request arrives', () => {
      const state: VaultState = {
        ...initialState,
        eip712ById: { first: 'eip-first' }
      };
      const s = reducer(
        state,
        eip712PayloadReceived({ id: 'second', json: 'eip-second' })
      );
      expect(s.eip712ById).toEqual({
        first: 'eip-first',
        second: 'eip-second'
      });
    });

    // The write order the merge on unlock ranks on. It has to be stored: a
    // plain object hoists integer-like keys ahead of every string key, so the
    // maps themselves cannot answer which entry came last.
    describe('payloadSeqById', () => {
      it('stamps one ascending ordinal per stored request, across both maps', () => {
        const s = [
          deployPayloadReceived({ id: 'first', json: 'json-first' }),
          eip712PayloadReceived({ id: 'second', json: 'eip-second' }),
          deployPayloadReceived({ id: 'third', json: 'json-third' })
        ].reduce(reducer, initialState);

        expect(s.payloadSeqById).toEqual({ first: 0, second: 1, third: 2 });
      });

      // A rewrite is the same request refreshed, and it is the REQUEST's age
      // the merge ranks on — re-stamping would let a page promote its own
      // entry past a live one simply by re-sending it.
      it('keeps the original ordinal when the same id is stored again', () => {
        const s = [
          deployPayloadReceived({ id: 'first', json: 'json-first' }),
          deployPayloadReceived({ id: 'second', json: 'json-second' }),
          deployPayloadReceived({ id: 'first', json: 'refreshed' })
        ].reduce(reducer, initialState);

        expect(s.payloadSeqById).toEqual({ first: 0, second: 1 });
        expect(getPayload(s.jsonById, 'first')).toBe('refreshed');
      });

      it('stamps no ordinal for a refused __proto__ write', () => {
        const s = reducer(
          initialState,
          deployPayloadReceived({ id: '__proto__', json: 'poison' })
        );

        expect(Object.keys(s.payloadSeqById)).toEqual([]);
        expect(Object.getPrototypeOf(s.payloadSeqById)).toBe(Object.prototype);
      });
    });

    it('overwrites only its own entry when the same id is sent twice', () => {
      const state: VaultState = {
        ...initialState,
        jsonById: { other: 'keep', same: 'stale' },
        eip712ById: { other: 'keep', same: 'stale' }
      };
      const s = reducer(
        reducer(state, deployPayloadReceived({ id: 'same', json: 'fresh' })),
        eip712PayloadReceived({ id: 'same', json: 'fresh' })
      );
      expect(s.jsonById).toEqual({ other: 'keep', same: 'fresh' });
      expect(s.eip712ById).toEqual({ other: 'keep', same: 'fresh' });
    });

    // Asserted on what the reducer owns, so a `target` bump cannot move it.
    // `tsconfig.json` is es2017 today, which emits the spread as `Object.assign`
    // and makes `__proto__` run the setter rather than add an entry; at es2018
    // the native spread would store it as an own property instead. Either way
    // `storePayload` refuses the id, so the map stays empty and keeps its
    // prototype — and `getPayload` agrees with the map about both.
    //
    // The object case is not a variation for its own sake: the deploy path
    // dispatches `JSON.parse(...)`, i.e. an object, into a map declared
    // `Record<string, string>` (sdk-methods.ts), and an object value is what
    // makes the setter actually replace this map's prototype.
    it.each([
      ['a string', 'poison'],
      ['an object, as the deploy path dispatches', { poisoned: true }]
    ])('refuses a __proto__ payload carrying %s', (_label, json) => {
      const s = reducer(
        initialState,
        deployPayloadReceived({ id: '__proto__', json: json as string })
      );

      expect(Object.keys(s.jsonById)).toEqual([]);
      expect(Object.getPrototypeOf(s.jsonById)).toBe(Object.prototype);
      expect(getPayload(s.jsonById, '__proto__')).toBeUndefined();
    });

    // On this path the ceiling must never cost an ALREADY STORED request its
    // payload: within a session the oldest entry is the long-lived one — a
    // request being confirmed on a Ledger while a page pushes a burst of its
    // own — and dropping it would reproduce, behind a threshold, exactly the
    // failure this reducer fixes. Across a lock the age reads the other way,
    // which is why the merge above evicts the opposite end.
    describe('at MAX_STORED_PAYLOADS', () => {
      const atCapacity = (map: 'jsonById' | 'eip712ById'): VaultState => ({
        ...initialState,
        [map]: Object.fromEntries(
          Array.from({ length: MAX_STORED_PAYLOADS }, (_, i) => [
            `id-${i}`,
            `json-${i}`
          ])
        )
      });

      it.each([
        ['jsonById', deployPayloadReceived] as const,
        ['eip712ById', eip712PayloadReceived] as const
      ])('refuses an incoming %s write instead of evicting', (map, action) => {
        const full = atCapacity(map);

        const s = reducer(full, action({ id: 'incoming', json: 'refused' }));

        expect(s[map]).toEqual(full[map]);
        expect(Object.keys(s[map])).toHaveLength(MAX_STORED_PAYLOADS);
        expect(s[map]['id-0']).toBe('json-0');
        expect(s[map].incoming).toBeUndefined();
      });

      it.each([
        ['jsonById', deployPayloadReceived] as const,
        ['eip712ById', eip712PayloadReceived] as const
      ])('still applies a rewrite of an id already in %s', (map, action) => {
        const full = atCapacity(map);

        const s = reducer(full, action({ id: 'id-0', json: 'refreshed' }));

        expect(s[map]['id-0']).toBe('refreshed');
        expect(Object.keys(s[map])).toHaveLength(MAX_STORED_PAYLOADS);
      });

      it.each([
        ['jsonById', deployPayloadReceived] as const,
        ['eip712ById', eip712PayloadReceived] as const
      ])('stamps no ordinal for a %s write it refused', (map, action) => {
        const full = atCapacity(map);

        const s = reducer(full, action({ id: 'incoming', json: 'refused' }));

        expect(s.payloadSeqById.incoming).toBeUndefined();
      });

      // A burst answering one request must hand the freed slot to the next
      // write, or the refusal above would be permanent rather than a ceiling.
      it('accepts a new payload once an answered request frees a slot', () => {
        const full = atCapacity('jsonById');

        const s = reducer(
          reducer(full, windowRequestResponded({ requestId: 'id-3' })),
          deployPayloadReceived({ id: 'incoming', json: 'accepted' })
        );

        expect(s.jsonById.incoming).toBe('accepted');
        expect(s.jsonById['id-3']).toBeUndefined();
      });
    });
  });

  // 16b — the per-request cleanup. Without it the maps only ever shrink on
  // `deploysReseted`, and `lockVaultSaga` flushes the cipher BEFORE that reset,
  // so `vaultLoaded` restores every stale payload on the next unlock.
  describe('windowRequestResponded', () => {
    it('drops the answered request from jsonById and leaves the rest', () => {
      const state: VaultState = {
        ...initialState,
        jsonById: { answered: 'gone', other: 'kept' }
      };
      const s = reducer(
        state,
        windowRequestResponded({ requestId: 'answered' })
      );
      expect(s.jsonById).toEqual({ other: 'kept' });
    });

    // An ordinal outliving its payload is a leaked slot of the same kind this
    // case exists to reclaim, in a map nothing else enumerates.
    it('drops the ordinal along with the payload it dates', () => {
      const seeded = [
        deployPayloadReceived({ id: 'answered', json: 'gone' }),
        deployPayloadReceived({ id: 'other', json: 'kept' })
      ].reduce(reducer, initialState);

      const s = reducer(
        seeded,
        windowRequestResponded({ requestId: 'answered' })
      );

      expect(s.payloadSeqById).toEqual({ other: 1 });
    });

    it('drops the answered request from eip712ById and leaves the rest', () => {
      const state: VaultState = {
        ...initialState,
        eip712ById: { answered: 'gone', other: 'kept' }
      };
      const s = reducer(
        state,
        windowRequestResponded({ requestId: 'answered' })
      );
      expect(s.eip712ById).toEqual({ other: 'kept' });
    });

    // `requestId` is dapp-controlled, so an id naming an inherited
    // Object.prototype member must be answered from OWN properties only — the
    // same reason windowManagement/request-map.ts exists, on the same key space.
    it.each(['toString', 'constructor', 'valueOf', 'hasOwnProperty'])(
      'drops a stored payload under the inherited name %s',
      key => {
        const seeded = reducer(
          initialState,
          deployPayloadReceived({ id: key, json: 'stored' })
        );
        expect(getPayload(seeded.jsonById, key)).toBe('stored');

        const s = reducer(seeded, windowRequestResponded({ requestId: key }));

        expect(getPayload(s.jsonById, key)).toBeUndefined();
      }
    );

    it.each(['toString', 'constructor', 'valueOf', 'hasOwnProperty'])(
      'leaves the map alone for an unstored inherited name %s',
      key => {
        const state: VaultState = {
          ...initialState,
          jsonById: { other: 'kept' }
        };

        expect(reducer(state, windowRequestResponded({ requestId: key }))).toBe(
          state
        );
      }
    );

    // Every `windows.onRemoved` in the browser can reach this reducer, and the
    // store subscriber does no state-change comparison: a fresh object means a
    // popupState broadcast to every replica plus a full storage.local rewrite.
    it('returns the same state object when the id is in neither map', () => {
      const state: VaultState = {
        ...initialState,
        jsonById: { other: 'kept' },
        eip712ById: { other: 'kept' }
      };
      expect(
        reducer(state, windowRequestResponded({ requestId: 'unknown' }))
      ).toBe(state);
    });
  });

  // 17
  describe('hideAccountFromListChanged', () => {
    it('toggles hidden and reassigns active when the hidden account was active', () => {
      const state: VaultState = {
        ...initialState,
        accounts: [acc('a'), acc('b')],
        activeAccountName: 'a'
      };
      const s = reducer(
        state,
        hideAccountFromListChanged({ accountName: 'a' })
      );
      expect(s.activeAccountName).toBe('b');
      expect(s.accounts).toEqual([{ ...acc('a'), hidden: true }, acc('b')]);
    });

    it('sets active to null when hiding the only (active) account', () => {
      const state: VaultState = {
        ...initialState,
        accounts: [acc('a')],
        activeAccountName: 'a'
      };
      const s = reducer(
        state,
        hideAccountFromListChanged({ accountName: 'a' })
      );
      expect(s.activeAccountName).toBeNull();
      expect(s.accounts).toEqual([{ ...acc('a'), hidden: true }]);
    });

    it('toggles hidden and keeps active when a non-active account is hidden', () => {
      const state: VaultState = {
        ...initialState,
        accounts: [acc('a'), acc('b')],
        activeAccountName: 'a'
      };
      const s = reducer(
        state,
        hideAccountFromListChanged({ accountName: 'b' })
      );
      expect(s.activeAccountName).toBe('a');
      expect(s.accounts).toEqual([acc('a'), { ...acc('b'), hidden: true }]);
    });
  });

  // 18
  it('appends and activates on addWatchingAccount', () => {
    const state: VaultState = {
      ...initialState,
      accounts: [acc('a')],
      activeAccountName: 'a'
    };
    const s = reducer(state, addWatchingAccount(acc('w')));
    expect(s.accounts).toEqual([acc('a'), acc('w')]);
    expect(s.activeAccountName).toBe('w');
  });
});
