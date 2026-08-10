import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { CasperNetwork } from 'casper-wallet-core';

import {
  CsprNameExpirationsByAccount,
  CsprNameExpirationsState
} from './types';

const initialState: CsprNameExpirationsState = {};

const slice = createSlice({
  name: 'csprNameExpirations',
  initialState,
  reducers: {
    csprNameExpirationsUpdated: (
      state,
      action: PayloadAction<{
        network: CasperNetwork;
        expirations: Record<string, { csprName: string; expiresAt: string }>;
        /** Accounts whose resolution failed this fetch — their stored records must be kept, not dropped */
        failedPublicKeys?: string[];
      }>
    ): CsprNameExpirationsState => {
      const { network, expirations, failedPublicKeys } = action.payload;
      const prevForNetwork = state[network] ?? {};

      const nextForNetwork: CsprNameExpirationsByAccount = Object.fromEntries(
        Object.entries(expirations).map(
          ([publicKey, { csprName, expiresAt }]) => {
            const prev = prevForNetwork[publicKey];
            // The dismissed flag survives only while the record is unchanged:
            // a renewed date or a different name resets it.
            const dismissed =
              prev != null &&
              prev.csprName === csprName &&
              prev.expiresAt === expiresAt &&
              prev.dismissed;

            return [publicKey, { csprName, expiresAt, dismissed }];
          }
        )
      );

      // A failed resolution is not evidence the name is gone — keep the
      // stored record (and its dismissed flag) instead of dropping it.
      failedPublicKeys?.forEach(publicKey => {
        const prev = prevForNetwork[publicKey];

        if (prev != null && nextForNetwork[publicKey] == null) {
          nextForNetwork[publicKey] = prev;
        }
      });

      return {
        ...state,
        [network]: nextForNetwork
      };
    },
    expiringCsprNamesDismissed: (
      state,
      action: PayloadAction<{
        network: CasperNetwork;
        publicKeys: string[];
      }>
    ): CsprNameExpirationsState => {
      const { network, publicKeys } = action.payload;
      const forNetwork = state[network];

      if (!forNetwork) {
        return state;
      }

      return {
        ...state,
        [network]: Object.fromEntries(
          Object.entries(forNetwork).map(([publicKey, record]) => [
            publicKey,
            publicKeys.includes(publicKey)
              ? { ...record, dismissed: true }
              : record
          ])
        )
      };
    }
  }
});

export const { csprNameExpirationsUpdated, expiringCsprNamesDismissed } =
  slice.actions;
export const reducer = slice.reducer;
