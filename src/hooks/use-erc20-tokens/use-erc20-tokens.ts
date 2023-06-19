import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  dispatchFetchErc20TokensRequest,
  ContractPackageWithBalance
} from '@libs/services/erc20-service';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';

export const useErc20Tokens = () => {
  const [erc20Tokens, setErc20Tokens] = useState<
    ContractPackageWithBalance[] | null
  >(null);

  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
    dispatchFetchErc20TokensRequest(
      getAccountHashFromPublicKey(activeAccount?.publicKey)
    ).then(({ payload: tokens }) => {
      setErc20Tokens(tokens);
    });
  }, [activeAccount?.publicKey, casperApiUrl]);

  return erc20Tokens;
};
