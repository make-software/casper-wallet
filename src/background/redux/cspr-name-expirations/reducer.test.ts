import {
  csprNameExpirationsUpdated,
  expiringCsprNamesDismissed
} from './actions';
import { reducer } from './reducer';
import { CsprNameExpirationsState } from './types';

describe('cspr-name-expirations reducer', () => {
  it('has empty initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual({});
  });

  it('stores fetched expirations under the given network with dismissed=false', () => {
    const state = reducer(
      undefined,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        expirations: {
          'pk-a': { csprName: 'alice.cspr', expiresAt: '2026-07-20T00:00:00Z' }
        }
      })
    );
    expect(state).toEqual({
      mainnet: {
        'pk-a': {
          csprName: 'alice.cspr',
          expiresAt: '2026-07-20T00:00:00Z',
          dismissed: false
        }
      }
    });
  });

  it('keeps the other network untouched when updating', () => {
    const seeded: CsprNameExpirationsState = {
      testnet: {
        'pk-t': {
          csprName: 'test.cspr',
          expiresAt: '2026-07-22T00:00:00Z',
          dismissed: true
        }
      }
    };
    const state = reducer(
      seeded,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        expirations: {
          'pk-a': { csprName: 'alice.cspr', expiresAt: '2026-07-20T00:00:00Z' }
        }
      })
    );
    expect(state.testnet).toEqual(seeded.testnet);
    expect(state.mainnet).toEqual({
      'pk-a': {
        csprName: 'alice.cspr',
        expiresAt: '2026-07-20T00:00:00Z',
        dismissed: false
      }
    });
  });

  it('preserves the dismissed flag when name and date are unchanged', () => {
    const seeded: CsprNameExpirationsState = {
      mainnet: {
        'pk-a': {
          csprName: 'alice.cspr',
          expiresAt: '2026-07-20T00:00:00Z',
          dismissed: true
        }
      }
    };
    const state = reducer(
      seeded,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        expirations: {
          'pk-a': { csprName: 'alice.cspr', expiresAt: '2026-07-20T00:00:00Z' }
        }
      })
    );
    expect(state.mainnet?.['pk-a'].dismissed).toBe(true);
  });

  it('resets the dismissed flag when the expiration date changes (renewal)', () => {
    const seeded: CsprNameExpirationsState = {
      mainnet: {
        'pk-a': {
          csprName: 'alice.cspr',
          expiresAt: '2026-07-20T00:00:00Z',
          dismissed: true
        }
      }
    };
    const state = reducer(
      seeded,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        expirations: {
          'pk-a': { csprName: 'alice.cspr', expiresAt: '2027-07-20T00:00:00Z' }
        }
      })
    );
    expect(state.mainnet?.['pk-a'].dismissed).toBe(false);
  });

  it('resets the dismissed flag when the cspr.name changes', () => {
    const seeded: CsprNameExpirationsState = {
      mainnet: {
        'pk-a': {
          csprName: 'alice.cspr',
          expiresAt: '2026-07-20T00:00:00Z',
          dismissed: true
        }
      }
    };
    const state = reducer(
      seeded,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        expirations: {
          'pk-a': { csprName: 'bob.cspr', expiresAt: '2026-07-20T00:00:00Z' }
        }
      })
    );
    expect(state.mainnet?.['pk-a'].dismissed).toBe(false);
  });

  it('drops records absent from the update within that network only', () => {
    const seeded: CsprNameExpirationsState = {
      mainnet: {
        'pk-a': {
          csprName: 'alice.cspr',
          expiresAt: '2026-07-20T00:00:00Z',
          dismissed: true
        },
        'pk-b': {
          csprName: 'bob.cspr',
          expiresAt: '2026-08-01T00:00:00Z',
          dismissed: false
        }
      }
    };
    const state = reducer(
      seeded,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        expirations: {
          'pk-b': { csprName: 'bob.cspr', expiresAt: '2026-08-01T00:00:00Z' }
        }
      })
    );
    expect(state.mainnet).toEqual({
      'pk-b': {
        csprName: 'bob.cspr',
        expiresAt: '2026-08-01T00:00:00Z',
        dismissed: false
      }
    });
  });

  it('marks the given public keys as dismissed on the given network only', () => {
    const seeded: CsprNameExpirationsState = {
      mainnet: {
        'pk-a': {
          csprName: 'alice.cspr',
          expiresAt: '2026-07-20T00:00:00Z',
          dismissed: false
        },
        'pk-b': {
          csprName: 'bob.cspr',
          expiresAt: '2026-08-01T00:00:00Z',
          dismissed: false
        }
      },
      testnet: {
        'pk-a': {
          csprName: 'alice.cspr',
          expiresAt: '2026-07-20T00:00:00Z',
          dismissed: false
        }
      }
    };
    const state = reducer(
      seeded,
      expiringCsprNamesDismissed({
        network: 'mainnet',
        publicKeys: ['pk-a', 'pk-unknown']
      })
    );
    expect(state.mainnet?.['pk-a'].dismissed).toBe(true);
    expect(state.mainnet?.['pk-b'].dismissed).toBe(false);
    expect(state.testnet?.['pk-a'].dismissed).toBe(false);
  });

  it('ignores a dismiss for a network with no data', () => {
    const state = reducer(
      {},
      expiringCsprNamesDismissed({ network: 'mainnet', publicKeys: ['pk-a'] })
    );
    expect(state).toEqual({});
  });

  it('does not mutate the previous state object', () => {
    const seeded: CsprNameExpirationsState = {
      mainnet: {
        'pk-a': {
          csprName: 'alice.cspr',
          expiresAt: '2026-07-20T00:00:00Z',
          dismissed: false
        }
      }
    };
    reducer(
      seeded,
      expiringCsprNamesDismissed({ network: 'mainnet', publicKeys: ['pk-a'] })
    );
    expect(seeded.mainnet?.['pk-a'].dismissed).toBe(false);
  });
});
