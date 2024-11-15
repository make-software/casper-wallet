import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import { Maybe } from 'casper-wallet-core/src/typings/common';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { SpacingSize } from '@libs/layout';
import { AccountListRows } from '@libs/types/account';
import { List, RecipientPlate, Tile, Typography } from '@libs/ui/components';

const Container = styled.div`
  padding: 16px;
`;

interface MyAccountsListProps {
  handleSelectRecipient: (publicKey: string, name: string) => void;
  accountsInfo: Record<string, IAccountInfo> | undefined;
  inputValue: string;
}

interface AccountListState extends AccountListRows {
  csprName: Maybe<string> | undefined;
  brandingLogo: Maybe<string> | undefined;
}

export const MyAccountsList = ({
  handleSelectRecipient,
  accountsInfo,
  inputValue
}: MyAccountsListProps) => {
  const [accountsWithIds, setAccountsWithIds] = useState<AccountListState[]>(
    []
  );

  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    const accountsWithIds = accounts
      .map(account => {
        const accountHash = getAccountHashFromPublicKey(account.publicKey);

        const csprName = accountsInfo && accountsInfo[accountHash]?.csprName;
        const brandingLogo =
          accountsInfo && accountsInfo[accountHash]?.brandingLogo;

        return {
          ...account,
          id: account.name,
          csprName,
          brandingLogo
        };
      })
      .filter(account => account.publicKey !== activeAccount?.publicKey)
      .filter(
        account =>
          account?.name
            .toLowerCase()
            .includes(inputValue?.toLowerCase() || '') ||
          account?.csprName
            ?.toLowerCase()
            .includes(inputValue?.toLowerCase() || '')
      );

    setAccountsWithIds(accountsWithIds);
  }, [accounts, setAccountsWithIds, activeAccount, accountsInfo, inputValue]);

  if (accountsWithIds.length === 0) {
    return (
      <Tile>
        <Container>
          <Typography type="body" color="contentPrimary" textAlign="center">
            No accounts found
          </Typography>
        </Container>
      </Tile>
    );
  }

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
