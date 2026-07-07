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
import { reducer } from './reducer';
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

    it('replaces state and takes payload dicts when existing dicts are empty', () => {
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

    it('keeps existing non-empty jsonById / eip712ById', () => {
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
        jsonById: { existing: 'keep-json' },
        eip712ById: { existing: 'keep-eip' }
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
      eip712ById: { e: 'y' }
    };
    expect(reducer(seeded, deploysReseted())).toEqual(initialState);
  });

  // 16
  describe('deployPayloadReceived / eip712PayloadReceived', () => {
    it('replaces the whole jsonById dict with a single-entry dict', () => {
      const state: VaultState = {
        ...initialState,
        jsonById: { old: 'x' }
      };
      const s = reducer(state, deployPayloadReceived({ id: 'new', json: 'j' }));
      expect(s.jsonById).toEqual({ new: 'j' });
    });

    it('replaces the whole eip712ById dict with a single-entry dict', () => {
      const state: VaultState = {
        ...initialState,
        eip712ById: { old: 'x' }
      };
      const s = reducer(state, eip712PayloadReceived({ id: 'new', json: 'j' }));
      expect(s.eip712ById).toEqual({ new: 'j' });
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
