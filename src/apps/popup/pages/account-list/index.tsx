import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  Checkbox,
  Hash,
  HashVariant,
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
import { getAllAccountsInfo } from '@libs/services/account-info';

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
import { Account } from '@background/redux/vault/types';

import { Popover } from './components/popover';

import { sortAccounts } from './utils';

const ListItemContainer = styled(FlexRow)`
  min-height: 50px;
  height: 100%;
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

export interface AccountListRows extends Account {
  id: string;
}

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

    getAllAccountsInfo(accountsHash)
      .then(({ payload: accountInfoList }) => {
        if (accountInfoList.length) {
          accountInfoList.forEach(accountInfo => {
            const accountName = accountInfo?.info?.owner?.name;
            const accountHash = accountInfo.account_hash;

            const newAccountListRows = accountListRows.map(account => {
              if (account.accountHash === accountHash) {
                if (accountName != null) {
                  account.name = accountName;
                }
              }

              return account;
            });

            setAccountListRows(newAccountListRows);
          });
        } else {
          setAccountListRows(accountListRows);
        }
      })
      .catch(error => {
        console.error(error);
        setAccountListRows(accountListRows);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
