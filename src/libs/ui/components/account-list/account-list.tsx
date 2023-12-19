import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';

import {
  AlignedFlexRow,
  CenteredFlexRow,
  FlexColumn,
  LeftAlignedFlexColumn,
  SpacingSize
} from '@libs/layout';
import { AccountListRows } from '@background/redux/vault/types';
import { useAccountManager } from '@popup/hooks/use-account-actions-with-events';
import {
  selectConnectedAccountNamesWithActiveOrigin,
  selectVaultAccounts,
  selectVaultActiveAccountName
} from '@background/redux/vault/selectors';
import { sortAccounts } from '@libs/ui/components/account-list/utils';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  AccountActionsMenuPopover,
  Avatar,
  Button,
  Hash,
  HashVariant,
  List,
  Typography
} from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { WindowApp } from '@background/create-open-window';
import { useWindowManager } from '@src/hooks';

const ListItemContainer = styled(FlexColumn)`
  min-height: 68px;
  height: 100%;

  padding: 16px 8px 16px 16px;
`;

const ListItemClickableContainer = styled(AlignedFlexRow)`
  width: 100%;
  cursor: pointer;
`;

const AccountNameWithHashListItemContainer = styled(LeftAlignedFlexColumn)`
  width: 100%;
`;

const ButtonContainer = styled(CenteredFlexRow)`
  padding: 16px;
`;

interface AccountListProps {
  closeModal: (e: React.MouseEvent) => void;
}

export const AccountList = ({ closeModal }: AccountListProps) => {
  const [accountListRows, setAccountListRows] = useState<AccountListRows[]>([]);

  const { changeActiveAccountWithEvent: changeActiveAccount } =
    useAccountManager();
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const { openWindow } = useWindowManager();

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
    // We need to sort the account list only on the component mount and when new accounts are added
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  return (
    <List
      rows={accountListRows}
      contentTop={SpacingSize.None}
      maxHeight={402}
      renderRow={account => {
        const isConnected = connectedAccountNames.includes(account.name);
        const isActiveAccount = activeAccountName === account.name;

        return (
          <ListItemContainer key={account.name}>
            <AlignedFlexRow>
              <ListItemClickableContainer
                onClick={event => {
                  changeActiveAccount(account.name);
                  closeModal(event);
                }}
                gap={SpacingSize.Medium}
              >
                <Avatar
                  size={38}
                  publicKey={account.publicKey}
                  withConnectedStatus
                  isConnected={isConnected}
                  displayContext="accountList"
                  isActiveAccount={isActiveAccount}
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
                    withoutTooltip
                    withTag={account.imported}
                  />
                </AccountNameWithHashListItemContainer>
              </ListItemClickableContainer>
              <AccountActionsMenuPopover
                account={account}
                onClick={closeModal}
              />
            </AlignedFlexRow>
          </ListItemContainer>
        );
      }}
      marginLeftForItemSeparatorLine={70}
      renderFooter={() => (
        <ButtonContainer gap={SpacingSize.Large}>
          <Button
            color="secondaryBlue"
            flexWidth
            onClick={() => {
              openWindow({
                windowApp: WindowApp.ImportAccount,
                isNewWindow: true
              }).catch(e => console.error(e));
            }}
          >
            <Trans t={t}>Import</Trans>
          </Button>
          <Button
            color="secondaryBlue"
            flexWidth
            onClick={() => {
              navigate(RouterPath.CreateAccount);
            }}
          >
            <Trans t={t}>Create</Trans>
          </Button>
        </ButtonContainer>
      )}
    />
  );
};
