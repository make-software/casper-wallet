/** The balance rendered next to the Back link: an amount ready to display, and its symbol. */
export interface NavLinkTokenBalance {
  amount: string;
  symbol: string;
}

/**
 * A flow spending something other than CSPR passes its own token balance. Without one the link
 * falls back to the account's liquid CSPR balance, and shows nothing until that has loaded.
 */
export const resolveNavLinkBalance = (
  tokenBalance: NavLinkTokenBalance | null | undefined,
  liquidCsprBalance: string | undefined
): NavLinkTokenBalance | null =>
  tokenBalance ??
  (liquidCsprBalance ? { amount: liquidCsprBalance, symbol: 'CSPR' } : null);
