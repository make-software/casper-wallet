import { isKeysEqual } from 'casper-wallet-core';
import { createReducer } from 'typesafe-actions';

import {
  addWasmToTrusted,
  removeAllWasmFromTrustedOrigin,
  removeWasmFromTrusted,
  resetTrustedWasmState
} from './actions';
import { TrustedWasmState } from './types';

type State = TrustedWasmState;

const initialState: State = {
  hashesByOriginDict: {}
};

export const reducer = createReducer(initialState)
  .handleAction(resetTrustedWasmState, () => initialState)
  .handleAction(
    addWasmToTrusted,
    (state, action: ReturnType<typeof addWasmToTrusted>): State => {
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
    }
  )
  .handleAction(
    removeWasmFromTrusted,
    (state, action: ReturnType<typeof removeWasmFromTrusted>): State => {
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
    }
  )
  .handleAction(
    removeAllWasmFromTrustedOrigin,
    (
      state,
      action: ReturnType<typeof removeAllWasmFromTrustedOrigin>
    ): State => {
      const { origin } = action.payload;
      const currentTrustedWasm =
        state.hashesByOriginDict ?? initialState.hashesByOriginDict;

      if (currentTrustedWasm?.[origin]) {
        delete currentTrustedWasm[origin];
      }

      return { ...state, hashesByOriginDict: { ...currentTrustedWasm } };
    }
  );
