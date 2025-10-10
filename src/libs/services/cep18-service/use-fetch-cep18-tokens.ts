import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';

import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { fetchCep18TokensQuery } from '@libs/services/cep18-service/queries';

export const useFetchCep18Tokens = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const network = useSelector(selectActiveNetworkSetting);

  const { data: cep18Tokens = [], isFetching: isLoadingTokens } = useQuery(
    fetchCep18TokensQuery({ network, activeAccount })
  );

  return { cep18Tokens, isLoadingTokens };
};
