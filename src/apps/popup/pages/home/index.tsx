import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import { RootState } from 'typesafe-actions';
import styled, { css } from 'styled-components';

import { PurposeForOpening, useWindowManager } from '@src/hooks';
import { useActiveTabOrigin } from '@hooks/use-active-tab-origin';

import { ContentContainer } from '@layout/containers';
import {
  Button,
  Checkbox,
  Hash,
  HashVariant,
  SvgIcon,
  PageTile,
  Typography,
  List
} from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  selectIsActiveAccountConnectedWithOrigin,
  selectConnectedAccountsWithOrigin,
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@popup/redux/vault/selectors';
import { useAccountManager } from '@popup/hooks/use-account-manager';

// Account info

const fullWidthAndMarginTop = css`
  margin-top: 16px;
  width: 100%;
`;

const CenteredFlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AvatarContainer = styled(CenteredFlexColumn)`
  ${fullWidthAndMarginTop};
`;
const NameAndAddressContainer = styled(CenteredFlexColumn)`
  ${fullWidthAndMarginTop};
`;
const BalanceContainer = styled(CenteredFlexColumn)`
  ${fullWidthAndMarginTop};

  & + Button {
    margin-top: 24px;
  }
`;

// List of accounts

export const ListItemContainer = styled.div`
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

const LeftAlignedFlexColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

export const AccountBalanceListItemContainer = styled(LeftAlignedFlexColumn)``;
export const AccountNameWithHashListItemContainer = styled(
  LeftAlignedFlexColumn
)`
  width: 100%;
`;

const BalanceInCSPRsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

export const ListItemBurgerMenuContainer = styled.div`
  display: flex;
  align-items: center;

  padding: 14px 18px;
  cursor: pointer;
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 16px;

  width: 100%;

  padding: ${({ theme }) => theme.padding[1.6]};
`;

export function HomePageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const { openWindow } = useWindowManager();
  const origin = useActiveTabOrigin({ currentWindow: true });
  const { changeActiveAccount, disconnectAccount } = useAccountManager({
    currentWindow: true
  });
  const isActiveAccountConnected = useSelector((state: RootState) =>
    selectIsActiveAccountConnectedWithOrigin(state, origin)
  );

  const accounts = useSelector(selectVaultAccounts);
  const activeAccount = useSelector(selectVaultActiveAccount);
  const connectedAccounts = useSelector((state: RootState) =>
    selectConnectedAccountsWithOrigin(state, origin)
  );

  const handleConnectAccount = useCallback(() => {
    if (!activeAccount || isActiveAccountConnected) {
      return;
    }

    if (connectedAccounts.length === 0) {
      navigate(RouterPath.NoConnectedAccount);
    } else {
      navigate(RouterPath.ConnectAnotherAccount);
    }
  }, [navigate, activeAccount, connectedAccounts, isActiveAccountConnected]);

  const accountListRows = accounts.map(account => ({
    ...account,
    id: account.name
  }));

  return (
    <ContentContainer>
      {activeAccount && (
        <PageTile>
          <AvatarContainer>
            <SvgIcon src="assets/icons/default-avatar.svg" size={120} />
          </AvatarContainer>
          <NameAndAddressContainer>
            <Typography type="body" weight="semiBold">
              {activeAccount.name}
            </Typography>
            <Hash
              value={activeAccount.publicKey}
              variant={HashVariant.CaptionHash}
              truncated
              withCopy
            />
          </NameAndAddressContainer>
          <BalanceContainer>
            <BalanceInCSPRsContainer>
              <Typography type="CSPR" weight="bold">
                2,133,493
              </Typography>
              <Typography type="CSPR" weight="light" color="contentSecondary">
                CSPR
              </Typography>
            </BalanceInCSPRsContainer>
            <Typography type="body" weight="regular" color="contentSecondary">
              $30,294.34
            </Typography>
          </BalanceContainer>
          {isActiveAccountConnected ? (
            <Button
              loading={origin == null}
              onClick={() =>
                origin && disconnectAccount(activeAccount.name, origin)
              }
              color="secondaryBlue"
            >
              <Trans t={t}>Disconnect</Trans>
            </Button>
          ) : (
            <Button onClick={handleConnectAccount}>
              <Trans t={t}>Connect</Trans>
            </Button>
          )}
        </PageTile>
      )}
      {accountListRows.length > 0 && (
        <List
          headerLabel={t('Accounts list')}
          rows={accountListRows}
          marginLeftForItemSeparatorLine={60}
          renderRow={account => (
            <ListItemContainer key={account.name}>
              <ListItemClickableContainer
                onClick={() => changeActiveAccount(account.name)}
              >
                <Checkbox
                  checked={
                    activeAccount ? activeAccount.name === account.name : false
                  }
                />
                <AccountNameWithHashListItemContainer>
                  <Typography
                    type="body"
                    weight={
                      activeAccount && activeAccount.name === account.name
                        ? 'semiBold'
                        : 'regular'
                    }
                  >
                    {account.name}
                  </Typography>
                  <Hash
                    value={account.publicKey}
                    variant={HashVariant.CaptionHash}
                    truncated
                  />
                </AccountNameWithHashListItemContainer>

                <AccountBalanceListItemContainer>
                  <Typography type="body" weight="regular" monospace>
                    2.1M
                  </Typography>
                  <Typography
                    type="body"
                    weight="regular"
                    monospace
                    color="contentSecondary"
                  >
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
          renderFooter={() => (
            <ButtonsContainer>
              <Button
                color="secondaryBlue"
                onClick={() =>
                  openWindow({
                    purposeForOpening: PurposeForOpening.ImportAccount
                  }).catch(e => console.error(e))
                }
              >
                <Trans t={t}>Import</Trans>
              </Button>
              <Button color="secondaryBlue">
                <Trans t={t}>Create</Trans>
              </Button>
            </ButtonsContainer>
          )}
        />
      )}
    </ContentContainer>
  );
}
