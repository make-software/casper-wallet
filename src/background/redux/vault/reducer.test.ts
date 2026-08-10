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
  eip712ById: {}
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
      eip712ById: { pe: 'payload-eip' }
    };

    it('takes the cipher payload dicts when the in-memory dicts are empty', () => {
      expect(reducer(initialState, vaultLoaded(payload))).toEqual({
        secretPhrase: ['w1', 'w2'],
        accounts: [acc('a')],
        accountNamesByOriginDict: { o1: ['a'] },
        siteNameByOriginDict: { o1: 'Title' },
        activeAccountName: 'a',
        jsonById: { pj: 'payload-json' },
        eip712ById: { pe: 'payload-eip' }
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
        eip712ById: { pe: 'payload-eip', existing: 'keep-eip' }
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
      eip712ById: { e: 'y' }
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

    // The ceiling must never cost an ALREADY STORED request its payload: the
    // oldest entry is the long-lived one — a request being confirmed on a
    // Ledger while a page pushes a burst of its own — and dropping it would
    // reproduce, behind a threshold, exactly the failure this reducer fixes.
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
