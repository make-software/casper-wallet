import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';

import { UseFetchAccountsBalances } from '@libs/services/balance-service/constants';
import { accountsBalancesQuery } from '@libs/services/balance-service/queries';

export const useFetchAccountsBalances = (
  accountHashes: string[]
): UseFetchAccountsBalances => {
  const network = useSelector(selectActiveNetworkSetting);

  const accountHashesString = accountHashes.toString();

  const { data: accountsBalances, isFetching: isLoadingBalances } = useQuery(
    accountsBalancesQuery({
      network,
      accountHashes,
      accountHashesString
    })
  );

  return {
    accountsBalances,
    isLoadingBalances
  };
};
