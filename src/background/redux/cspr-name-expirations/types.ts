import { CasperNetwork } from 'casper-wallet-core';

export interface CsprNameExpirationRecord {
  csprName: string;
  /** ISO 8601 */
  expiresAt: string;
  dismissed: boolean;
}

export type CsprNameExpirationsByAccount = Record<
  string,
  CsprNameExpirationRecord
>;

export type CsprNameExpirationsState = Partial<
  Record<CasperNetwork, CsprNameExpirationsByAccount>
>;
