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
  TileContainer,
  VerticalSpaceContainer
} from '@src/libs/layout/containers';

import {
  Avatar,
  Button,
  getFontSizeBasedOnTextLength,
  Hash,
  HashDisplayContext,
  HashVariant,
  Link,
  Tile,
  Typography
} from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import {
  selectActiveOrigin,
  selectConnectedAccountsWithActiveOrigin,
  selectIsActiveAccountConnectedWithActiveOrigin,
  selectVaultActiveAccount,
  selectCountOfAccounts
} from '@src/background/redux/root-selector';
import { useActiveAccountBalance } from '@hooks/use-active-account-balance';
import { AccountActionsMenuPopover } from '@libs/ui/components/account-popover/account-popover';
import { Tab, Tabs } from '@libs/ui/components/tabs/tabs';
import { formatNumber, motesToCSPR } from '@src/libs/ui/utils/formatters';
import { TokensList } from '@popup/pages/home/components/tokens-list';

import { ConnectionStatusBadge } from './components/connection-status-badge';

export const HomePageContentContainer = styled(ContentContainer)`
  padding-bottom: 0;
`;

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
              <AccountActionsMenuPopover account={activeAccount} />
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
                  fontSize={getFontSizeBasedOnTextLength(
                    balance.amountMotes?.length || 1
                  )}
                >
                  {balance.amountMotes == null
                    ? '-'
                    : formatNumber(motesToCSPR(balance.amountMotes), {
                        precision: { max: 5 }
                      })}
                </Typography>
                <Typography
                  type="CSPRLight"
                  color="contentSecondary"
                  fontSize={getFontSizeBasedOnTextLength(
                    balance.amountMotes?.length || 1
                  )}
                >
                  CSPR
                </Typography>
              </FlexRow>
              <Typography type="body" color="contentSecondary">
                {balance.amountFiat}
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
            </ButtonsContainer>
          </TileContainer>
        </Tile>
      )}
      <VerticalSpaceContainer top={SpacingSize.XL}>
        <Tabs>
          <Tab tabName="Tokens">
            <TokensList />
          </Tab>
          <Tab tabName="Activity" />
          <Tab tabName="NFTs" />
        </Tabs>
      </VerticalSpaceContainer>
      <Link color="inherit" onClick={() => navigate(RouterPath.Transfer)}>
        Transfer Test
      </Link>
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
