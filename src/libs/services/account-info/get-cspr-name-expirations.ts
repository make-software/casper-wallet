import { CasperNetwork } from 'casper-wallet-core';
import { IAccountInfo } from 'casper-wallet-core/src/domain/accountInfo';

import { CSPR_NAME_RESOLUTION_BATCH_SIZE } from '@src/constants';

import {
  CsprNameExpirationRecord,
  CsprNameExpirationsByAccount
} from '@background/redux/cspr-name-expirations/types';

import { getAccountHashFromPublicKey } from '@libs/entities/Account';

import { handleError } from '../utils';
import { isWithinNoticeWindow } from './expiring-cspr-names';
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
  resolveAccountFromCsprName(
    csprName: string,
    network: CasperNetwork,
    withProxyHeader?: boolean
  ): Promise<IAccountInfo | null>;
}

// An expired or unparseable stored record counts as missing: a renewed name
// resolves to its new date in the same cycle, a truly expired one resolves to
// null and gets dropped by the reducer — which is also how stale records are
// cleaned up.
const shouldResolve = (
  csprName: string,
  stored: CsprNameExpirationRecord,
  now: number
): boolean => {
  if (stored.csprName !== csprName) {
    return true;
  }

  const expiresAtMs = new Date(stored.expiresAt).getTime();

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= now) {
    return true;
  }

  return isWithinNoticeWindow(expiresAtMs, now) && !stored.dismissed;
};

export const getCsprNameExpirations = async (
  accountPublicKeys: string[],
  // Keyed by account hash; comes from the shared ACCOUNT_INFO query cache so
  // this pipeline doesn't repeat the request `useFetchAccountsInfo` already made
  accountsInfo: Record<string, IAccountInfo>,
  network: CasperNetwork,
  repository: CsprNameResolver,
  storedExpirations: CsprNameExpirationsByAccount,
  now: number
): Promise<CsprNameExpirationsResult> => {
  const publicKeyByHash: Record<string, string> = Object.fromEntries(
    accountPublicKeys.map(publicKey => [
      getAccountHashFromPublicKey(publicKey),
      publicKey
    ])
  );

  const accountsWithCsprName = Object.entries(accountsInfo).filter(([, info]) =>
    Boolean(info?.csprName)
  );

  const expirations: CsprNameExpirationsPayload = {};
  const failedPublicKeys: string[] = [];
  const accountsToResolve: Array<[string, IAccountInfo]> = [];

  for (const [accountHash, info] of accountsWithCsprName) {
    const publicKey = publicKeyByHash[accountHash];

    if (!publicKey || !info.csprName) {
      continue;
    }

    const stored = storedExpirations[publicKey];

    if (stored != null && !shouldResolve(info.csprName, stored, now)) {
      // Re-emit the stored record verbatim so the reducer's sameNameAndDate
      // check preserves the dismissed flag without a network call.
      expirations[publicKey] = {
        csprName: stored.csprName,
        expiresAt: stored.expiresAt
      };

      continue;
    }

    accountsToResolve.push([accountHash, info]);
  }

  for (const batch of chunkArray(
    accountsToResolve,
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
