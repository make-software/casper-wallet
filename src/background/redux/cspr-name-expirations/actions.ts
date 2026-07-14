import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { createAction } from 'typesafe-actions';

export interface CsprNameExpirationInput {
  csprName: string;
  expiresAt: string;
}

export const csprNameExpirationsUpdated = createAction(
  'CSPR_NAME_EXPIRATIONS_UPDATED'
)<{
  network: CasperNetwork;
  records: Record<string, CsprNameExpirationInput>;
}>();

export const dismissCsprNameExpirations = createAction(
  'DISMISS_CSPR_NAME_EXPIRATIONS'
)<{
  network: CasperNetwork;
  publicKeys: string[];
}>();
