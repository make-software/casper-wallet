import React, { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Trans, useTranslation } from 'react-i18next';
import { RootState } from 'typesafe-actions';
import Identicon from 'react-identicons';
import styled, { css, useTheme } from 'styled-components';

import {
  CenteredFlexColumn,
  ContentContainer,
  LeftAlignedFlexColumn
} from '@src/libs/layout/containers';
import { LinkType, HeaderSubmenuBarNavLink } from '@libs/layout';

import { Button, Hash, HashVariant, PageTile, Typography } from '@libs/ui';

import { RouterPath, useTypedNavigate } from '@popup/router';

import {
  selectIsActiveAccountConnectedWithOrigin,
  selectConnectedAccountsWithOrigin,
  selectVaultActiveAccount,
  selectVaultCountOfAccounts
} from '@src/background/redux/vault/selectors';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';
import {
  ActiveAccountBalance,
  getActiveAccountBalance
} from '@libs/services/balance-service';
import {
  formatCurrency,
  formatNumber,
  motesToCSPR,
  motesToCurrency
} from '@libs/ui/utils/formatters';

import { ConnectionStatusBadge } from './components/connection-status-badge';
import { selectActiveOrigin } from '@src/background/redux/session/selectors';

export const HomePageContentContainer = styled(ContentContainer)`
  padding-bottom: ${({ theme }) => theme.padding[1.2]};
`;

// Account info

const fullWidthAndMarginTop = css`
  margin-top: 16px;
  width: 100%;
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

const BalanceInCSPRsContainer = styled.div`
  display: flex;
  gap: 8px;
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
  const theme = useTheme();

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

  useEffect(() => {
    getActiveAccountBalance(activeAccount?.publicKey)
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
        <PageTile>
          <ConnectionStatusBadge
            isConnected={isActiveAccountConnected}
            displayContext="home"
          />
          <AvatarContainer>
            <Identicon
              string={activeAccount.publicKey.toLowerCase()}
              size={120}
              bg={theme.color.backgroundPrimary}
            />
          </AvatarContainer>
          <NameAndAddressContainer>
            <Typography type="bodySemiBold">{activeAccount.name}</Typography>
            <Hash
              value={activeAccount.publicKey}
              variant={HashVariant.CaptionHash}
              truncated
              withCopyOnClick
            />
          </NameAndAddressContainer>
          <BalanceContainer>
            <BalanceInCSPRsContainer>
              <Typography type="CSPRBold">{balance.amount}</Typography>
              <Typography type="CSPRLight" color="contentSecondary">
                CSPR
              </Typography>
            </BalanceInCSPRsContainer>
            <Typography type="body" color="contentSecondary">
              {balance.fiatAmount}
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
        </PageTile>
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
