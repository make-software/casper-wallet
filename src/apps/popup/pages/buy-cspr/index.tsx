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
import {
  dispatchFetchOnRampOptionGet,
  dispatchFetchOnRampOptionPost,
  dispatchFetchOnRampSelectionPost
} from '@libs/services/buy-cspr-service';
import {
  ProviderProps,
  ResponseCountryPropsWithId,
  ResponseCurrencyProps,
  SelectionPostRequestData
} from '@libs/services/buy-cspr-service/types';
import { Button, Typography } from '@libs/ui/components';

import { Amount } from './amount';
import { Country } from './country';
import { NoProvider } from './no-provider';
import { Provider } from './provider';
import { BuyCSPRSteps } from './utils';

export const BuyCSPRPage = () => {
  const [buyCSPRStep, setBuyCSPRStep] = useState(BuyCSPRSteps.Country);
  const [availableCountries, setAvailableCountries] = useState<
    ResponseCountryPropsWithId[]
  >([]);
  const [selectedCountry, setSelectedCountry] =
    useState<ResponseCountryPropsWithId>({
      id: 0,
      name: '',
      code: ''
    });
  const [currencies, setCurrencies] = useState<ResponseCurrencyProps[]>([]);
  const [selectedCurrency, setSelectedCurrency] =
    useState<ResponseCurrencyProps>({
      id: 0,
      code: '',
      type_id: '',
      rate: 0
    });
  const [defaultAmount, setDefaultAmount] = useState('0');
  const [fiatAmount, setFiatAmount] = useState<number>(0);
  const [availableProviders, setAvailableProviders] = useState<ProviderProps[]>(
    []
  );
  const [selectedProvider, setSelectedProvider] =
    useState<ProviderProps | null>(null);
  const [loadingAvailableProviders, setLoadingAvailableProviders] =
    useState(false);
  const [loadingRedirectUrl, setLoadingRedirectUrl] = useState(false);

  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const activeAccount = useSelector(selectVaultActiveAccount);

  useEffect(() => {
    dispatchFetchOnRampOptionGet()
      .then(({ payload }) => {
        if ('countries' in payload) {
          const countriesWithId = payload.countries.map((country, id) => ({
            id,
            ...country
          }));

          const defaultSelectedCountry = countriesWithId.find(
            country => country.code === payload.defaultCountry
          );

          const defaultSelectedCurrency = payload.currencies.find(
            currency => currency.code === payload.defaultCurrency
          );

          setAvailableCountries(countriesWithId);
          setCurrencies(payload.currencies);
          setSelectedCountry(defaultSelectedCountry!);
          setSelectedCurrency(defaultSelectedCurrency!);
          setDefaultAmount(payload.defaultAmount);
          setFiatAmount(Number(payload.defaultAmount));
        } else {
          navigate(
            ErrorPath,
            createErrorLocationState({
              errorHeaderText: t('Something went wrong'),
              errorContentText:
                payload.error.message ||
                t(
                  'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                ),
              errorPrimaryButtonLabel: t('Close'),
              errorRedirectPath: RouterPath.Home
            })
          );
        }
      })
      .catch(error => {
        console.error(error.message, 'countries request failed');

        navigate(
          ErrorPath,
          createErrorLocationState({
            errorHeaderText: error.message || t('Something went wrong'),
            errorContentText:
              typeof error.data === 'string'
                ? error.data
                : t(
                    'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                  ),
            errorPrimaryButtonLabel: t('Close'),
            errorRedirectPath: RouterPath.Home
          })
        );
      });
  }, [navigate, t]);

  const handleAmountSubmit = () => {
    setLoadingAvailableProviders(true);

    dispatchFetchOnRampOptionPost({
      amount: fiatAmount,
      country: selectedCountry.code,
      fiatCurrency: selectedCurrency.code,
      paymentCurrency: selectedCurrency.code
    })
      .then(({ payload }) => {
        if ('availableProviders' in payload) {
          if (payload.availableProviders.length === 0) {
            setBuyCSPRStep(BuyCSPRSteps.NoProvider);
          } else {
            setAvailableProviders(payload.availableProviders);

            if (payload.availableProviders.length === 1) {
              setSelectedProvider(payload.availableProviders[0]);
            }

            setBuyCSPRStep(BuyCSPRSteps.Provider);
          }
        } else {
          navigate(
            ErrorPath,
            createErrorLocationState({
              errorHeaderText: t('Something went wrong'),
              errorContentText:
                payload.error.message ||
                t(
                  'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                ),
              errorPrimaryButtonLabel: t('Close'),
              errorRedirectPath: RouterPath.Home
            })
          );
        }
      })
      .catch(error => {
        console.error(error.message, 'available provider request failed');

        navigate(
          ErrorPath,
          createErrorLocationState({
            errorHeaderText: error.message || t('Something went wrong'),
            errorContentText:
              typeof error.data === 'string'
                ? error.data
                : t(
                    'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                  ),
            errorPrimaryButtonLabel: t('Close'),
            errorRedirectPath: RouterPath.Home
          })
        );
      })
      .finally(() => setLoadingAvailableProviders(false));
  };

  const handleSubmit = () => {
    setLoadingRedirectUrl(true);
    if (activeAccount && selectedProvider) {
      const data: SelectionPostRequestData = {
        account: activeAccount.publicKey,
        fiatCurrency: selectedCurrency.code,
        cryptoAmount: null,
        cryptoAsset: 'CSPR',
        selectedOnrampProvider: selectedProvider.providerKey,
        fiatAmount
      };

      dispatchFetchOnRampSelectionPost(data)
        .then(({ payload }) => {
          if ('location' in payload) {
            window.open(payload.location, '_blank');
          } else {
            navigate(
              ErrorPath,
              createErrorLocationState({
                errorHeaderText: t('Something went wrong'),
                errorContentText:
                  payload.error.message ||
                  t(
                    'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                  ),
                errorPrimaryButtonLabel: t('Close'),
                errorRedirectPath: RouterPath.Home
              })
            );
          }
        })
        .catch(error => {
          console.error(error.message, 'provider selection request failed');

          navigate(
            ErrorPath,
            createErrorLocationState({
              errorHeaderText: error.message || t('Something went wrong'),
              errorContentText:
                typeof error.data === 'string'
                  ? error.data
                  : t(
                      'Please check browser console for error details, this will be a valuable for our team to fix the issue.'
                    ),
              errorPrimaryButtonLabel: t('Close'),
              errorRedirectPath: RouterPath.Home
            })
          );
        })
        .finally(() => setLoadingRedirectUrl(false));
    }
  };

  const content = {
    [BuyCSPRSteps.Country]: (
      <Country
        availableCountries={availableCountries}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
      />
    ),
    [BuyCSPRSteps.Amount]: (
      <Amount
        currencies={currencies}
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
        countryName={selectedCountry.name}
        currencyCode={selectedCurrency.code}
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
          disabled={fiatAmount === 0 || loadingAvailableProviders}
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
          disabled={!selectedProvider || loadingRedirectUrl}
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
