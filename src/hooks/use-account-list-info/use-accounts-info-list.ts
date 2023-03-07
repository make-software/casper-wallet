import { useEffect, useState } from 'react';

import { AccountListRowsWithHash } from '@background/redux/vault/types';
import {
  dispatchFetchAccountListInfo,
  getAccountInfo
} from '@libs/services/account-info';

export const useAccountsInfoList = (accountList: AccountListRowsWithHash[]) => {
  const [accountsInfoList, setAccountsInfoList] = useState<
    AccountListRowsWithHash[]
  >([]);

  useEffect(() => {
    const accountsHash = accountList.map(account => account.accountHash);

    dispatchFetchAccountListInfo(accountsHash)
      .then(({ payload: accountInfoList }) => {
        const newAccountList = [...accountList];

        accountInfoList.forEach(accountInfo => {
          const { accountName, accountHash } = getAccountInfo(accountInfo);

          newAccountList.forEach(account => {
            if (account.accountHash === accountHash) {
              if (accountName != null) {
                account.infoStandardName = accountName;
              }
            }
          });
        });

        setAccountsInfoList(newAccountList);
      })
      .catch(error => {
        console.error(error);
        setAccountsInfoList(accountList);
      });
    // We need to fetch account info only on the component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { accountsInfoList };
};
