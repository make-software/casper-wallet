import React, { useCallback, useEffect, useState } from 'react';
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

import { RouterPath, useTypedNavigate } from '@popup/router';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  dispatchFetchAccountInfoRequest,
  getAccountInfo,
  getAccountInfoLogo
} from '@libs/services/account-info';
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
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import { getBlockExplorerAccountUrl } from '@src/constants';
import { selectCasperUrlsBaseOnActiveNetworkSetting } from '@src/background/redux/settings/selectors';

import {
  selectActiveOrigin,
  selectConnectedAccountsWithOrigin,
  selectIsActiveAccountConnectedWithOrigin,
  selectVaultActiveAccount,
  selectVaultCountOfAccounts
} from '@src/background/redux/root-selector';
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

  const [balance, setBalance] = useState<ActiveAccountBalance>({
    amount: '-',
    fiatAmount: '-'
  });
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountLogo, setAccountLogo] = useState<string | null>(null);
  const [loadingAccountInfo, setLoadingAccountInfo] = useState(true);

  const activeOrigin = useSelector(selectActiveOrigin);
  const { disconnectAccountWithEvent: disconnectAccount } = useAccountManager();
  const isActiveAccountConnected = useSelector(
    selectIsActiveAccountConnectedWithOrigin
  );

  const activeAccount = useSelector(selectVaultActiveAccount);
  const connectedAccounts = useSelector((state: RootState) =>
    selectConnectedAccountsWithOrigin(state)
  );
  const { casperLiveUrl, casperApiUrl } = useSelector(
    selectCasperUrlsBaseOnActiveNetworkSetting
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

  useEffect(() => {
    dispatchFetchActiveAccountBalance(activeAccount?.publicKey)
      .then(({ payload: { balance, currencyRate } }) => {
        if (balance != null) {
          const amount = formatNumber(motesToCSPR(balance), {
            precision: { max: 5 }
          });
          const fiatAmount =
            currencyRate != null
              ? formatCurrency(motesToCurrency(balance, currencyRate), 'USD', {
                  precision: 2
                })
              : t('Currency service is offline...');

          setBalance({ amount, fiatAmount });
        }
      })
      .catch(error => {
        console.error('Balance request failed:', error);
      });

    dispatchFetchAccountInfoRequest(
      getAccountHashFromPublicKey(activeAccount?.publicKey)
    )
      .then(({ payload: accountInfo }) => {
        const { accountName } = getAccountInfo(accountInfo);
        const accountInfoLogo = getAccountInfoLogo(accountInfo);

        if (accountName) {
          setAccountName(accountName);
        }

        if (accountInfoLogo) {
          setAccountLogo(accountInfoLogo);
        }
      })
      .catch(error => {
        console.error('Account info request failed:', error);
      })
      .finally(() => {
        setLoadingAccountInfo(false);
      });
  }, [activeAccount?.publicKey, casperApiUrl]);

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
              src={accountLogo}
              loadingAccountInfo={loadingAccountInfo}
            />
            <NameAndAddressContainer>
              <Typography type="bodySemiBold" loading={loadingAccountInfo}>
                {accountName ?? activeAccount.name}
              </Typography>
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
            <ButtonsContainer gap={SpacingSize.Big}>
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
