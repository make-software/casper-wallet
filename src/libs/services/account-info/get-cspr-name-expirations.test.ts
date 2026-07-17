import { CSPR_NAME_EXPIRATION_NOTICE_DAYS } from '@src/constants';

import { getCsprNameExpirations } from './get-cspr-name-expirations';

jest.mock('@libs/entities/Account', () => ({
  getAccountHashFromPublicKey: (publicKey: string) => `hash-${publicKey}`
}));

const network = 'mainnet' as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-07-17T00:00:00Z');
/** Comfortably outside the notice window (rule 2) */
const farFutureDate = new Date(
  now + (CSPR_NAME_EXPIRATION_NOTICE_DAYS + 30) * DAY_MS
).toISOString();
/** Inside the notice window, still in the future (rules 3/4) */
const withinWindowDate = new Date(now + 5 * DAY_MS).toISOString();
/** Already past (rule 1) */
const expiredDate = new Date(now - DAY_MS).toISOString();

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
      repository,
      {},
      now
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
      repository,
      {},
      now
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
      repository,
      {},
      now
    );

    expect(repository.resolveAccountFromCsprName).toHaveBeenCalledTimes(12);
    expect(maxInFlight).toBeLessThanOrEqual(5);
    expect(Object.keys(expirations)).toHaveLength(12);
  });

  describe('stored-record gating', () => {
    const accountsInfo = {
      'hash-pk-a': makeInfo({ csprName: 'alice.cspr' })
    };

    it('skips resolution and re-emits the stored record when expiration is beyond the notice window', async () => {
      const repository = { resolveAccountFromCsprName: jest.fn() };

      const { expirations, failedPublicKeys } = await getCsprNameExpirations(
        ['pk-a'],
        accountsInfo,
        network,
        repository,
        {
          'pk-a': {
            csprName: 'alice.cspr',
            expiresAt: farFutureDate,
            dismissed: false
          }
        },
        now
      );

      expect(repository.resolveAccountFromCsprName).not.toHaveBeenCalled();
      expect(expirations).toEqual({
        'pk-a': { csprName: 'alice.cspr', expiresAt: farFutureDate }
      });
      expect(failedPublicKeys).toEqual([]);
    });

    it('re-resolves a record within the notice window when it is not dismissed', async () => {
      const renewedDate = farFutureDate;
      const repository = {
        resolveAccountFromCsprName: jest
          .fn()
          .mockResolvedValue(
            makeInfo({ csprName: 'alice.cspr', csprNameExpiresAt: renewedDate })
          )
      };

      const { expirations } = await getCsprNameExpirations(
        ['pk-a'],
        accountsInfo,
        network,
        repository,
        {
          'pk-a': {
            csprName: 'alice.cspr',
            expiresAt: withinWindowDate,
            dismissed: false
          }
        },
        now
      );

      expect(repository.resolveAccountFromCsprName).toHaveBeenCalledTimes(1);
      expect(expirations).toEqual({
        'pk-a': { csprName: 'alice.cspr', expiresAt: renewedDate }
      });
    });

    it('skips resolution for a dismissed record within the notice window', async () => {
      const repository = { resolveAccountFromCsprName: jest.fn() };

      const { expirations } = await getCsprNameExpirations(
        ['pk-a'],
        accountsInfo,
        network,
        repository,
        {
          'pk-a': {
            csprName: 'alice.cspr',
            expiresAt: withinWindowDate,
            dismissed: true
          }
        },
        now
      );

      expect(repository.resolveAccountFromCsprName).not.toHaveBeenCalled();
      expect(expirations).toEqual({
        'pk-a': { csprName: 'alice.cspr', expiresAt: withinWindowDate }
      });
    });

    it('makes no resolver calls at all when every stored record is dismissed', async () => {
      const repository = { resolveAccountFromCsprName: jest.fn() };

      const { expirations } = await getCsprNameExpirations(
        ['pk-a', 'pk-b'],
        {
          'hash-pk-a': makeInfo({ csprName: 'alice.cspr' }),
          'hash-pk-b': makeInfo({ csprName: 'bob.cspr' })
        },
        network,
        repository,
        {
          'pk-a': {
            csprName: 'alice.cspr',
            expiresAt: withinWindowDate,
            dismissed: true
          },
          'pk-b': {
            csprName: 'bob.cspr',
            expiresAt: withinWindowDate,
            dismissed: true
          }
        },
        now
      );

      expect(repository.resolveAccountFromCsprName).not.toHaveBeenCalled();
      expect(Object.keys(expirations)).toHaveLength(2);
    });

    it('re-resolves when the stored csprName differs from the current one', async () => {
      const repository = {
        resolveAccountFromCsprName: jest.fn().mockResolvedValue(
          makeInfo({
            csprName: 'alice.cspr',
            csprNameExpiresAt: farFutureDate
          })
        )
      };

      const { expirations } = await getCsprNameExpirations(
        ['pk-a'],
        accountsInfo,
        network,
        repository,
        {
          'pk-a': {
            csprName: 'old-alice.cspr',
            expiresAt: farFutureDate,
            dismissed: true
          }
        },
        now
      );

      expect(repository.resolveAccountFromCsprName).toHaveBeenCalledWith(
        'alice.cspr',
        network,
        false
      );
      expect(expirations).toEqual({
        'pk-a': { csprName: 'alice.cspr', expiresAt: farFutureDate }
      });
    });

    it('re-resolves an expired stored record and drops it when the name no longer resolves', async () => {
      const repository = {
        resolveAccountFromCsprName: jest.fn().mockResolvedValue(null)
      };

      const { expirations, failedPublicKeys } = await getCsprNameExpirations(
        ['pk-a'],
        accountsInfo,
        network,
        repository,
        {
          'pk-a': {
            csprName: 'alice.cspr',
            expiresAt: expiredDate,
            dismissed: true
          }
        },
        now
      );

      expect(repository.resolveAccountFromCsprName).toHaveBeenCalledTimes(1);
      expect(expirations).toEqual({});
      expect(failedPublicKeys).toEqual([]);
    });
  });
});
