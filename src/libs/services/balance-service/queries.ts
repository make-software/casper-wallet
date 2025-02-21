import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';

import {
  BALANCE_REFRESH_RATE,
  CURRENCY_REFRESH_RATE,
  NetworkSetting
} from '@src/constants';

import {
  accountInfoRepository,
  tokensRepository
} from '@background/wallet-repositories';

import { Account } from '@libs/types/account';

interface AccountBalanceQueryProps {
  network: NetworkSetting;
  activeAccount: Account | undefined;
}

interface CurrencyRateQueryProps {
  network: NetworkSetting;
}

interface AccountBalancesQueryProps {
  accountHashesString: string;
  network: NetworkSetting;
  accountHashes: string[];
}

export const accountBalanceQuery = ({
  network,
  activeAccount
}: AccountBalanceQueryProps) => ({
  queryKey: ['ACCOUNT_BALANCE', network, activeAccount?.publicKey],
  queryFn: () =>
    tokensRepository.getCsprBalance({
      publicKey: activeAccount?.publicKey || '',
      network: network.toLowerCase() as CasperNetwork,
      withProxyHeader: false
    }),
  refetchInterval: BALANCE_REFRESH_RATE,
  staleTime: BALANCE_REFRESH_RATE
});

export const currencyRateQuery = ({ network }: CurrencyRateQueryProps) => ({
  queryKey: ['CURRENCY_RATE', network],
  queryFn: () =>
    tokensRepository.getCsprFiatCurrencyRate({
      network: network.toLowerCase() as CasperNetwork,
      withProxyHeader: false
    }),
  refetchInterval: CURRENCY_REFRESH_RATE,
  staleTime: CURRENCY_REFRESH_RATE
});

export const accountsBalancesQuery = ({
  accountHashesString,
  network,
  accountHashes
}: AccountBalancesQueryProps) => ({
  queryKey: ['ACCOUNTS_BALANCES', accountHashesString, network],
  queryFn: async () =>
    accountInfoRepository.getAccountsBalances({
      accountHashes: accountHashes,
      network: network.toLowerCase() as CasperNetwork,
      withProxyHeader: false
    }),
  refetchInterval: BALANCE_REFRESH_RATE,
  staleTime: BALANCE_REFRESH_RATE
});
