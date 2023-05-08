import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  Checkbox,
  Hash,
  HashVariant,
  HoverCopyIcon,
  List,
  Typography
} from '@libs/ui';
import {
  ContentContainer,
  LeftAlignedFlexColumn,
  PageContainer,
  FlexRow,
  SpacingSize
} from '@libs/layout';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import { ConnectionStatusBadge } from '@popup/pages/home/components/connection-status-badge';

import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectVaultAccounts,
  selectVaultActiveAccountName
} from '@background/redux/vault/selectors';
import { AccountListRows } from '@background/redux/vault/types';
import { AccountActionsMenuPopover } from '@libs/ui/components/account-popover/account-popover';

import { sortAccounts } from './utils';

const ListItemContainer = styled(FlexRow)`
  min-height: 50px;
  height: 100%;

  &:hover ${HoverCopyIcon} {
    display: inline-block;
  }
`;

const ListItemClickableContainer = styled(FlexRow)`
  width: 100%;
  cursor: pointer;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-left: 18px;

  & > * + * {
    padding-left: 18px;
  }
`;
// Hidden account balance until a solution for fetching many balances will be ready
// https://github.com/make-software/casper-wallet/issues/374
// const AccountBalanceListItemContainer = styled(LeftAlignedFlexColumn)``;
const AccountNameWithHashListItemContainer = styled(LeftAlignedFlexColumn)`
  width: 100%;
`;

const ConnectionStatusBadgeContainer = styled.div`
  margin-top: 8px;
`;

const HashContainer = styled.div`
  margin-top: 4px;
`;

const PopoverContainer = styled.div`
  padding: 26px 8px 26px 0;
`;

export function AccountListPage() {
  const [accountListRows, setAccountListRows] = useState<AccountListRows[]>([]);

  const { changeActiveAccountWithEvent: changeActiveAccount } =
    useAccountManager();

  const accounts = useSelector(selectVaultAccounts);
  const activeAccountName = useSelector(selectVaultActiveAccountName);

  const connectedAccountNames =
    useSelector(selectConnectedAccountNamesWithActiveOrigin) || [];

  useEffect(() => {
    const accountListRows = sortAccounts(
      accounts,
      activeAccountName,
      connectedAccountNames
    ).map(account => ({
      ...account,
      id: account.name,
      accountHash: getAccountHashFromPublicKey(account.publicKey)
    }));

    setAccountListRows(accountListRows);
    // We need to sort the account list only on the component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer>
      <ContentContainer>
        <List
          rows={accountListRows}
          contentTop={SpacingSize.Small}
          renderRow={account => (
            <ListItemContainer key={account.name}>
              <ListItemClickableContainer
                onClick={() => changeActiveAccount(account.name)}
              >
                <Checkbox
                  checked={
                    activeAccountName
                      ? activeAccountName === account.name
                      : false
                  }
                />
                <AccountNameWithHashListItemContainer>
                  <Typography
                    type={
                      activeAccountName && activeAccountName === account.name
                        ? 'bodySemiBold'
                        : 'body'
                    }
                  >
                    {account.name}
                  </Typography>
                  <HashContainer>
                    <Hash
                      value={account.publicKey}
                      variant={HashVariant.CaptionHash}
                      truncated
                      withTag={account.imported}
                      withCopyIconOnHover
                    />
                  </HashContainer>
                  {connectedAccountNames.includes(account.name) && (
                    <ConnectionStatusBadgeContainer>
                      <ConnectionStatusBadge
                        isConnected
                        displayContext="accountList"
                      />
                    </ConnectionStatusBadgeContainer>
                  )}
                </AccountNameWithHashListItemContainer>
              </ListItemClickableContainer>
              <PopoverContainer>
                <AccountActionsMenuPopover account={account} />
              </PopoverContainer>
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
    </PageContainer>
  );
}
