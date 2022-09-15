import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import { RootState } from 'typesafe-actions';
import styled, { css } from 'styled-components';

import { ContentContainer } from '@src/libs/layout/containers';
import {
  Button,
  Hash,
  Link,
  HashVariant,
  SvgIcon,
  PageTile,
  Typography
} from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  selectIsActiveAccountConnectedWithOrigin,
  selectConnectedAccountsWithOrigin,
  selectVaultActiveAccount,
  selectVaultActiveOrigin,
  selectCountOfAccounts
} from '@src/background/redux/vault/selectors';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import { SubmenuBarContainer } from '@layout/header/header-submenu-bar';

import { ConnectionStatusBadge } from './components/connection-status-badge';

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
  flex-direction: column;
  justify-content: space-around;
  gap: 16px;

  width: 100%;

  margin-top: 16px;
`;

export function HomePageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const activeOrigin = useSelector(selectVaultActiveOrigin);
  const { disconnectAccountWithEvent: disconnectAccount } = useAccountManager();
  const isActiveAccountConnected = useSelector(
    selectIsActiveAccountConnectedWithOrigin
  );

  const activeAccount = useSelector(selectVaultActiveAccount);
  const connectedAccounts = useSelector((state: RootState) =>
    selectConnectedAccountsWithOrigin(state)
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

  return (
    <ContentContainer>
      {activeAccount && (
        <PageTile>
          <ConnectionStatusBadge isConnected={isActiveAccountConnected} />
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
              withCopyOnClick
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
          <ButtonsContainer>
            {isActiveAccountConnected ? (
              <Button
                disabled={activeOrigin == null}
                onClick={() =>
                  activeOrigin &&
                  disconnectAccount(activeAccount.name, activeOrigin)
                }
                color="secondaryBlue"
              >
                <Trans t={t}>Disconnect</Trans>
              </Button>
            ) : (
              <Button
                disabled={activeOrigin == null}
                onClick={handleConnectAccount}
                color="primaryRed"
              >
                <Trans t={t}>Connect</Trans>
              </Button>
            )}
            <Button
              color="secondaryBlue"
              onClick={() =>
                navigate(
                  RouterPath.AccountSettings.replace(
                    ':accountName',
                    activeAccount.name
                  )
                )
              }
            >
              <Trans t={t}>Manage account</Trans>
            </Button>
          </ButtonsContainer>
        </PageTile>
      )}
    </ContentContainer>
  );
}

export function HomePageSubmenuActionGroup() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const countOfAccounts = useSelector(selectCountOfAccounts);

  return (
    <SubmenuBarContainer>
      <LeftAlignedFlexColumn>
        <Typography type="body" weight="regular">
          <Trans t={t}>Accounts list</Trans>
        </Typography>

        <Typography
          type="listSubtext"
          weight="regular"
          color="contentSecondary"
        >
          {countOfAccounts} {countOfAccounts > 1 ? t('accounts') : t('account')}
        </Typography>
      </LeftAlignedFlexColumn>

      <Typography type="body" weight="bold">
        <Link color="fillBlue" onClick={() => navigate(RouterPath.AccountList)}>
          <Trans t={t}>Switch account</Trans>
        </Link>
      </Typography>
    </SubmenuBarContainer>
  );
}
