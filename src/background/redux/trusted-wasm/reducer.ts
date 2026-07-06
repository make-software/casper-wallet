import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { isKeysEqual } from 'casper-wallet-core';

import { TrustedWasmState } from './types';

const initialState: TrustedWasmState = {
  hashesByOriginDict: {}
};

const slice = createSlice({
  name: 'trustedWasm',
  initialState,
  reducers: {
    resetTrustedWasmState: () => initialState,
    addWasmToTrusted: (
      state,
      action: PayloadAction<{ origin: string; wasmHash: string }>
    ) => {
      const { wasmHash, origin } = action.payload;
      const currentTrustedWasm =
        state.hashesByOriginDict ?? initialState.hashesByOriginDict;

      return {
        ...state,
        hashesByOriginDict: {
          ...currentTrustedWasm,
          [origin]: [
            ...new Set([...(currentTrustedWasm?.[origin] ?? []), wasmHash])
          ]
        }
      };
    },
    removeWasmFromTrusted: (
      state,
      action: PayloadAction<{ origin: string; wasmHash: string }>
    ) => {
      const { wasmHash, origin } = action.payload;
      const currentTrustedWasm =
        state.hashesByOriginDict ?? initialState.hashesByOriginDict;

      if (currentTrustedWasm?.[origin]) {
        return {
          ...state,
          hashesByOriginDict: {
            ...currentTrustedWasm,
            [origin]: currentTrustedWasm[origin].filter(
              hash => !isKeysEqual(hash, wasmHash)
            )
          }
        };
      } else {
        return { ...state };
      }
    },
    removeAllWasmFromTrustedOrigin: (
      state,
      action: PayloadAction<{ origin: string }>
    ) => {
      const { origin } = action.payload;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructuring omit: drops `origin`'s key while collecting the rest
      const { [origin]: _removed, ...rest } =
        state.hashesByOriginDict ?? initialState.hashesByOriginDict;

      return { ...state, hashesByOriginDict: rest };
    }
  }
});

export const {
  addWasmToTrusted,
  removeAllWasmFromTrustedOrigin,
  removeWasmFromTrusted,
  resetTrustedWasmState
} = slice.actions;
export const reducer = slice.reducer;
