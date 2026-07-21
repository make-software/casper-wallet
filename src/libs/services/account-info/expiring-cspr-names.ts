import { CSPR_NAME_EXPIRATION_NOTICE_DAYS } from '@src/constants';

import { CsprNameExpirationsByAccount } from '@background/redux/cspr-name-expirations/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ExpiringCsprName {
  publicKey: string;
  csprName: string;
  expiresAt: string;
  dismissed: boolean;
}

/** Not yet expired, but close enough to it that the user should be notified */
export const isWithinNoticeWindow = (
  expiresAtMs: number,
  now: number
): boolean =>
  expiresAtMs > now &&
  expiresAtMs <= now + CSPR_NAME_EXPIRATION_NOTICE_DAYS * DAY_MS;

export const getExpiringCsprNames = (
  expirations: CsprNameExpirationsByAccount,
  now: number
): ExpiringCsprName[] =>
  Object.entries(expirations)
    .map(([publicKey, expirationRecord]) => ({
      publicKey,
      ...expirationRecord
    }))
    .filter(({ expiresAt }) =>
      isWithinNoticeWindow(new Date(expiresAt).getTime(), now)
    )
    .sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );
