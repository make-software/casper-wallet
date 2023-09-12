import { Account } from '@background/redux/vault/types';

export function sortAccounts(
  accounts: Account[],
  activeAccountName: string | null,
  connectedAccountNames: string[]
) {
  const accountsWithoutActiveAccount = (
    activeAccountName != null
      ? accounts.filter(account => account.name !== activeAccountName)
      : accounts
  ).sort((a: Account, b: Account) => {
    const aIsConnectedAccount = connectedAccountNames.includes(a.name);
    const bIsConnectedAccount = connectedAccountNames.includes(b.name);

    if (
      (aIsConnectedAccount && bIsConnectedAccount) ||
      (!aIsConnectedAccount && !bIsConnectedAccount)
    ) {
      return 0;
    }

    return aIsConnectedAccount && !bIsConnectedAccount ? -1 : 1;
  });

  const activeAccount = accounts.find(
    account => account.name === activeAccountName
  );

  return activeAccount != null
    ? [activeAccount, ...accountsWithoutActiveAccount]
    : accountsWithoutActiveAccount;
}
