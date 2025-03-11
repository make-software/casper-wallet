import { useQuery } from '@tanstack/react-query';
import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';
import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectAllContacts } from '@background/redux/contacts/selectors';
import { selectActiveNetworkSetting } from '@background/redux/settings/selectors';
import { selectVaultAccounts } from '@background/redux/vault/selectors';
import { accountInfoRepository } from '@background/wallet-repositories';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

export const useFetchAccountsInfo = (accountPublicKeys: string[]) => {
  const network = useSelector(selectActiveNetworkSetting);
  const contacts = useSelector(selectAllContacts);
  const accounts = useSelector(selectVaultAccounts);

  const accountHashes = useMemo(
    () => accountPublicKeys.map(key => getAccountHashFromPublicKey(key)),
    [accountPublicKeys]
  );

  const accountHashesString = accountHashes.toString();

  const { data: accountsInfo } = useQuery({
    queryKey: ['ACCOUNT_INFO', accountHashesString, network],
    queryFn: async () => {
      return await accountInfoRepository.getAccountsInfo({
        accountHashes,
        network: network.toLowerCase() as CasperNetwork,
        withProxyHeader: false
      });
    }
  });

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
