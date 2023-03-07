import { useEffect, useState } from 'react';
import {
  dispatchFetchAccountInfoRequest,
  getAccountInfo,
  getAccountInfoLogo
} from '@libs/services/account-info';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { Account } from '@background/redux/vault/types';

export const useAccountInfo = (account: Account | undefined) => {
  const [accountInfoStandardName, setAccountInfoStandardName] = useState<
    string | null
  >(null);
  const [accountLogo, setAccountLogo] = useState<string | null>(null);
  const [loadingAccountInfo, setLoadingAccountInfo] = useState(true);

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
      })
      .finally(() => {
        setLoadingAccountInfo(false);
      });
  }, [account?.publicKey]);

  return {
    accountLogo,
    accountInfoStandardName,
    loadingAccountInfo
  };
};
