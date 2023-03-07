import React, { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import { RootState } from 'typesafe-actions';
import styled from 'styled-components';

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
import { LinkType, HeaderSubmenuBarNavLink } from '@libs/layout';

import {
  Button,
  Hash,
  HashVariant,
  Typography,
  Avatar,
  SvgIcon,
  Link,
  HashDisplayContext,
  Tile
} from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectActiveOrigin } from '@src/background/redux/session/selectors';
import {
  selectIsActiveAccountConnectedWithOrigin,
  selectConnectedAccountsWithOrigin,
  selectVaultActiveAccount,
  selectVaultCountOfAccounts
} from '@src/background/redux/vault/selectors';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import {
  ActiveAccountBalance,
  dispatchFetchActiveAccountBalance
} from '@libs/services/balance-service';
import {
  formatCurrency,
  formatNumber,
  motesToCSPR,
  motesToCurrency
} from '@libs/ui/utils/formatters';
import { getBlockExplorerAccountUrl } from '@src/constants';

import { ConnectionStatusBadge } from './components/connection-status-badge';
import { useAccountInfo } from '@hooks/use-account-info/use-account-info';

interface AccountInfoStandard {
  isAccountInfoStandardNameExist?: boolean;
}

export const HomePageContentContainer = styled(ContentContainer)`
  padding-bottom: 0;
`;

const AccountInfoContainer = styled(CenteredFlexColumn)<AccountInfoStandard>`
  margin-top: ${({ isAccountInfoStandardNameExist }) =>
    isAccountInfoStandardNameExist ? '8px' : '16px'};
  width: 100%;
  text-align: center;
`;

const ButtonsContainer = styled(SpaceAroundFlexColumn)<AccountInfoStandard>`
  width: 100%;
  margin-top: ${({ isAccountInfoStandardNameExist }) =>
    isAccountInfoStandardNameExist ? '16px' : '24px'};
`;

export function HomePageContent() {
  const navigate = useTypedNavigate();
  const { t } = useTranslation();

  const [balance, setBalance] = useState<ActiveAccountBalance>({
    amount: '-',
    fiatAmount: '-'
  });

  const activeOrigin = useSelector(selectActiveOrigin);
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

  const { accountLogo, accountInfoStandardName, loadingAccountInfo } =
    useAccountInfo(activeAccount);

  useEffect(() => {
    dispatchFetchActiveAccountBalance(activeAccount?.publicKey)
      .then(({ payload: { balance, currencyRate } }) => {
        if (balance != null && currencyRate != null) {
          const amount = formatNumber(motesToCSPR(balance));
          const fiatAmount = formatCurrency(
            motesToCurrency(balance, currencyRate),
            'USD',
            { precision: 2 }
          );

          setBalance({ amount, fiatAmount });
        }
      })
      .catch(error => {
        console.error('Balance request failed:', error);
      });
  }, [activeAccount?.publicKey]);

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
                href={getBlockExplorerAccountUrl(activeAccount.publicKey)}
                target="_blank"
                color="inherit"
                title={t('View account in CSPR.live')}
              >
                <SvgIcon src="assets/icons/external-link.svg" />
              </Link>
            </SpaceBetweenFlexRow>
            <Avatar
              publicKey={activeAccount.publicKey}
              src={accountLogo}
              loadingAccountInfo={loadingAccountInfo}
            />
            <AccountInfoContainer
              isAccountInfoStandardNameExist={Boolean(accountInfoStandardName)}
            >
              <Typography type="bodySemiBold" loading={loadingAccountInfo}>
                {activeAccount.name}
              </Typography>
              {accountInfoStandardName && (
                <Typography type="bodyEllipsis" loading={loadingAccountInfo}>
                  {accountInfoStandardName}
                </Typography>
              )}
              <Hash
                value={activeAccount.publicKey}
                variant={HashVariant.CaptionHash}
                truncated
                withCopyOnSelfClick
                displayContext={HashDisplayContext.Home}
              />
            </AccountInfoContainer>
            <AccountInfoContainer
              isAccountInfoStandardNameExist={Boolean(accountInfoStandardName)}
            >
              <FlexRow gap={SpacingSize.Small}>
                <Typography type="CSPRBold">{balance.amount}</Typography>
                <Typography type="CSPRLight" color="contentSecondary">
                  CSPR
                </Typography>
              </FlexRow>
              <Typography type="body" color="contentSecondary">
                {balance.fiatAmount}
              </Typography>
            </AccountInfoContainer>
            <ButtonsContainer
              gap={SpacingSize.Big}
              isAccountInfoStandardNameExist={Boolean(accountInfoStandardName)}
            >
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
  const countOfAccounts = useSelector(selectVaultCountOfAccounts);

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
