import { createSelector } from 'reselect';
import { RootState } from 'typesafe-actions';

import { selectActiveOrigin } from '../active-origin/selectors';

export const selectTrustedWasmByOriginDict = (state: RootState) =>
  state.trustedWasm.hashesByOriginDict;

export const selectTrustedWasmForActiveOrigin = createSelector(
  selectActiveOrigin,
  selectTrustedWasmByOriginDict,
  (origin, hashesByOriginDict) =>
    origin != null && (hashesByOriginDict?.[origin] || []).length > 0
      ? hashesByOriginDict[origin]
      : []
);
