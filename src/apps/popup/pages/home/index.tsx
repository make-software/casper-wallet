import React, { useCallback } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled, { css } from 'styled-components';
import { RootState } from 'typesafe-actions';

import { HeaderSubmenuBarNavLink, LinkType } from '@libs/layout';
import {
  CenteredFlexColumn,
  ContentContainer,
  FlexRow,
  LeftAlignedFlexColumn,
  SpaceAroundFlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize,
  TileContainer
} from '@src/libs/layout/containers';

import {
  Avatar,
  Button,
  getFontSizeBasedOnTextLength,
  Hash,
  HashDisplayContext,
  HashVariant,
  Link,
  SvgIcon,
  Tile,
  Typography
} from '@libs/ui';

import { selectCasperNetworkSettingsBaseOnActiveNetworkSetting } from '@src/background/redux/settings/selectors';
import { RouterPath, useTypedNavigate } from '@popup/router';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import { getBlockExplorerAccountUrl } from '@src/constants';
import {
  selectActiveOrigin,
  selectConnectedAccountsWithActiveOrigin,
  selectIsActiveAccountConnectedWithActiveOrigin,
  selectVaultActiveAccount,
  selectCountOfAccounts
} from '@src/background/redux/root-selector';
import { useActiveAccountBalance } from '@hooks/use-active-account-balance';

import { ConnectionStatusBadge } from './components/connection-status-badge';

export const HomePageContentContainer = styled(ContentContainer)`
  padding-bottom: 0;
`;

// Account info

const fullWidthAndMarginTop = css`
  margin-top: 16px;
  width: 100%;
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

const ButtonsContainer = styled(SpaceAroundFlexColumn)`
  width: 100%;
  margin-top: 24px;
`;

export function HomePageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const activeOrigin = useSelector(selectActiveOrigin);
  const { disconnectAccountWithEvent: disconnectAccount } = useAccountManager();
  const isActiveAccountConnected = useSelector(
    selectIsActiveAccountConnectedWithActiveOrigin
  );

  const activeAccount = useSelector(selectVaultActiveAccount);
  const connectedAccounts = useSelector((state: RootState) =>
    selectConnectedAccountsWithActiveOrigin(state)
  );
  const { casperLiveUrl } = useSelector(
    selectCasperNetworkSettingsBaseOnActiveNetworkSetting
  );

  const { balance } = useActiveAccountBalance();

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
    <HomePageContentContainer>
      {activeAccount && (
        <Tile>
          <TileContainer>
            <SpaceBetweenFlexRow>
              <ConnectionStatusBadge
                isConnected={isActiveAccountConnected}
                displayContext="home"
              />
              <Link
                href={getBlockExplorerAccountUrl(
                  casperLiveUrl,
                  activeAccount.publicKey
                )}
                target="_blank"
                color="inherit"
                title={t('View account in CSPR.live')}
              >
                <SvgIcon src="assets/icons/external-link.svg" />
              </Link>
            </SpaceBetweenFlexRow>
            <Avatar
              publicKey={activeAccount.publicKey}
              top={SpacingSize.Medium}
            />
            <NameAndAddressContainer>
              <Typography type="bodySemiBold">{activeAccount.name}</Typography>
              <Hash
                value={activeAccount.publicKey}
                variant={HashVariant.CaptionHash}
                truncated
                withCopyOnSelfClick
                displayContext={HashDisplayContext.Home}
              />
            </NameAndAddressContainer>
            <BalanceContainer>
              <FlexRow gap={SpacingSize.Small} wrap="wrap">
                <Typography
                  type="CSPRBold"
                  fontSize={getFontSizeBasedOnTextLength(balance.amount.length)}
                >
                  {balance.amount}
                </Typography>
                <Typography
                  type="CSPRLight"
                  color="contentSecondary"
                  fontSize={getFontSizeBasedOnTextLength(balance.amount.length)}
                >
                  CSPR
                </Typography>
              </FlexRow>
              <Typography type="body" color="contentSecondary">
                {balance.fiatAmount}
              </Typography>
            </BalanceContainer>
            <ButtonsContainer gap={SpacingSize.Large}>
              {isActiveAccountConnected ? (
                <Button
                  disabled={activeOrigin == null}
                  onClick={() =>
                    activeOrigin &&
                    disconnectAccount(activeAccount.name, activeOrigin)
                  }
                  color="secondaryRed"
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
              <Button
                color="secondaryBlue"
                onClick={() => {
                  navigate(RouterPath.Transfer);
                }}
              >
                Transfer
              </Button>
            </ButtonsContainer>
          </TileContainer>
        </Tile>
      )}
    </HomePageContentContainer>
  );
}

interface HomePageHeaderSubmenuItemsProps {
  linkType: LinkType;
}

export function HomePageHeaderSubmenuItems({
  linkType
}: HomePageHeaderSubmenuItemsProps) {
  const { t } = useTranslation();
  const countOfAccounts = useSelector(selectCountOfAccounts);

  return (
    <>
      <LeftAlignedFlexColumn>
        <Typography type="body">
          <Trans t={t}>Accounts list</Trans>
        </Typography>

        <Typography type="listSubtext" color="contentSecondary">
          {countOfAccounts} {countOfAccounts > 1 ? t('accounts') : t('account')}
        </Typography>
      </LeftAlignedFlexColumn>

      <HeaderSubmenuBarNavLink linkType={linkType} />
    </>
  );
}
