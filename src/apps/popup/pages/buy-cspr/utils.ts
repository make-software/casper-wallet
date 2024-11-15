import {
  IOnRampCountry,
  IOnRampCurrencyItem
} from 'casper-wallet-core/src/domain';

export enum BuyCSPRSteps {
  Country = 'country',
  Amount = 'amount',
  Provider = 'provider',
  NoProvider = 'no provider'
}

export function sortCountries(
  availableCountries: IOnRampCountry[],
  selectedCountryCode: string
): IOnRampCountry[] {
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
  currencies: IOnRampCurrencyItem[],
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
