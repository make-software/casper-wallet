import { createSelector } from 'reselect';

import { RootState } from '@background/redux/store-types';

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

export const selectTrustedWasmByOrigin =
  (origin: string | null | undefined) =>
  (state: RootState): string[] => {
    const dict = state.trustedWasm.hashesByOriginDict;
    return origin != null && (dict?.[origin] || []).length > 0
      ? dict[origin]
      : [];
  };
