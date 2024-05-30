import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isLedgerAvailable } from '@src/utils';

import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import { RouterPath, useTypedLocation, useTypedNavigate } from '@popup/router';

import { WindowApp } from '@background/create-open-window';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectVaultActiveAccountName,
  selectVaultVisibleAccounts
} from '@background/redux/vault/selectors';

import { useWindowManager } from '@hooks/use-window-manager';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { FlexColumn, SpacingSize } from '@libs/layout';
import { AccountListRows } from '@libs/types/account';
import { Button, List } from '@libs/ui/components';
import { sortAccounts } from '@libs/ui/components/account-list/utils';

import { AccountListItem } from './account-list-item';

const ButtonContainer = styled(FlexColumn)`
  padding: 16px;
`;

interface AccountListProps {
  closeModal: (e: React.MouseEvent) => void;
}

export const AccountList = ({ closeModal }: AccountListProps) => {
  const { pathname } = useTypedLocation();
  const [accountListRows, setAccountListRows] = useState<AccountListRows[]>([]);
  const { changeActiveAccountWithEvent: changeActiveAccount } =
    useAccountManager();
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { openWindow } = useWindowManager();

  const visibleAccounts = useSelector(selectVaultVisibleAccounts);
  const activeAccountName = useSelector(selectVaultActiveAccountName);

  const connectedAccountNames =
    useSelector(selectConnectedAccountNamesWithActiveOrigin) || [];

  useEffect(() => {
    const accountListRows = sortAccounts(
      visibleAccounts,
      activeAccountName,
      connectedAccountNames
    ).map(account => ({
      ...account,
      id: account.name,
      accountHash: getAccountHashFromPublicKey(account.publicKey)
    }));

    setAccountListRows(accountListRows);
    // We need to sort the account list only on the component mount and when new accounts are added
    //   eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleAccounts]);

  return (
    <List
      rows={accountListRows}
      contentTop={SpacingSize.None}
      maxHeight={322}
      renderRow={account => {
        const isConnected = connectedAccountNames.includes(account.name);
        const isActiveAccount = activeAccountName === account.name;

        return (
          <AccountListItem
            account={account}
            isActiveAccount={isActiveAccount}
            isConnected={isConnected}
            closeModal={closeModal}
            onClick={event => {
              changeActiveAccount(account.name);
              closeModal(event);
            }}
          />
        );
      }}
      marginLeftForItemSeparatorLine={70}
      renderFooter={() => (
        <ButtonContainer gap={SpacingSize.Large}>
          <Button
            color="secondaryBlue"
            onClick={() => {
              navigate(RouterPath.CreateAccount);
            }}
          >
            <Trans t={t}>Create account</Trans>
          </Button>
          <Button
            color="secondaryBlue"
            onClick={() => {
              openWindow({
                windowApp: WindowApp.ImportAccount,
                isNewWindow: true
              }).catch(e => console.error(e));
            }}
          >
            <Trans t={t}>Import account</Trans>
          </Button>
          {isLedgerAvailable && (
            <Button
              color="secondaryBlue"
              onClick={evt => {
                if (pathname === RouterPath.ImportAccountFromLedger) {
                  closeModal(evt);
                } else {
                  navigate(RouterPath.ImportAccountFromLedger);
                }
              }}
            >
              <Trans t={t}>Connect Ledger</Trans>
            </Button>
          )}
        </ButtonContainer>
      )}
    />
  );
};
