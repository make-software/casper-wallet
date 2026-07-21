import { createReducer } from 'typesafe-actions';

import {
  csprNameExpirationsUpdated,
  expiringCsprNamesDismissed
} from './actions';
import {
  CsprNameExpirationsByAccount,
  CsprNameExpirationsState
} from './types';

const initialState: CsprNameExpirationsState = {};

export const reducer = createReducer(initialState)
  .handleAction(
    csprNameExpirationsUpdated,
    (
      state: CsprNameExpirationsState,
      action: ReturnType<typeof csprNameExpirationsUpdated>
    ): CsprNameExpirationsState => {
      const { network, expirations, failedPublicKeys } = action.payload;
      const prevForNetwork = state[network] ?? {};

      const nextForNetwork: CsprNameExpirationsByAccount = Object.fromEntries(
        Object.entries(expirations).map(
          ([publicKey, { csprName, expiresAt }]) => {
            const prev = prevForNetwork[publicKey];
            const sameNameAndDate =
              prev?.csprName === csprName && prev?.expiresAt === expiresAt;

            return [
              publicKey,
              {
                csprName,
                expiresAt,
                dismissed: sameNameAndDate ? prev.dismissed : false
              }
            ];
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
    }
  )
  .handleAction(
    expiringCsprNamesDismissed,
    (
      state: CsprNameExpirationsState,
      action: ReturnType<typeof expiringCsprNamesDismissed>
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
  );
