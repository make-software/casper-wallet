import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  Checkbox,
  Hash,
  HashVariant,
  HoverIcon,
  Link,
  List,
  SvgIcon,
  Typography
} from '@libs/ui';
import {
  ContentContainer,
  LeftAlignedFlexColumn,
  PageContainer,
  FlexRow
} from '@libs/layout';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  dispatchFetchAccountListInfo,
  getAccountInfo
} from '@libs/services/account-info';

import { RouterPath, useTypedNavigate } from '@popup/router';
import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import { ConnectionStatusBadge } from '@popup/pages/home/components/connection-status-badge';

import {
  selectConnectedAccountNamesWithOrigin,
  selectIsAnyAccountConnectedWithOrigin,
  selectVaultAccounts,
  selectVaultActiveAccountName
} from '@background/redux/vault/selectors';
import { selectActiveOrigin } from '@background/redux/session/selectors';
import { AccountListRows } from '@background/redux/vault/types';

import { Popover } from './components/popover';

import { sortAccounts } from './utils';

const ListItemContainer = styled(FlexRow)`
  min-height: 50px;
  height: 100%;

  &:hover ${HoverIcon} {
    display: inline-block;
  }
`;

const ListItemClickableContainer = styled(FlexRow)`
  width: 100%;
  cursor: pointer;
  padding-top: 14px;
  padding-bottom: 14px;
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

export function AccountListPage() {
  const [accountListRows, setAccountListRows] = useState<AccountListRows[]>([]);

  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const {
    changeActiveAccountWithEvent: changeActiveAccount,
    disconnectAccountWithEvent: disconnectAccount
  } = useAccountManager();

  const accounts = useSelector(selectVaultAccounts);
  const activeOrigin = useSelector(selectActiveOrigin);
  const activeAccountName = useSelector(selectVaultActiveAccountName);
  const isAnyAccountConnected = useSelector(
    selectIsAnyAccountConnectedWithOrigin
  );

  const connectedAccountNames = useSelector(
    selectConnectedAccountNamesWithOrigin
  );

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

    const accountsHash = accountListRows.map(account => account.accountHash);

    dispatchFetchAccountListInfo(accountsHash)
      .then(({ payload: accountInfoList }) => {
        const newAccountListRows = [...accountListRows];

        accountInfoList.forEach(accountInfo => {
          const { accountName, accountHash } = getAccountInfo(accountInfo);

          newAccountListRows.forEach(account => {
            if (account.accountHash === accountHash) {
              if (accountName != null) {
                account.name = accountName;
              }
            }
          });
        });

        setAccountListRows(newAccountListRows);
      })
      .catch(error => {
        console.error(error);
        setAccountListRows(accountListRows);
      });
  }, [accounts, activeAccountName, connectedAccountNames]);

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
                {/* Hidden account balance until a solution for fetching many balances will be ready */}
                {/*<AccountBalanceListItemContainer>*/}
                {/*  <Typography type="bodyHash">2.1M</Typography>*/}
                {/*  <Typography type="bodyHash" color="contentSecondary">*/}
                {/*    CSPR*/}
                {/*  </Typography>*/}
                {/*</AccountBalanceListItemContainer>*/}
              </ListItemClickableContainer>
              <Popover
                renderMenuItems={({ closePopover }) => (
                  <>
                    {connectedAccountNames.includes(account.name) ? (
                      <Link
                        color="inherit"
                        onClick={e => {
                          closePopover(e);
                          activeOrigin &&
                            disconnectAccount(account.name, activeOrigin);
                        }}
                      >
                        <Typography type="body">
                          <Trans t={t}>Disconnect</Trans>
                        </Typography>
                      </Link>
                    ) : (
                      <Link
                        color="inherit"
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
                      </Link>
                    )}
                    <Link
                      color="inherit"
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
                    </Link>
                  </>
                )}
              >
                <SvgIcon src="assets/icons/more.svg" />
              </Popover>
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
    </PageContainer>
  );
}
