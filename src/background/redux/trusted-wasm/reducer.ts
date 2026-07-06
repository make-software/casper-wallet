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
            ...new Set([...(currentTrustedWasm[origin] ?? []), wasmHash])
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

      if (currentTrustedWasm[origin]) {
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
      // Copy-then-delete instead of computed-key rest destructuring: the latter
      // compiles to TS's `__rest` helper, which contains a `typeof key ===
      // 'symbol'` branch that is unreachable for a string origin (dead branch,
      // and ts-jest strips inline istanbul-ignore comments). Behaviour is
      // identical: drop `origin`'s key while keeping the rest.
      const rest = {
        ...(state.hashesByOriginDict ?? initialState.hashesByOriginDict)
      };
      delete rest[origin];

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
