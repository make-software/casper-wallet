import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultAccountsWithBalances } from '@background/redux/vault/selectors';

import { SpacingSize } from '@libs/layout';
import { AccountListRows } from '@libs/types/account';
import { List, RecipientPlate } from '@libs/ui/components';

interface MyAccountsListProps {
  handleSelectRecipient: (publicKey: string, name: string) => void;
}

export const MyAccountsList = ({
  handleSelectRecipient
}: MyAccountsListProps) => {
  const [accountsWithIds, setAccountsWithIds] = useState<AccountListRows[]>([]);

  const accounts = useSelector(selectVaultAccountsWithBalances);

  useEffect(() => {
    const accountsWithIds = accounts.map(account => ({
      ...account,
      id: account.name
    }));

    setAccountsWithIds(accountsWithIds);
  }, [accounts, setAccountsWithIds]);

  return (
    <List
      contentTop={SpacingSize.None}
      rows={accountsWithIds}
      renderRow={account => (
        <RecipientPlate
          publicKey={account.publicKey}
          name={account.name}
          handleClick={() => {
            handleSelectRecipient(account.publicKey, account.name);
          }}
        />
      )}
      marginLeftForItemSeparatorLine={56}
    />
  );
};
