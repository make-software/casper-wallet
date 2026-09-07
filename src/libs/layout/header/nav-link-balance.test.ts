import { resolveNavLinkBalance } from './nav-link-balance';

describe('resolveNavLinkBalance', () => {
  it('shows the passed token balance instead of the CSPR one', () => {
    expect(
      resolveNavLinkBalance({ amount: '1,200.5', symbol: 'SHIBOO' }, '87.123')
    ).toEqual({ amount: '1,200.5', symbol: 'SHIBOO' });
  });

  it('keeps a zero token balance rather than falling back to CSPR', () => {
    expect(
      resolveNavLinkBalance({ amount: '0', symbol: 'FATSO' }, '87.123')
    ).toEqual({ amount: '0', symbol: 'FATSO' });
  });

  it('falls back to the liquid CSPR balance when no token balance is given', () => {
    expect(resolveNavLinkBalance(undefined, '87.123')).toEqual({
      amount: '87.123',
      symbol: 'CSPR'
    });
    expect(resolveNavLinkBalance(null, '87.123')).toEqual({
      amount: '87.123',
      symbol: 'CSPR'
    });
  });

  it('renders nothing while neither balance has loaded', () => {
    expect(resolveNavLinkBalance(null, undefined)).toBeNull();
    expect(resolveNavLinkBalance(null, '')).toBeNull();
  });
});
