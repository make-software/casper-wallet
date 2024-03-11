import { Player } from '@lottiefiles/react-lottie-player';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { accountsImported } from '@background/redux/vault/actions';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

import spinnerDarkModeAnimation from '@libs/animations/spinner_dark_mode.json';
import spinnerLightModeAnimation from '@libs/animations/spinner_light_mode.json';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  CenteredFlexColumn,
  ContentContainer,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  ParagraphContainer,
  PopupLayout,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import { dispatchFetchAccountsBalance } from '@libs/services/balance-service';
import { Account, HardwareWalletType } from '@libs/types/account';
import { Button, Tile, Typography } from '@libs/ui/components';

import { LedgerAccountsList } from './ledger-accounts-list';

const AnimationContainer = styled(CenteredFlexColumn)`
  padding: 0 16px 52px;
`;

const list = [
  {
    id: 1,
    publicKey:
      '018afa98ca4be12d613617f7339a2d576950a2f9a92102ca4d6508ee31b54d2c02'
  },
  {
    id: 2,
    publicKey:
      '012811bf2816b9950097d8338ff4766fedd8a05ba5bb42bfeaff53eafb67f7ebb3'
  },
  {
    id: 3,
    publicKey:
      '01b9700dcdd39e23b51548e3ea9092e36f8ea2151f088e28a6f36449437361eb28'
  },
  {
    id: 4,
    publicKey:
      '020389bd333fa1d4523d8d210d91743cb5b4ffc037a20ee25a20afa6770fecc2ff91'
  },
  {
    id: 5,
    publicKey:
      '01d73b00baec14ff4805bd77ab13abca15806d628bd743d9b71062917270bb9a27'
  }
];

export const ConnectedLedger = () => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<
    { id: number; publicKey: string; name: string }[]
  >([]);
  const [accountsFromLedger, setAccountsFromLedger] = useState<
    { id: number; publicKey: string }[]
  >([]);
  const [ledgerAccountsWithBalance, setLedgerAccountsWithBalance] = useState<
    {
      id: number;
      publicKey: string;
      name?: string;
      balance: number | undefined;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [maxItemsToRender, setMaxItemsToRender] = useState(5);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const isDarkMode = useIsDarkMode();

  const { casperWalletApiUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

  useEffect(() => {
    const interval = setTimeout(() => {
      setAccountsFromLedger(list);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!accountsFromLedger.length) return;

    const hashes = accountsFromLedger.reduce(
      (previousValue, currentValue, currentIndex) => {
        const hash = getAccountHashFromPublicKey(currentValue.publicKey);

        return accountsFromLedger.length === currentIndex + 1
          ? previousValue + `${hash}`
          : previousValue + `${hash},`;
      },
      ''
    );

    dispatchFetchAccountsBalance(hashes)
      .then(({ payload }) => {
        if ('data' in payload) {
          const accountsWithBalance = accountsFromLedger.map(account => {
            const accountWithBalance = payload.data.find(
              ac => ac.public_key === account.publicKey
            );

            return {
              ...account,
              balance: accountWithBalance?.balance || 0
            };
          });

          setLedgerAccountsWithBalance(accountsWithBalance);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [casperWalletApiUrl, accountsFromLedger]);

  const onSubmit = () => {
    const accounts: Account[] = selectedAccounts.map(account => ({
      name: account.name,
      publicKey: account.publicKey,
      secretKey: '',
      hardware: HardwareWalletType.Ledger
    }));

    dispatchToMainStore(accountsImported(accounts)).then(() =>
      navigate(RouterPath.Home)
    );
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => (
            <HeaderSubmenuBarNavLink linkType="cancel" />
          )}
        />
      )}
      renderContent={() => (
        <ContentContainer>
          <ParagraphContainer top={SpacingSize.XL}>
            <Typography type="header">
              <Trans t={t}>Select accounts</Trans>
            </Typography>
          </ParagraphContainer>
          <ParagraphContainer top={SpacingSize.Medium}>
            <Typography type="body" color="contentSecondary">
              <Trans t={t}>to connect with Casper Wallet</Trans>
            </Typography>
          </ParagraphContainer>

          {isLoading ? (
            <VerticalSpaceContainer top={SpacingSize.XL}>
              <Tile>
                <AnimationContainer>
                  <Player
                    renderer="svg"
                    autoplay
                    loop
                    src={
                      isDarkMode
                        ? spinnerDarkModeAnimation
                        : spinnerLightModeAnimation
                    }
                    style={{ height: '130px' }}
                  />
                  <CenteredFlexColumn gap={SpacingSize.Small}>
                    <Typography type="subtitle">
                      <Trans t={t}>Just a moment</Trans>
                    </Typography>
                    <Typography
                      type="captionRegular"
                      color="contentSecondary"
                      style={{ textAlign: 'center' }}
                    >
                      <Trans t={t}>
                        Your accounts from Ledger will be here shortly.
                      </Trans>
                    </Typography>
                  </CenteredFlexColumn>
                </AnimationContainer>
              </Tile>
            </VerticalSpaceContainer>
          ) : (
            <LedgerAccountsList
              ledgerAccountsWithBalance={ledgerAccountsWithBalance}
              setIsButtonDisabled={setIsButtonDisabled}
              selectedAccounts={selectedAccounts}
              setSelectedAccounts={setSelectedAccounts}
              maxItemsToRender={maxItemsToRender}
              setMaxItemsToRender={setMaxItemsToRender}
            />
          )}
        </ContentContainer>
      )}
      renderFooter={() => (
        <FooterButtonsContainer>
          <Button
            color="primaryBlue"
            disabled={!selectedAccounts.length || isButtonDisabled}
            onClick={onSubmit}
          >
            <Trans t={t}>Add selected account</Trans>
          </Button>
        </FooterButtonsContainer>
      )}
    />
  );
};
