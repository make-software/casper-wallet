import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectApiConfigBasedOnActiveNetwork } from '@background/redux/settings/selectors';
import { Account } from '@background/redux/vault/types';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import {
  dispatchFetchAccountInfoRequest,
  getAccountInfo,
  getAccountInfoLogo
} from '@libs/services/account-info';

export const useFetchAccountInfo = (account: Account | undefined) => {
  const [accountInfoStandardName, setAccountInfoStandardName] = useState<
    string | null
  >(null);
  const [accountLogo, setAccountLogo] = useState<string | null>(null);
  const { casperApiUrl } = useSelector(selectApiConfigBasedOnActiveNetwork);

  useEffect(() => {
    dispatchFetchAccountInfoRequest(
      getAccountHashFromPublicKey(account?.publicKey)
    )
      .then(({ payload: accountInfo }) => {
        const { accountName } = getAccountInfo(accountInfo);
        const accountInfoLogo = getAccountInfoLogo(accountInfo);

        if (accountName) {
          setAccountInfoStandardName(accountName);
        }

        if (accountInfoLogo) {
          setAccountLogo(accountInfoLogo);
        }
      })
      .catch(error => {
        console.error('Account info request failed:', error);
      });
  }, [account?.publicKey, casperApiUrl]);

  return {
    accountLogo,
    accountInfoStandardName
  };
};
