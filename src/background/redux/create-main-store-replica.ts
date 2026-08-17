import { Reducer, configureStore } from '@reduxjs/toolkit';

import { RootState } from '@background/redux/store-types';

import { POPUP_SLICES, PopupSlice, PopupState } from './popup-state';
import { ReduxAction } from './redux-action';
import rootReducer from './root-reducer';

/**
 * The read-only store a frontend app renders from.
 *
 * Deliberately NOT `createStore` from `./index`: that factory installs the saga middleware
 * and runs `rootSaga`, which belongs to the background. A replica has no use for it — every
 * frontend action goes to the background through `dispatchToMainStore` (`runtime.sendMessage`),
 * so no watcher here could ever fire — and it is rebuilt on every `popupStateUpdated`
 * broadcast, so each broadcast was starting a fresh set of watcher tasks.
 *
 * It is also what dragged `casper-js-sdk` onto every page's startup path, via
 * `sagas/check-casper2-network-saga.ts`. And had an action ever reached a replica, the
 * background-only sagas would have run in a page context: `openExportKeysWindow` opens the
 * private-key export window, `resetVault` calls `storage.local.clear()`, and the vault sagas
 * broadcast SDK events to dapp tabs — once per open replica.
 */
export function createMainStoreReplica(state: PopupState) {
  // The allowlist is over slices, not fields: each listed slice is copied
  // wholesale, but a payload wider than PopupState would otherwise carry
  // vaultCipher and the real password hashes into a page.
  const slices = POPUP_SLICES.reduce(
    (acc, key) => {
      acc[key] = state[key] as never;
      return acc;
    },
    {} as { [K in PopupSlice]: PopupState[K] }
  );

  return configureStore({
    // Same cast as `createStore`: `rootReducer` is a `combineReducers` result, whose combined
    // shape RTK cannot infer, so it collapses `preloadedState` to a never-shape.
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
