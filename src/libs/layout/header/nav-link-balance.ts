export interface NavLinkTokenBalance {
  amount: string;
  symbol: string;
}

/**
 * A flow spending something other than CSPR passes its own token balance; without one the
 * link falls back to the account's liquid CSPR balance, and shows nothing until it loads.
 */
export const resolveNavLinkBalance = (
  tokenBalance: NavLinkTokenBalance | null | undefined,
  liquidCsprBalance: string | undefined
): NavLinkTokenBalance | null =>
  tokenBalance ??
  (liquidCsprBalance ? { amount: liquidCsprBalance, symbol: 'CSPR' } : null);
