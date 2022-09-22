import React from 'react';
import {
  Checkbox,
  Hash,
  HashVariant,
  List,
  SvgIcon,
  Typography
} from '@libs/ui';
import {
  PageContainer,
  ContentContainer,
  LeftAlignedFlexColumn
} from '@libs/layout';
import { useSelector } from 'react-redux';
import {
  selectConnectedAccountNamesWithOrigin,
  selectVaultAccounts,
  selectVaultActiveAccountName
} from '@background/redux/vault/selectors';
import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import { RouterPath, useTypedNavigate } from '@popup/router';
import styled from 'styled-components';
import { ConnectionStatusBadge } from '@popup/pages/home/components/connection-status-badge';

import { sortAccounts } from './utils';

const ListItemContainer = styled.div`
  display: flex;

  min-height: 50px;
  height: 100%;
`;

const ListItemClickableContainer = styled.div`
  display: flex;
  width: 100%;
  cursor: pointer;
  padding-top: 14px;
  padding-bottom: 14px;
  padding-left: 18px;

  & > * + * {
    padding-left: 18px;
  }
`;

const AccountBalanceListItemContainer = styled(LeftAlignedFlexColumn)``;
const AccountNameWithHashListItemContainer = styled(LeftAlignedFlexColumn)`
  width: 100%;
`;

const ListItemBurgerMenuContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 14px 18px;
  cursor: pointer;
`;

export function AccountListPage() {
  const navigate = useTypedNavigate();

  const { changeActiveAccountWithEvent: changeActiveAccount } =
    useAccountManager();

  const accounts = useSelector(selectVaultAccounts);
  const activeAccountName = useSelector(selectVaultActiveAccountName);

  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesWithOrigin
  );

  const accountListRows = sortAccounts(
    accounts,
    activeAccountName,
    connectedAccountNames
  ).map(account => ({
    ...account,
    id: account.name
  }));

  return (
    <PageContainer>
      <ContentContainer>
        <List
          rows={accountListRows}
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
                  <Hash
                    value={account.publicKey}
                    variant={HashVariant.CaptionHash}
                    truncated
                  />
                  {connectedAccountNames.includes(account.name) && (
                    <ConnectionStatusBadge
                      isConnected
                      displayContext="accountList"
                    />
                  )}
                </AccountNameWithHashListItemContainer>
                <AccountBalanceListItemContainer>
                  <Typography type="bodyHash">2.1M</Typography>
                  <Typography type="bodyHash" color="contentSecondary">
                    CSPR
                  </Typography>
                </AccountBalanceListItemContainer>
              </ListItemClickableContainer>
              <ListItemBurgerMenuContainer
                onClick={() =>
                  navigate(
                    RouterPath.AccountSettings.replace(
                      ':accountName',
                      account.name
                    )
                  )
                }
              >
                <SvgIcon src="assets/icons/more.svg" size={24} />
              </ListItemBurgerMenuContainer>
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
    </PageContainer>
  );
}
