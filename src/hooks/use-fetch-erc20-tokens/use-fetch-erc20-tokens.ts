import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  dispatchFetchErc20TokensRequest,
  ContractPackageWithBalance
} from '@libs/services/erc20-service';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { selectVaultActiveAccount } from '@background/redux/vault/selectors';
import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { selectErc20Tokens } from '@src/background/redux/account-info/selectors';
import { accountErc20Changed } from '@src/background/redux/account-info/actions';
import { dispatchToMainStore } from '@src/background/redux/utils';

export const useFetchErc20Tokens = () => {
  const activeAccount = useSelector(selectVaultActiveAccount);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);
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
  }, [activeAccount?.publicKey, casperApiUrl]);

  return erc20Tokens;
};
