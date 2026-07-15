import { CSPR_NAME_EXPIRATION_NOTICE_DAYS } from '@src/constants';

import { CsprNameExpirationsByAccount } from '@background/redux/cspr-name-expirations/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ExpiringCsprName {
  publicKey: string;
  csprName: string;
  expiresAt: string;
  dismissed: boolean;
}

export const getExpiringCsprNames = (
  expirations: CsprNameExpirationsByAccount,
  now: number
): ExpiringCsprName[] => {
  const noticeWindowEnd = now + CSPR_NAME_EXPIRATION_NOTICE_DAYS * DAY_MS;

  return Object.entries(expirations)
    .map(([publicKey, expirationRecord]) => ({
      publicKey,
      ...expirationRecord
    }))
    .filter(({ expiresAt }) => {
      const expiresAtMs = new Date(expiresAt).getTime();

      return expiresAtMs > now && expiresAtMs <= noticeWindowEnd;
    })
    .sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );
};
