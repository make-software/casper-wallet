import { CasperNetwork } from 'casper-wallet-core/src/domain/common/common';
import { RootState } from 'typesafe-actions';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export interface ExpiringCsprName {
  publicKey: string;
  csprName: string;
  expiresAt: string;
  dismissed: boolean;
}

export const selectExpiringCsprNames = (
  state: RootState,
  network: CasperNetwork
): ExpiringCsprName[] => {
  const map = state.csprNameExpirations[network] ?? {};
  const now = Date.now();

  return Object.entries(map)
    .map(([publicKey, rec]) => ({ publicKey, ...rec }))
    .filter(({ expiresAt }) => {
      const diff = new Date(expiresAt).getTime() - now;
      return diff >= 0 && diff <= FOURTEEN_DAYS_MS;
    })
    .sort(
      (a, b) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );
};

export const selectShowCsprNameExpirationBanner = (
  state: RootState,
  network: CasperNetwork
): boolean => selectExpiringCsprNames(state, network).some(r => !r.dismissed);
