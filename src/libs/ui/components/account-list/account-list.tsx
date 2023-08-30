import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';

import {
  AlignedFlexRow,
  CenteredFlexRow,
  FlexColumn,
  FlexRow,
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
  Button,
  Checkbox,
  Hash,
  HashVariant,
  List,
  Typography,
  ConnectionStatusBadge
} from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { WindowApp } from '@background/create-open-window';
import { useWindowManager } from '@src/hooks';

const ListItemContainer = styled(FlexColumn)`
  min-height: 68px;
  height: 100%;

  padding: 12px 8px 12px 16px;
`;

const ListItemClickableContainer = styled(FlexRow)`
  width: 100%;
  cursor: pointer;
`;

const AccountNameWithHashListItemContainer = styled(LeftAlignedFlexColumn)`
  width: 100%;

  padding-left: 16px;
`;

const ConnectionStatusBadgeContainer = styled.div`
  margin-left: 44px;
`;

const ButtonContainer = styled(CenteredFlexRow)`
  padding: 16px;
`;

interface AccountListProps {
  closeModal: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
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
    // We need to sort the account list only on the component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <List
      rows={accountListRows}
      contentTop={SpacingSize.None}
      maxHeight={380}
      renderRow={(account, index) => {
        const isConnected = connectedAccountNames.includes(account.name);

        return (
          <ListItemContainer key={account.name}>
            <AlignedFlexRow>
              <ListItemClickableContainer
                onClick={event => {
                  changeActiveAccount(account.name);
                  closeModal(event);
                }}
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
                    withTag={account.imported}
                    placement={
                      index === accountListRows.length - 1
                        ? 'topRight'
                        : 'bottomRight'
                    }
                  />
                </AccountNameWithHashListItemContainer>
              </ListItemClickableContainer>
              <AccountActionsMenuPopover account={account} />
            </AlignedFlexRow>
            {isConnected && (
              <ConnectionStatusBadgeContainer>
                <ConnectionStatusBadge
                  isConnected
                  displayContext="accountList"
                />
              </ConnectionStatusBadgeContainer>
            )}
          </ListItemContainer>
        );
      }}
      marginLeftForItemSeparatorLine={60}
      renderFooter={() => (
        <ButtonContainer gap={SpacingSize.Large}>
          <Button
            color="secondaryBlue"
            flexWidth
            onClick={() => {
              openWindow({
                windowApp: WindowApp.ImportAccount,
                isNewWindow: false
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
