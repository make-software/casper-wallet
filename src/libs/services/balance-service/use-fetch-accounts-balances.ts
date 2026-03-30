import { useQuery } from '@tanstack/react-query';
import { CasperNetworkName } from 'casper-js-sdk';
import { useSelector } from 'react-redux';

import { chainNameToNetworkSettingsMap } from '@src/constants';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';

import { UseFetchAccountsBalances } from '@libs/services/balance-service/constants';
import { accountsBalancesQuery } from '@libs/services/balance-service/queries';

export const useFetchAccountsBalances = (
  accountHashes: string[],
  chainName?: string
): UseFetchAccountsBalances => {
  const networkSetting = useSelector(selectActiveNetworkSetting);
  const networkFromChainName = chainName
    ? chainNameToNetworkSettingsMap[chainName as CasperNetworkName]
    : networkSetting;

  const network = networkFromChainName ?? networkSetting;

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
