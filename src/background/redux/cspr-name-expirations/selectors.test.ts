import {
  selectExpiringCsprNames,
  selectShowCsprNameExpirationBanner
} from './selectors';

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const stateWith = (mainnetMap: Record<string, any>) =>
  ({ csprNameExpirations: { mainnet: mainnetMap } }) as any;

describe('csprNameExpirations selectors', () => {
  it('returns [] when the network has no map', () => {
    expect(
      selectExpiringCsprNames({ csprNameExpirations: {} } as any, 'mainnet')
    ).toEqual([]);
  });

  it('includes only records within the next 14 days, sorted ascending', () => {
    const state = stateWith({
      pkFar: {
        csprName: 'far.cspr',
        expiresAt: daysFromNow(30),
        dismissed: false
      },
      pkB: { csprName: 'b.cspr', expiresAt: daysFromNow(10), dismissed: false },
      pkA: { csprName: 'a.cspr', expiresAt: daysFromNow(3), dismissed: false }
    });
    const result = selectExpiringCsprNames(state, 'mainnet');
    expect(result.map(r => r.csprName)).toEqual(['a.cspr', 'b.cspr']);
  });

  it('excludes already-expired records', () => {
    const state = stateWith({
      pkPast: {
        csprName: 'past.cspr',
        expiresAt: daysFromNow(-1),
        dismissed: false
      }
    });
    expect(selectExpiringCsprNames(state, 'mainnet')).toEqual([]);
  });

  it('keeps dismissed records in the list (screen shows them)', () => {
    const state = stateWith({
      pkA: { csprName: 'a.cspr', expiresAt: daysFromNow(5), dismissed: true }
    });
    expect(selectExpiringCsprNames(state, 'mainnet')).toHaveLength(1);
  });

  it('show-condition is true only when a within-14-day record is not dismissed', () => {
    const dismissedOnly = stateWith({
      pkA: { csprName: 'a.cspr', expiresAt: daysFromNow(5), dismissed: true }
    });
    expect(selectShowCsprNameExpirationBanner(dismissedOnly, 'mainnet')).toBe(
      false
    );

    const withActive = stateWith({
      pkA: { csprName: 'a.cspr', expiresAt: daysFromNow(5), dismissed: true },
      pkB: { csprName: 'b.cspr', expiresAt: daysFromNow(6), dismissed: false }
    });
    expect(selectShowCsprNameExpirationBanner(withActive, 'mainnet')).toBe(
      true
    );
  });

  it('show-condition is false when the only non-dismissed record is beyond 14 days', () => {
    const state = stateWith({
      pkFar: {
        csprName: 'far.cspr',
        expiresAt: daysFromNow(30),
        dismissed: false
      }
    });
    expect(selectShowCsprNameExpirationBanner(state, 'mainnet')).toBe(false);
  });
});
