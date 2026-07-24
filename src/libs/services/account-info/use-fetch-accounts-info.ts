import { useQuery } from '@tanstack/react-query';
import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAllContacts } from '@background/redux/contacts/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultAccounts } from '@background/redux/vault/selectors';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

import { getAccountsInfoQueryOptions } from './accounts-info-query';

export const useFetchAccountsInfo = (accountPublicKeys: string[]) => {
  const network = useSelector(selectActiveNetworkSetting);
  const contacts = useSelector(selectAllContacts);
  const accounts = useSelector(selectVaultAccounts);

  const queryOptions = useMemo(
    () => getAccountsInfoQueryOptions(accountPublicKeys, network),
    [accountPublicKeys, network]
  );

  const { data: accountsInfo } = useQuery(queryOptions);

  const namesMap: Record<string, string> = {
    ...contacts.reduce(
      (acc, cur) => ({
        ...acc,
        [getAccountHashFromPublicKey(cur.publicKey)]: cur.name
      }),
      {}
    ),
    ...accounts.reduce(
      (acc, cur) => ({
        ...acc,
        [getAccountHashFromPublicKey(cur.publicKey)]: cur.name
      }),
      {}
    )
  };

  const accountsInfoWithNames: Record<string, IAccountInfo> =
    Object.fromEntries(
      Object.entries(accountsInfo ?? {}).map(([hash, info]) => {
        return [hash, { ...info, name: namesMap[hash] ?? info?.name ?? '' }];
      })
    );

  return accountsInfoWithNames;
};
