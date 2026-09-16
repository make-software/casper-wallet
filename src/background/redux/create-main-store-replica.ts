import { Reducer, configureStore } from '@reduxjs/toolkit';

import { RootState } from '@background/redux/store-types';

import { POPUP_SLICES, PopupSlice, PopupState } from './popup-state';
import { ReduxAction } from './redux-action';
import rootReducer from './root-reducer';

/**
 * The read-only store a frontend app renders from.
 *
 * Deliberately NOT `createStore` from `./index`: that factory runs `rootSaga`, which belongs
 * to the background — `openExportKeysWindow` and `resetVault` must never run in a page.
 */
export function createMainStoreReplica(state: PopupState) {
  // The allowlist is over slices, not fields: what it stops is an unlisted
  // top-level slice — `vaultCipher` above all — reaching a page.
  const slices = POPUP_SLICES.reduce(
    (acc, key) => {
      acc[key] = state[key] as never;
      return acc;
    },
    {} as { [K in PopupSlice]: PopupState[K] }
  );

  return configureStore({
    // Same cast as `createStore`: RTK cannot infer a `combineReducers` shape, so it
    // collapses `preloadedState` to a never-shape.
    reducer: rootReducer as unknown as Reducer<
      RootState,
      ReduxAction,
      Partial<RootState>
    >,
    preloadedState: {
      ...slices,
      // Truthful defaults for what the broadcast deliberately omits: a replica
      // tracks no request descriptors, no export window, no payload write order.
      windowManagement: {
        windowId: state.windowManagement.windowId,
        requests: {},
        exportKeysWindowId: null
      },
      vault: { ...state.vault, payloadSeqById: {} }
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: false,
        serializableCheck: false,
        immutableCheck: false
      }),
    devTools: false
  });
}
