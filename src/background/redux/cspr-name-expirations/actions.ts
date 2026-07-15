import { CasperNetwork } from 'casper-wallet-core';
import { createAction } from 'typesafe-actions';

export const csprNameExpirationsUpdated = createAction(
  'CSPR_NAME_EXPIRATIONS_UPDATED'
)<{
  network: CasperNetwork;
  expirations: Record<string, { csprName: string; expiresAt: string }>;
}>();

export const expiringCsprNamesDismissed = createAction(
  'EXPIRING_CSPR_NAMES_DISMISSED'
)<{
  network: CasperNetwork;
  publicKeys: string[];
}>();
