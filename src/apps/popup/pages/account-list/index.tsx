import React from 'react';

import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { Checkbox, Hash, HashVariant, List, Typography } from '@libs/ui';
import {
  ContentContainer,
  LeftAlignedFlexColumn,
  PageContainer
} from '@libs/layout';

import { RouterPath, useTypedNavigate } from '@popup/router';
import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';

import {
  selectConnectedAccountNamesWithOrigin,
  selectIsAnyAccountConnectedWithOrigin,
  selectVaultAccounts,
  selectVaultActiveAccountName,
  selectVaultActiveOrigin
} from '@background/redux/vault/selectors';

import { ConnectionStatusBadge } from '@popup/pages/home/components/connection-status-badge';

import { Popover } from './components/popover';

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

const PopoverMenuItem = styled.div`
  cursor: pointer;
`;

export function AccountListPage() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const {
    changeActiveAccountWithEvent: changeActiveAccount,
    disconnectAccountWithEvent: disconnectAccount
  } = useAccountManager();

  const accounts = useSelector(selectVaultAccounts);
  const activeOrigin = useSelector(selectVaultActiveOrigin);
  const activeAccountName = useSelector(selectVaultActiveAccountName);
  const isAnyAccountConnected = useSelector(
    selectIsAnyAccountConnectedWithOrigin
  );

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
              <Popover
                renderMenuItems={({ closePopover }) => (
                  <>
                    {connectedAccountNames.includes(account.name) ? (
                      <PopoverMenuItem
                        onClick={e => {
                          closePopover(e);
                          activeOrigin &&
                            disconnectAccount(account.name, activeOrigin);
                        }}
                      >
                        <Typography type="body">
                          <Trans t={t}>Disconnect</Trans>
                        </Typography>
                      </PopoverMenuItem>
                    ) : (
                      <PopoverMenuItem
                        onClick={() =>
                          navigate(
                            isAnyAccountConnected
                              ? `${RouterPath.ConnectAnotherAccount}/${account.id}`
                              : RouterPath.NoConnectedAccount
                          )
                        }
                      >
                        <Typography type="body">
                          <Trans t={t}>Connect</Trans>
                        </Typography>
                      </PopoverMenuItem>
                    )}
                    <PopoverMenuItem
                      onClick={() =>
                        navigate(
                          RouterPath.AccountSettings.replace(
                            ':accountName',
                            account.name
                          )
                        )
                      }
                    >
                      <Typography type="body">
                        <Trans t={t}>Manage</Trans>
                      </Typography>
                    </PopoverMenuItem>
                  </>
                )}
              />
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
    </PageContainer>
  );
}
