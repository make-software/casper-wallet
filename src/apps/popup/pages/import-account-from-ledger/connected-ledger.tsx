import { Player } from '@lottiefiles/react-lottie-player';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEqualCaseInsensitive } from '@src/utils';

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
import { dispatchFetchAccountBalances } from '@libs/services/balance-service';
import {
  LedgerAccount,
  LedgerEventStatus,
  ledger
} from '@libs/services/ledger';
import { Account, HardwareWalletType } from '@libs/types/account';
import { Button, Tile, Typography } from '@libs/ui/components';

import { LedgerAccountsList } from './ledger-accounts-list';
import { ILedgerAccountListItem } from './types';

const AnimationContainer = styled(CenteredFlexColumn)`
  padding: 0 16px 52px;
`;

export const ConnectedLedger = () => {
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<
    ILedgerAccountListItem[]
  >([]);
  const [accountsFromLedger, setAccountsFromLedger] = useState<LedgerAccount[]>(
    []
  );
  const [ledgerAccountsWithBalance, setLedgerAccountsWithBalance] = useState<
    ILedgerAccountListItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [maxItemsToRender, setMaxItemsToRender] = useState(5);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const isDarkMode = useIsDarkMode();

  const { casperWalletApiUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

  useEffect(() => {
    ledger.getAccountList({ size: 5, offset: 0 });
  }, []);

  useEffect(() => {
    const sub = ledger.subscribeToLedgerEventStatuss(event => {
      if (event.status === LedgerEventStatus.AccountListUpdated) {
        setAccountsFromLedger(prev => {
          return [...prev, ...(event.accounts ?? [])];
        });
      }
    });

    return () => sub.unsubscribe();
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

    dispatchFetchAccountBalances(hashes)
      .then(({ payload }) => {
        if ('data' in payload) {
          const accountsWithBalance =
            accountsFromLedger.map<ILedgerAccountListItem>(account => {
              const accountWithBalance = payload.data.find(ac =>
                isEqualCaseInsensitive(ac.public_key, account.publicKey)
              );

              return {
                publicKey: account.publicKey,
                derivationIndex: account.index,
                name: '',
                id: account.publicKey,
                balance: {
                  liquidMotes: `${accountWithBalance?.balance ?? '0'}`
                }
              };
            });

          setLedgerAccountsWithBalance(accountsWithBalance);
        }
      })
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  }, [casperWalletApiUrl, accountsFromLedger]);

  const onSubmit = () => {
    const accounts: Account[] = selectedAccounts.map(account => ({
      name: account.name,
      publicKey: account.publicKey,
      secretKey: '',
      hardware: HardwareWalletType.Ledger,
      hidden: false,
      derivationIndex: account.derivationIndex
    }));

    dispatchToMainStore(accountsImported(accounts)).then(() =>
      navigate(RouterPath.Home)
    );
  };

  const onLoadMore = () => {
    try {
      setIsLoadingMore(true);
      ledger.getAccountList({
        size: 5,
        offset: ledgerAccountsWithBalance.length
      });
      setMaxItemsToRender(prevState => prevState + 5);
    } catch (e) {
      console.log('-------- e', JSON.stringify(e, null, ' '));
      setIsLoadingMore(false);
    }
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
              onLoadMore={onLoadMore}
              isLoadingMore={isLoadingMore}
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
