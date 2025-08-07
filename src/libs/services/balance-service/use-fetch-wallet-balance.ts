import { useQueries } from '@tanstack/react-query';
import Big from 'big.js';
import { useSelector } from 'react-redux';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import {
  selectVaultAccounts,
  selectVaultActiveAccount
} from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  accountBalanceQuery,
  accountsBalancesQuery,
  currencyRateQuery
} from '@libs/services/balance-service/queries';
import { fetchCep18TokensQuery } from '@libs/services/cep18-service/queries';
import { formatCurrency, motesToCurrency } from '@libs/ui/utils';

export const useFetchWalletBalance = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);
  const accounts = useSelector(selectVaultAccounts);

  const accountHashes = accounts.map(account =>
    getAccountHashFromPublicKey(account.publicKey)
  );

  const accountHashesString = accountHashes.toString();

  const {
    accountBalance,
    isLoadingBalance,
    currencyRate,
    accountsBalances,
    isLoadingBalances
  } = useQueries({
    queries: [
      accountBalanceQuery({
        network,
        activeAccount
      }),
      currencyRateQuery({
        network
      }),
      accountsBalancesQuery({
        accountHashesString,
        network,
        accountHashes
      }),
      fetchCep18TokensQuery({ network, activeAccount })
    ],
    combine: results => {
      const accountBalance = results[0].data;
      const totalBalance = results[0].data?.totalBalance;
      const liquidBalance = results[0].data?.liquidBalance;
      const delegatedBalance = results[0].data?.delegatedBalance;
      const undelegatingBalance = results[0].data?.undelegatingBalance;
      const currencyRate = results[1].data?.rate;
      const accountsBalances = results[2].data;
      const cep18tokens = results[3].data;

      const csprTotalFiatBalance = Big(
        results[0].data?.totalDecimalBalance || 0
      ).mul(currencyRate || 0);
      const totalFiatBalance = Big(csprTotalFiatBalance)
        .add(
          (cep18tokens ?? []).reduce(
            (acc, cur) => acc.add(cur.fiatBalance || 0),
            Big(0)
          )
        )
        .toFixed();

      const totalFormattedFiatBalance =
        currencyRate && totalBalance
          ? formatCurrency(totalFiatBalance, 'USD', {
              precision: 2
            })
          : '';
      const liquidFiatBalance =
        currencyRate && liquidBalance
          ? motesToCurrency(String(liquidBalance), currencyRate)
          : '';
      const liquidFormattedFiatBalance =
        currencyRate && liquidBalance
          ? formatCurrency(
              motesToCurrency(String(liquidBalance), currencyRate),
              'USD',
              {
                precision: 2
              }
            )
          : '';
      const delegatedFormattedFiatBalance =
        currencyRate && delegatedBalance
          ? formatCurrency(
              motesToCurrency(String(delegatedBalance), currencyRate),
              'USD',
              {
                precision: 2
              }
            )
          : '';
      const undelegatedFormattedFiatBalance =
        currencyRate && undelegatingBalance
          ? formatCurrency(
              motesToCurrency(String(undelegatingBalance), currencyRate),
              'USD',
              {
                precision: 2
              }
            )
          : '';

      return {
        accountBalance: {
          ...accountBalance,
          totalFormattedFiatBalance,
          liquidFormattedFiatBalance,
          liquidFiatBalance,
          delegatedFormattedFiatBalance,
          undelegatedFormattedFiatBalance
        },
        isLoadingBalance: results[0].isLoading,
        currencyRate: results[1].data,
        accountsBalances,
        isLoadingBalances: results[2].isLoading
      };
    }
  });

  return {
    accountBalance,
    isLoadingBalance,
    currencyRate,
    accountsBalances,
    isLoadingBalances
  };
};
