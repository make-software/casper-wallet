import { CasperNetwork } from 'casper-wallet-core';

export interface CsprNameExpirationRecord {
  csprName: string;
  expiresAt: string;
  dismissed: boolean;
}

export type CsprNameExpirationsState = Partial<
  Record<CasperNetwork, Record<string, CsprNameExpirationRecord>>
>;
