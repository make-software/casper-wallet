import { CasperNetwork } from 'casper-wallet-core';
import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';

import { CSPR_NAME_RESOLUTION_BATCH_SIZE } from '@src/constants';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

import { chunkArray } from './utils';

export type CsprNameExpirationsPayload = Record<
  string,
  { csprName: string; expiresAt: string }
>;

interface CsprNameResolver {
  getAccountsInfo(params: {
    accountHashes: string[];
    network: CasperNetwork;
    withProxyHeader?: boolean;
  }): Promise<Record<string, IAccountInfo>>;
  resolveAccountFromCsprName(
    csprName: string,
    network: CasperNetwork,
    withProxyHeader?: boolean
  ): Promise<IAccountInfo | null>;
}

export const getCsprNameExpirations = async (
  accountPublicKeys: string[],
  network: CasperNetwork,
  repository: CsprNameResolver
): Promise<CsprNameExpirationsPayload> => {
  const publicKeyByHash: Record<string, string> = Object.fromEntries(
    accountPublicKeys.map(publicKey => [
      getAccountHashFromPublicKey(publicKey),
      publicKey
    ])
  );

  const accountsInfo = await repository.getAccountsInfo({
    accountHashes: Object.keys(publicKeyByHash),
    network,
    withProxyHeader: false
  });

  const accountsWithCsprName = Object.entries(accountsInfo).filter(([, info]) =>
    Boolean(info?.csprName)
  );

  const payload: CsprNameExpirationsPayload = {};

  for (const batch of chunkArray(
    accountsWithCsprName,
    CSPR_NAME_RESOLUTION_BATCH_SIZE
  )) {
    const resolved = await Promise.all(
      batch.map(([, info]) =>
        repository
          .resolveAccountFromCsprName(info.csprName!, network, false)
          .catch(() => null)
      )
    );

    batch.forEach(([accountHash, info], index) => {
      const publicKey = publicKeyByHash[accountHash];
      const expiresAt = resolved[index]?.csprNameExpiresAt;

      if (publicKey && info.csprName && expiresAt) {
        payload[publicKey] = { csprName: info.csprName, expiresAt };
      }
    });
  }

  return payload;
};
