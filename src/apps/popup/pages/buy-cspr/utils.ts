import {
  ResponseCountryPropsWithId,
  ResponseCurrencyProps
} from '@libs/services/buy-cspr-service/types';

export enum BuyCSPRSteps {
  Country = 'country',
  Amount = 'amount',
  Provider = 'provider',
  NoProvider = 'no provider'
}

export function sortCountries(
  availableCountries: ResponseCountryPropsWithId[],
  selectedCountryCode: string
): ResponseCountryPropsWithId[] {
  const copiedCountries = [...availableCountries];

  return copiedCountries.sort((a, b) => {
    if (a.code === selectedCountryCode) {
      return -1;
    }
    if (b.code === selectedCountryCode) {
      return 1;
    }
    return 0;
  });
}

export const sortCurrencies = (
  currencies: ResponseCurrencyProps[],
  selectedCurrencyCode: string
) => {
  const copiedCurrencies = [...currencies];

  return copiedCurrencies.sort((a, b) => {
    if (a.code === selectedCurrencyCode) {
      return -1;
    }
    if (b.code === selectedCurrencyCode) {
      return 1;
    }
    return 0;
  });
};
