import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  selectVaultAccountsWithBalances,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { SpacingSize } from '@libs/layout';
import { AccountListRows } from '@libs/types/account';
import { List, RecipientPlate } from '@libs/ui/components';

interface MyAccountsListProps {
  handleSelectRecipient: (publicKey: string, name: string) => void;
  accountsInfo: Record<string, IAccountInfo> | undefined;
}

export const MyAccountsList = ({
  handleSelectRecipient,
  accountsInfo
}: MyAccountsListProps) => {
  const [accountsWithIds, setAccountsWithIds] = useState<AccountListRows[]>([]);

  const accounts = useSelector(selectVaultAccountsWithBalances);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    const accountsWithIds = accounts
      .map(account => ({
        ...account,
        id: account.name
      }))
      .filter(account => account.publicKey !== activeAccount?.publicKey);

    setAccountsWithIds(accountsWithIds);
  }, [accounts, setAccountsWithIds, activeAccount]);

  return (
    <List
      contentTop={SpacingSize.None}
      rows={accountsWithIds}
      renderRow={account => {
        const accountHash = getAccountHashFromPublicKey(account.publicKey);

        const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
        const brandingLogo =
          accountsInfo && accountsInfo[accountHash]?.brandingLogo;

        return (
          <RecipientPlate
            publicKey={account.publicKey}
            name={account.name}
            handleClick={() => {
              handleSelectRecipient(account.publicKey, account.name);
            }}
            csprName={csprName}
            brandingLogo={brandingLogo}
          />
        );
      }}
      marginLeftForItemSeparatorLine={56}
    />
  );
};
