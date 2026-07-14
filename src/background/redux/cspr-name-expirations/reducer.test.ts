import {
  csprNameExpirationsUpdated,
  dismissCsprNameExpirations
} from './actions';
import { reducer } from './reducer';
import { CsprNameExpirationsState } from './types';

const rec = (csprName: string, expiresAt: string, dismissed = false) => ({
  csprName,
  expiresAt,
  dismissed
});

describe('csprNameExpirations reducer', () => {
  it('has empty initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' } as any)).toEqual({});
  });

  it('adds records for a network on update', () => {
    const next = reducer(
      {},
      csprNameExpirationsUpdated({
        network: 'mainnet',
        records: {
          pk1: { csprName: 'a.cspr', expiresAt: '2026-06-16T12:00:00.000Z' }
        }
      })
    );
    expect(next).toEqual({
      mainnet: { pk1: rec('a.cspr', '2026-06-16T12:00:00.000Z') }
    });
  });

  it('preserves dismissed when csprName and expiresAt are unchanged', () => {
    const prev: CsprNameExpirationsState = {
      mainnet: { pk1: rec('a.cspr', '2026-06-16T12:00:00.000Z', true) }
    };
    const next = reducer(
      prev,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        records: {
          pk1: { csprName: 'a.cspr', expiresAt: '2026-06-16T12:00:00.000Z' }
        }
      })
    );
    expect(next.mainnet!.pk1.dismissed).toBe(true);
  });

  it('resets dismissed when the expiration date changes (renewal)', () => {
    const prev: CsprNameExpirationsState = {
      mainnet: { pk1: rec('a.cspr', '2026-06-16T12:00:00.000Z', true) }
    };
    const next = reducer(
      prev,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        records: {
          pk1: { csprName: 'a.cspr', expiresAt: '2027-06-16T12:00:00.000Z' }
        }
      })
    );
    expect(next.mainnet!.pk1.dismissed).toBe(false);
  });

  it('resets dismissed when the csprName changes for a public key', () => {
    const prev: CsprNameExpirationsState = {
      mainnet: { pk1: rec('a.cspr', '2026-06-16T12:00:00.000Z', true) }
    };
    const next = reducer(
      prev,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        records: {
          pk1: { csprName: 'b.cspr', expiresAt: '2026-06-16T12:00:00.000Z' }
        }
      })
    );
    expect(next.mainnet!.pk1.dismissed).toBe(false);
  });

  it('drops public keys no longer present and leaves other networks untouched', () => {
    const prev: CsprNameExpirationsState = {
      mainnet: {
        pk1: rec('a.cspr', '2026-06-16T12:00:00.000Z', true),
        pk2: rec('b.cspr', '2026-06-20T12:00:00.000Z')
      },
      testnet: { pk9: rec('t.cspr', '2026-06-18T12:00:00.000Z', true) }
    };
    const next = reducer(
      prev,
      csprNameExpirationsUpdated({
        network: 'mainnet',
        records: {
          pk1: { csprName: 'a.cspr', expiresAt: '2026-06-16T12:00:00.000Z' }
        }
      })
    );
    expect(next.mainnet).toEqual({
      pk1: rec('a.cspr', '2026-06-16T12:00:00.000Z', true)
    });
    expect(next.testnet).toEqual(prev.testnet);
  });

  it('dismisses only the given public keys on the given network', () => {
    const prev: CsprNameExpirationsState = {
      mainnet: {
        pk1: rec('a.cspr', '2026-06-16T12:00:00.000Z'),
        pk2: rec('b.cspr', '2026-06-20T12:00:00.000Z')
      }
    };
    const next = reducer(
      prev,
      dismissCsprNameExpirations({ network: 'mainnet', publicKeys: ['pk1'] })
    );
    expect(next.mainnet!.pk1.dismissed).toBe(true);
    expect(next.mainnet!.pk2.dismissed).toBe(false);
  });

  it('is a no-op when dismissing an absent network', () => {
    const prev: CsprNameExpirationsState = {};
    const next = reducer(
      prev,
      dismissCsprNameExpirations({ network: 'mainnet', publicKeys: ['pk1'] })
    );
    expect(next).toEqual({});
  });

  it('ignores unknown public keys on dismiss', () => {
    const prev: CsprNameExpirationsState = {
      mainnet: { pk1: rec('a.cspr', '2026-06-16T12:00:00.000Z') }
    };
    const next = reducer(
      prev,
      dismissCsprNameExpirations({ network: 'mainnet', publicKeys: ['ghost'] })
    );
    expect(next.mainnet!.pk1.dismissed).toBe(false);
  });
});
