import { getCsprNameExpirations } from './get-cspr-name-expirations';

jest.mock('@libs/entities/Account', () => ({
  getAccountHashFromPublicKey: (publicKey: string) => `hash-${publicKey}`
}));

const network = 'mainnet' as const;

const makeInfo = (overrides: Record<string, unknown>) => ({
  id: '',
  publicKey: '',
  accountHash: '',
  name: '',
  brandingLogo: null,
  csprName: null,
  csprNameExpiresAt: null,
  explorerLink: null,
  ...overrides
});

describe('getCsprNameExpirations', () => {
  it('resolves expirations only for accounts that have a cspr.name', async () => {
    const accountsInfo = {
      'hash-pk-a': makeInfo({ csprName: 'alice.cspr' }),
      'hash-pk-b': makeInfo({ csprName: null })
    };
    const repository = {
      resolveAccountFromCsprName: jest.fn().mockResolvedValue(
        makeInfo({
          csprName: 'alice.cspr',
          csprNameExpiresAt: '2026-07-20T00:00:00Z'
        })
      )
    };

    const { expirations, failedPublicKeys } = await getCsprNameExpirations(
      ['pk-a', 'pk-b'],
      accountsInfo,
      network,
      repository
    );

    expect(repository.resolveAccountFromCsprName).toHaveBeenCalledTimes(1);
    expect(repository.resolveAccountFromCsprName).toHaveBeenCalledWith(
      'alice.cspr',
      network,
      false
    );
    expect(expirations).toEqual({
      'pk-a': { csprName: 'alice.cspr', expiresAt: '2026-07-20T00:00:00Z' }
    });
    expect(failedPublicKeys).toEqual([]);
  });

  it('reports failed resolutions separately and skips names without an expiration date', async () => {
    const accountsInfo = {
      'hash-pk-a': makeInfo({ csprName: 'alice.cspr' }),
      'hash-pk-b': makeInfo({ csprName: 'bob.cspr' }),
      'hash-pk-c': makeInfo({ csprName: 'carol.cspr' })
    };
    const repository = {
      resolveAccountFromCsprName: jest
        .fn()
        .mockImplementation(async (csprName: string) => {
          if (csprName === 'alice.cspr') {
            throw new Error('network error');
          }
          if (csprName === 'bob.cspr') {
            return makeInfo({ csprNameExpiresAt: null });
          }
          return makeInfo({ csprNameExpiresAt: '2026-07-25T00:00:00Z' });
        })
    };

    const { expirations, failedPublicKeys } = await getCsprNameExpirations(
      ['pk-a', 'pk-b', 'pk-c'],
      accountsInfo,
      network,
      repository
    );

    expect(expirations).toEqual({
      'pk-c': { csprName: 'carol.cspr', expiresAt: '2026-07-25T00:00:00Z' }
    });
    expect(failedPublicKeys).toEqual(['pk-a']);
  });

  it('resolves in batches of at most 5 concurrent requests', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const publicKeys = Array.from({ length: 12 }, (_, i) => `pk-${i}`);

    const accountsInfo = Object.fromEntries(
      publicKeys.map(pk => [`hash-${pk}`, makeInfo({ csprName: `${pk}.cspr` })])
    );
    const repository = {
      resolveAccountFromCsprName: jest.fn().mockImplementation(async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise(resolve => setTimeout(resolve, 0));
        inFlight -= 1;
        return makeInfo({ csprNameExpiresAt: '2026-07-20T00:00:00Z' });
      })
    };

    const { expirations } = await getCsprNameExpirations(
      publicKeys,
      accountsInfo,
      network,
      repository
    );

    expect(repository.resolveAccountFromCsprName).toHaveBeenCalledTimes(12);
    expect(maxInFlight).toBeLessThanOrEqual(5);
    expect(Object.keys(expirations)).toHaveLength(12);
  });
});
