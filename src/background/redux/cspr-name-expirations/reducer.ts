import { createReducer } from 'typesafe-actions';

import {
  csprNameExpirationsUpdated,
  dismissCsprNameExpirations
} from './actions';
import { CsprNameExpirationRecord, CsprNameExpirationsState } from './types';

const initialState: CsprNameExpirationsState = {};

export const reducer = createReducer(initialState)
  .handleAction(csprNameExpirationsUpdated, (state, action) => {
    const { network, records } = action.payload;
    const prevMap = state[network] ?? {};
    const nextMap: Record<string, CsprNameExpirationRecord> = {};

    Object.entries(records).forEach(([publicKey, rec]) => {
      const prev = prevMap[publicKey];
      const dismissed =
        prev != null &&
        prev.csprName === rec.csprName &&
        prev.expiresAt === rec.expiresAt
          ? prev.dismissed
          : false;

      nextMap[publicKey] = {
        csprName: rec.csprName,
        expiresAt: rec.expiresAt,
        dismissed
      };
    });

    return { ...state, [network]: nextMap };
  })
  .handleAction(dismissCsprNameExpirations, (state, action) => {
    const { network, publicKeys } = action.payload;
    const prevMap = state[network];

    if (prevMap == null) {
      return state;
    }

    const nextMap = { ...prevMap };
    publicKeys.forEach(publicKey => {
      const rec = nextMap[publicKey];
      if (rec != null) {
        nextMap[publicKey] = { ...rec, dismissed: true };
      }
    });

    return { ...state, [network]: nextMap };
  });
