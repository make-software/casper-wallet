export interface GetOnRampResponse {
  countries: ResponseCountryProps[];
  defaultCountry: string;
  currencies: ResponseCurrencyProps[];
  defaultCurrency: string;
  defaultAmount: string;
}

export interface ResponseCountryProps {
  name: string;
  code: string;
}

export interface ResponseCurrencyProps {
  id: number;
  code: string;
  type_id: string;
  rate: number;
}

export interface ResponseOnRampProps {
  availableProviders: ProviderProps[];
  currencies: CurrencyProps[];
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  isCryptoChanged: boolean;
}

export interface ProviderProps {
  cryptoAmount: string;
  cryptoCurrency: string;
  fiatAmount: string;
  fiatCurrency: string;
  csprExchangeRate: string;
  fees: string;
  logoPNG: string;
  logoSVG?: string;
  providerKey: string;
  providerName: string;
}

export interface CurrencyProps {
  value: string;
  label: string;
  rate: number;
}

export interface OptionsPostRequestData {
  amount: number;
  country: string;
  fiatCurrency: string;
  paymentCurrency: string;
}

export interface ResponseCountryPropsWithId extends ResponseCountryProps {
  id: number;
}

export interface ResponseSelectionProps {
  provider: string;
  location: string;
}

export interface SelectionPostRequestData {
  account: string;
  fiatCurrency: string;
  cryptoAmount: null;
  cryptoAsset: string;
  selectedOnrampProvider: string;
  fiatAmount: number;
}
