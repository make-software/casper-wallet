import { CSPR_NAME_EXPIRATION_NOTICE_DAYS } from '@src/constants';

import { getExpiringCsprNames } from './expiring-cspr-names';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-07-13T00:00:00Z').getTime();

const record = (expiresAt: string, dismissed = false) => ({
  csprName: 'name.cspr',
  expiresAt,
  dismissed
});

describe('getExpiringCsprNames', () => {
  it('returns only names expiring within the notice window', () => {
    const result = getExpiringCsprNames(
      {
        'pk-past': record(new Date(NOW - DAY_MS).toISOString()),
        'pk-soon': record(new Date(NOW + 3 * DAY_MS).toISOString()),
        'pk-edge': record(
          new Date(
            NOW + CSPR_NAME_EXPIRATION_NOTICE_DAYS * DAY_MS
          ).toISOString()
        ),
        'pk-far': record(
          new Date(
            NOW + (CSPR_NAME_EXPIRATION_NOTICE_DAYS + 1) * DAY_MS
          ).toISOString()
        )
      },
      NOW
    );

    expect(result.map(({ publicKey }) => publicKey)).toEqual([
      'pk-soon',
      'pk-edge'
    ]);
  });

  it('excludes records with an invalid expiration date', () => {
    const result = getExpiringCsprNames(
      {
        'pk-bad': record('not-a-date'),
        'pk-ok': record(new Date(NOW + 2 * DAY_MS).toISOString())
      },
      NOW
    );

    expect(result.map(({ publicKey }) => publicKey)).toEqual(['pk-ok']);
  });

  it('sorts by expiration date ascending', () => {
    const result = getExpiringCsprNames(
      {
        'pk-b': record(new Date(NOW + 10 * DAY_MS).toISOString()),
        'pk-a': record(new Date(NOW + 2 * DAY_MS).toISOString())
      },
      NOW
    );

    expect(result.map(({ publicKey }) => publicKey)).toEqual(['pk-a', 'pk-b']);
  });

  it('keeps dismissed entries in the list (the list screen still shows them)', () => {
    const result = getExpiringCsprNames(
      { 'pk-a': record(new Date(NOW + 2 * DAY_MS).toISOString(), true) },
      NOW
    );

    expect(result).toHaveLength(1);
    expect(result[0].dismissed).toBe(true);
  });
});
