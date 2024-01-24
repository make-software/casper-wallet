import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { accountErc20Changed } from '@background/redux/account-info/actions';
import { selectErc20Tokens } from '@background/redux/account-info/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { dispatchToMainStore } from '@background/redux/utils';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  ContractPackageWithBalance,
  dispatchFetchErc20TokensRequest
} from '@libs/services/erc20-service';

export const useFetchErc20Tokens = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperClarityApiUrl } = useSelector(
    selectApiConfigBasedOnActiveNetwork
  );
  const tokens = useSelector(selectErc20Tokens);

  const [erc20Tokens, setErc20Tokens] = useState<
    ContractPackageWithBalance[] | null
  >(tokens);

  useEffect(() => {
    if (!activeAccount?.publicKey) return;

    dispatchFetchErc20TokensRequest(
      getAccountHashFromPublicKey(activeAccount.publicKey)
    ).then(({ payload: tokens }) => {
      dispatchToMainStore(accountErc20Changed(tokens));
      setErc20Tokens(tokens);
    });
  }, [activeAccount?.publicKey, casperClarityApiUrl]);

  return erc20Tokens;
};
