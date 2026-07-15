import { createReducer } from 'typesafe-actions';

import {
  csprNameExpirationsUpdated,
  expiringCsprNamesDismissed
} from './actions';
import { CsprNameExpirationsState } from './types';

const initialState: CsprNameExpirationsState = {};

export const reducer = createReducer(initialState)
  .handleAction(
    csprNameExpirationsUpdated,
    (
      state: CsprNameExpirationsState,
      action: ReturnType<typeof csprNameExpirationsUpdated>
    ): CsprNameExpirationsState => {
      const { network, expirations } = action.payload;
      const prevForNetwork = state[network] ?? {};

      return {
        ...state,
        [network]: Object.fromEntries(
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
        )
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
