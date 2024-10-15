import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { onRampRepository } from '@background/wallet-repositories';

export const useFetchOnRampCountriesAndCurrencies = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);

  const {
    data: onRampCountriesAndCurrencies,
    refetch: refetchOnRampCountriesAndCurrencies,
    isLoading: isLoadingOnRampCountriesAndCurrencies,
    isRefetching: isRefetchingOnRampCountriesAndCurrencies,
    error: onRampCountriesAndCurrenciesError
  } = useQuery({
    queryKey: ['ONRAMP_COUNTRIES_AND_CURRENCY', activeAccount?.publicKey],
    enabled: Boolean(activeAccount?.publicKey),
    queryFn: () => onRampRepository.getOnRampCountriesAndCurrencies()
  });

  const countries = useMemo(
    () =>
      onRampCountriesAndCurrencies?.countries?.map(country => country) ?? [],
    [onRampCountriesAndCurrencies?.countries]
  );

  const currencies = useMemo(
    () =>
      onRampCountriesAndCurrencies?.currencies?.map(currency => currency) ?? [],
    [onRampCountriesAndCurrencies?.currencies]
  );

  const defaultCountry = useMemo(
    () =>
      countries?.find(
        country =>
          country?.code === onRampCountriesAndCurrencies?.defaultCountry
      ),
    [countries, onRampCountriesAndCurrencies?.defaultCountry]
  );

  const defaultCurrency = useMemo(
    () =>
      currencies?.find(
        currency =>
          currency?.code === onRampCountriesAndCurrencies?.defaultCurrency
      ),
    [currencies, onRampCountriesAndCurrencies?.defaultCurrency]
  );

  return {
    onRampCountriesAndCurrencies,
    refetchOnRampCountriesAndCurrencies,
    isLoadingOnRampCountriesAndCurrencies,
    isRefetchingOnRampCountriesAndCurrencies,
    defaultCountry,
    countries,
    currencies,
    defaultCurrency,
    defaultDepositAmount: onRampCountriesAndCurrencies?.defaultAmount,
    onRampCountriesAndCurrenciesError
  };
};
