import { Player } from '@lottiefiles/react-lottie-player';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { RouterPath, useTypedNavigate } from '@popup/router';

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
import { useFetchAccountsBalances } from '@libs/services/balance-service';
import {
  LedgerAccount,
  LedgerEventStatus,
  ledger
} from '@libs/services/ledger';
import { Account, HardwareWalletType } from '@libs/types/account';
import {
  Button,
  DynamicAccountsListWithSelect,
  Tile,
  Typography
} from '@libs/ui/components';

import { ILedgerAccountListItem } from './types';

const AnimationContainer = styled(CenteredFlexColumn)`
  padding: 0 16px 52px;
`;

interface IConnectedLedgerProps {
  onClose: () => void;
}

export const ConnectedLedger: React.FC<IConnectedLedgerProps> = ({
  onClose
}) => {
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

  const accountHashes = accountsFromLedger.map(account =>
    getAccountHashFromPublicKey(account.publicKey)
  );

  const { accountsBalances, isLoadingBalances } =
    useFetchAccountsBalances(accountHashes);

  useEffect(() => {
    if (!accountsFromLedger.length || isLoadingBalances) return;

    const accountsWithBalance = accountsFromLedger.map<ILedgerAccountListItem>(
      account => {
        const accountHash = getAccountHashFromPublicKey(account.publicKey);

        const accountLiquidBalance =
          accountsBalances && accountsBalances[accountHash]?.liquidBalance;

        return {
          publicKey: account.publicKey,
          derivationIndex: account.index,
          accountHash,
          name: '',
          id: account.publicKey,
          balance: {
            liquidMotes: `${accountLiquidBalance ?? '0'}`
          }
        };
      }
    );

    setLedgerAccountsWithBalance(accountsWithBalance);

    setIsLoading(false);
    setIsLoadingMore(false);
  }, [accountsBalances, accountsFromLedger, isLoadingBalances]);

  const onSubmit = () => {
    const accounts: Account[] = selectedAccounts.map(account => ({
      name: account.name,
      publicKey: account.publicKey,
      secretKey: '',
      hardware: HardwareWalletType.Ledger,
      hidden: false,
      derivationIndex: account.derivationIndex
    }));

    dispatchToMainStore(accountsImported(accounts)).then(() => {
      onClose();
      navigate(RouterPath.Home);
    });
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
            <DynamicAccountsListWithSelect
              accountsWithBalance={ledgerAccountsWithBalance}
              setIsButtonDisabled={setIsButtonDisabled}
              selectedAccounts={selectedAccounts}
              setSelectedAccounts={setSelectedAccounts}
              maxItemsToRender={maxItemsToRender}
              onLoadMore={onLoadMore}
              isLoadingMore={isLoadingMore}
              namePrefix="Ledger account"
              accountsBalances={accountsBalances}
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
