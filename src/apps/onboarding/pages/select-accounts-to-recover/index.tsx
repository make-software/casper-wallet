import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { isEqualCaseInsensitive } from '@src/utils';

import { Stepper } from '@onboarding/components/stepper';
import { SelectAccountsToRecoverContent } from '@onboarding/pages/select-accounts-to-recover/content';
import { getKeyPairList } from '@onboarding/pages/select-accounts-to-recover/utils';
import {
  RouterPath,
  useTypedLocation,
  useTypedNavigate
} from '@onboarding/router';
import { closeActiveTab } from '@onboarding/utils/close-active-tab';

import { recoverVault } from '@background/redux/sagas/actions';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  HeaderSubmenuBarNavLink,
  LayoutTab,
  TabFooterContainer,
  TabHeaderContainer
} from '@libs/layout';
import { dispatchFetchAccountBalances } from '@libs/services/balance-service';
import { Account, AccountListRows, KeyPair } from '@libs/types/account';
import { Button } from '@libs/ui/components';

export const SelectAccountsToRecoverPage = () => {
  const [derivedAccounts, setDerivedAccounts] = useState<KeyPair[]>([]);
  const [derivedAccountsWithBalance, setDerivedAccountsWithBalance] = useState<
    AccountListRows[]
  >([]);
  const [selectedAccounts, setSelectedAccounts] = useState<AccountListRows[]>(
    []
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [maxItemsToRender, setMaxItemsToRender] = useState(5);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);

  const navigate = useTypedNavigate();
  const { t } = useTranslation();
  const location = useTypedLocation();

  const { casperWalletApiUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );

  useEffect(() => {
    if (location.state?.secretPhrase) {
      const keyPairs = getKeyPairList({
        size: 5,
        offset: 0,
        secretPhrase: location.state?.secretPhrase
      });

      setDerivedAccounts(prevState => [...prevState, ...keyPairs]);
    }
  }, [location.state?.secretPhrase, setDerivedAccounts]);

  useEffect(() => {
    if (!derivedAccounts.length) return;

    const hashes = derivedAccounts.reduce(
      (previousValue, currentValue, currentIndex) => {
        const hash = getAccountHashFromPublicKey(currentValue.publicKey);

        return derivedAccounts.length === currentIndex + 1
          ? previousValue + `${hash}`
          : previousValue + `${hash},`;
      },
      ''
    );

    dispatchFetchAccountBalances(hashes)
      .then(({ payload }) => {
        if ('data' in payload) {
          const derivedAccountsWithBalance: AccountListRows[] =
            derivedAccounts.map((account, index) => {
              const accountWithBalance = payload.data.find(ac =>
                isEqualCaseInsensitive(ac.public_key, account.publicKey)
              );

              return {
                ...account,
                id: account.publicKey,
                hidden: false,
                derivationIndex: index,
                name: '',
                balance: {
                  liquidMotes: `${accountWithBalance?.balance ?? '0'}`
                }
              };
            });

          setDerivedAccountsWithBalance(derivedAccountsWithBalance);
        }
      })
      .finally(() => {
        setIsLoading(false);
        setIsLoadingMore(false);
      });
  }, [derivedAccounts, casperWalletApiUrl]);

  const onLoadMore = () => {
    try {
      setIsLoadingMore(true);
      const keyPairs = getKeyPairList({
        size: 5,
        offset: derivedAccounts.length,
        secretPhrase: location.state?.secretPhrase
      });

      setDerivedAccounts(prevState => [...prevState, ...keyPairs]);
      setMaxItemsToRender(prevState => prevState + 5);
    } catch (e) {
      setIsLoadingMore(false);
    }
  };

  const onSubmit = () => {
    if (!location.state?.secretPhrase) return;

    const accounts: Account[] = selectedAccounts.map(account => ({
      name: account.name,
      publicKey: account.publicKey,
      secretKey: account.secretKey,
      hidden: account.hidden,
      derivationIndex: account.derivationIndex
    }));

    dispatchToMainStore(
      recoverVault({
        secretPhrase: location.state.secretPhrase,
        accounts
      })
    ).finally(closeActiveTab);
  };

  return (
    <LayoutTab
      layoutContext="withStepper"
      minHeight={640}
      renderHeader={() => (
        <TabHeaderContainer>
          <HeaderSubmenuBarNavLink
            linkType="back"
            onClick={() => navigate(RouterPath.CreateSecretPhrase)}
          />
          <Stepper length={4} activeIndex={3} />
        </TabHeaderContainer>
      )}
      renderContent={() => (
        <SelectAccountsToRecoverContent
          isLoading={isLoading}
          derivedAccountsWithBalance={derivedAccountsWithBalance}
          isLoadingMore={isLoadingMore}
          onLoadMore={onLoadMore}
          maxItemsToRender={maxItemsToRender}
          setSelectedAccounts={setSelectedAccounts}
          setIsButtonDisabled={setIsButtonDisabled}
          selectedAccounts={selectedAccounts}
        />
      )}
      renderFooter={() => (
        <TabFooterContainer>
          <Button
            disabled={!selectedAccounts.length || isButtonDisabled}
            onClick={onSubmit}
          >
            <Trans t={t}>Recover selected accounts</Trans>
          </Button>
        </TabFooterContainer>
      )}
    />
  );
};
