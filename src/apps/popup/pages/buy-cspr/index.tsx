import {
  IGetOnRampProvidersData,
  IOnRampCountry,
  IOnRampCurrencyItem,
  IOnRampProvider,
  IProviderSelectionData
} from 'casper-wallet-core/src/domain';
import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import {
  ErrorPath,
  FooterButtonsContainer,
  HeaderPopup,
  HeaderSubmenuBarNavLink,
  PopupLayout,
  createErrorLocationState
} from '@libs/layout';
import { useFetchOnRampCountriesAndCurrencies } from '@libs/services/buy-cspr-service/use-fetch-on-ramp-countries-and-currencies';
import { useGetOnRampProviders } from '@libs/services/buy-cspr-service/use-get-on-ramp-providers';
import { Button, Typography } from '@libs/ui/components';

import { Amount } from './amount';
import { Country } from './country';
import { NoProvider } from './no-provider';
import { Provider } from './provider';
import { BuyCSPRSteps } from './utils';

export const BuyCSPRPage = () => {
  const [buyCSPRStep, setBuyCSPRStep] = useState(BuyCSPRSteps.Country);
  const [availableCountries, setAvailableCountries] = useState<
    IOnRampCountry[]
  >([]);
  const [selectedCountry, setSelectedCountry] = useState<IOnRampCountry>({
    name: '',
    code: '',
    flagUri: ''
  });
  const [availableCurrencies, setAvailableCurrencies] = useState<
    IOnRampCurrencyItem[]
  >([]);
  const [selectedCurrency, setSelectedCurrency] = useState<IOnRampCurrencyItem>(
    {
      id: 0,
      code: '',
      type_id: '',
      rate: 0
    }
  );
  const [defaultAmount, setDefaultAmount] = useState('0');
  const [fiatAmount, setFiatAmount] = useState<number>(0);
  const [availableProviders, setAvailableProviders] = useState<
    IOnRampProvider[]
  >([]);
  const [selectedProvider, setSelectedProvider] =
    useState<IOnRampProvider | null>(null);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const activeAccount = useSelector(selectVaultActiveAccount);

  const {
    currencies,
    countries,
    defaultCountry,
    defaultCurrency,
    defaultDepositAmount,
    isLoadingOnRampCountriesAndCurrencies,
    onRampCountriesAndCurrenciesError
  } = useFetchOnRampCountriesAndCurrencies();
  const {
    getOnRampProviders,
    isProvidersLoading,
    isProviderLocationLoading,
    getOnRampProviderLocation
  } = useGetOnRampProviders();

  useEffect(() => {
    if (onRampCountriesAndCurrenciesError) {
      navigate(
        ErrorPath,
        createErrorLocationState({
          errorHeaderText: t('Something went wrong'),
          errorContentText:
            onRampCountriesAndCurrenciesError.message ||
            t(
              'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
            ),
          errorPrimaryButtonLabel: t('Close'),
          errorRedirectPath: RouterPath.Home
        })
      );
    }
    if (isLoadingOnRampCountriesAndCurrencies) return;

    setAvailableCountries(countries);
    setAvailableCurrencies(currencies);
    setSelectedCountry(defaultCountry!);
    setSelectedCurrency(defaultCurrency!);
    setDefaultAmount(defaultDepositAmount!);
    setFiatAmount(Number(defaultDepositAmount));
  }, [
    countries,
    currencies,
    defaultCountry,
    defaultCurrency,
    defaultDepositAmount,
    isLoadingOnRampCountriesAndCurrencies,
    navigate,
    onRampCountriesAndCurrenciesError,
    t
  ]);

  const handleAmountSubmit = () => {
    const data: IGetOnRampProvidersData = {
      amount: fiatAmount,
      country: selectedCountry?.code,
      fiatCurrency: selectedCurrency?.code,
      paymentCurrency: selectedCurrency?.code
    };
    getOnRampProviders(data, {
      onSuccess: onRampProviders => {
        if (onRampProviders.availableProviders.length === 0) {
          setBuyCSPRStep(BuyCSPRSteps.NoProvider);
        } else {
          setAvailableProviders(onRampProviders.availableProviders);

          if (onRampProviders.availableProviders.length === 1) {
            setSelectedProvider(onRampProviders.availableProviders[0]);
          }

          setBuyCSPRStep(BuyCSPRSteps.Provider);
        }
      },
      onError: error => {
        navigate(
          ErrorPath,
          createErrorLocationState({
            errorHeaderText: t('Something went wrong'),
            errorContentText:
              error.message ||
              t(
                'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
              ),
            errorPrimaryButtonLabel: t('Close'),
            errorRedirectPath: RouterPath.Home
          })
        );
      }
    });
  };

  const handleSubmit = () => {
    if (activeAccount && selectedProvider) {
      const data: IProviderSelectionData = {
        account: activeAccount.publicKey,
        fiatCurrency: selectedCurrency.code,
        cryptoAmount: null,
        cryptoAsset: 'CSPR',
        selectedOnrampProvider: selectedProvider.providerKey,
        fiatAmount
      };

      getOnRampProviderLocation(data, {
        onSuccess: providerLocation => {
          window.open(providerLocation.location, '_blank');
        },
        onError: error => {
          console.error(error.message, 'provider selection request failed');

          navigate(
            ErrorPath,
            createErrorLocationState({
              errorHeaderText: t('Something went wrong'),
              errorContentText:
                error.message ||
                t(
                  'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                ),
              errorPrimaryButtonLabel: t('Close'),
              errorRedirectPath: RouterPath.Home
            })
          );
        }
      });
    }
  };

  const content = {
    [BuyCSPRSteps.Country]: (
      <Country
        availableCountries={availableCountries}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        isLoadingOnRampCountriesAndCurrencies={
          isLoadingOnRampCountriesAndCurrencies
        }
      />
    ),
    [BuyCSPRSteps.Amount]: (
      <Amount
        availableCurrencies={availableCurrencies}
        selectedCurrency={selectedCurrency}
        setPaymentAmount={setFiatAmount}
        setSelectedCurrency={setSelectedCurrency}
        defaultAmount={defaultAmount}
      />
    ),
    [BuyCSPRSteps.Provider]: (
      <Provider
        availableProviders={availableProviders}
        setSelectedProviders={setSelectedProvider}
        selectedProviders={selectedProvider}
      />
    ),
    [BuyCSPRSteps.NoProvider]: (
      <NoProvider
        countryName={selectedCountry?.name}
        currencyCode={selectedCurrency?.code}
      />
    )
  };

  const headerButton = {
    [BuyCSPRSteps.Country]: <HeaderSubmenuBarNavLink linkType="back" />,
    [BuyCSPRSteps.Amount]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setBuyCSPRStep(BuyCSPRSteps.Country)}
      />
    ),
    [BuyCSPRSteps.Provider]: (
      <HeaderSubmenuBarNavLink
        linkType="back"
        onClick={() => setBuyCSPRStep(BuyCSPRSteps.Amount)}
      />
    ),
    [BuyCSPRSteps.NoProvider]: <HeaderSubmenuBarNavLink linkType="close" />
  };

  const footerButton = {
    [BuyCSPRSteps.Country]: (
      <Button
        onClick={() => setBuyCSPRStep(BuyCSPRSteps.Amount)}
        disabled={!availableCountries.length}
      >
        <Trans t={t}>Next</Trans>
      </Button>
    ),
    [BuyCSPRSteps.Amount]: (
      <>
        <Button
          onClick={handleAmountSubmit}
          disabled={fiatAmount === 0 || isProvidersLoading}
        >
          <Trans t={t}>Next</Trans>
        </Button>
      </>
    ),
    [BuyCSPRSteps.Provider]: (
      <>
        {selectedProvider ? (
          <Typography type="captionRegular" textAlign="center">
            <Trans t={t}>You’ll be taken to provider’s website</Trans>
          </Typography>
        ) : null}
        <Button
          color="primaryRed"
          disabled={!selectedProvider || isProviderLocationLoading}
          onClick={handleSubmit}
        >
          <Trans t={t}>Confirm</Trans>
        </Button>
      </>
    ),
    [BuyCSPRSteps.NoProvider]: (
      <Button onClick={() => setBuyCSPRStep(BuyCSPRSteps.Country)}>
        <Trans t={t}>Try again</Trans>
      </Button>
    )
  };

  return (
    <PopupLayout
      renderHeader={() => (
        <HeaderPopup
          withNetworkSwitcher
          withMenu
          withConnectionStatus
          renderSubmenuBarItems={() => headerButton[buyCSPRStep]}
        />
      )}
      renderContent={() => content[buyCSPRStep]}
      renderFooter={() => (
        <FooterButtonsContainer>
          {footerButton[buyCSPRStep]}
        </FooterButtonsContainer>
      )}
    />
  );
};
