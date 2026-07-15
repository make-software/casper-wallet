import { CasperNetwork } from 'casper-wallet-core';
import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';

import { CSPR_NAME_RESOLUTION_BATCH_SIZE } from '@src/constants';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

import { handleError } from '../utils';
import { chunkArray } from './utils';

export type CsprNameExpirationsPayload = Record<
  string,
  { csprName: string; expiresAt: string }
>;

export interface CsprNameExpirationsResult {
  expirations: CsprNameExpirationsPayload;
  /** Accounts whose resolution request failed, as opposed to resolving to "no data" */
  failedPublicKeys: string[];
}

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
): Promise<CsprNameExpirationsResult> => {
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

  const expirations: CsprNameExpirationsPayload = {};
  const failedPublicKeys: string[] = [];

  for (const batch of chunkArray(
    accountsWithCsprName,
    CSPR_NAME_RESOLUTION_BATCH_SIZE
  )) {
    const resolved = await Promise.all(
      batch.map(([, info]) =>
        repository
          .resolveAccountFromCsprName(info.csprName!, network, false)
          .then(accountInfo => ({ accountInfo, error: null }))
          .catch((error: Error) => ({ accountInfo: null, error }))
      )
    );

    batch.forEach(([accountHash, info], index) => {
      const publicKey = publicKeyByHash[accountHash];
      const { accountInfo, error } = resolved[index];

      if (!publicKey || !info.csprName) {
        return;
      }

      // A rejected request must stay distinguishable from a name that
      // legitimately resolved to nothing (the repository returns null for
      // expired/unknown names) — otherwise a transient error would wipe the
      // stored record and its dismissed flag.
      if (error != null) {
        handleError(error);
        failedPublicKeys.push(publicKey);

        return;
      }

      const expiresAt = accountInfo?.csprNameExpiresAt;

      if (expiresAt) {
        expirations[publicKey] = { csprName: info.csprName, expiresAt };
      }
    });
  }

  return { expirations, failedPublicKeys };
};
