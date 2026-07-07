import { devToolsEnhancer } from '@redux-devtools/remote';
import { Reducer, StoreEnhancer, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import { isChromeBuild } from '@src/utils';

import { RootState } from '@background/redux/store-types';

import reduxAction, { ReduxAction } from './redux-action';
import rootReducer from './root-reducer';
import rootSaga from './root-saga';

export const createStore = (initialState: Partial<RootState>) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    // `rootReducer` is a `combineReducers` result; RTK
    // cannot infer its combined shape, so it collapses `preloadedState` to a
    // never-shape. Re-assert the reducer's real type (state + `Partial` preload
    // slot) so `preloadedState: Partial<RootState>` type-checks unchanged.
    reducer: rootReducer as unknown as Reducer<
      RootState,
      ReduxAction,
      Partial<RootState>
    >,
    preloadedState: initialState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: false,
        serializableCheck: false,
        immutableCheck: false
      }).concat(sagaMiddleware),
    devTools: false,
    enhancers: getDefaultEnhancers => {
      const enhancers = getDefaultEnhancers();

      if (process.env.NODE_ENV === 'development' && isChromeBuild) {
        // `@redux-devtools/remote` bundles its own `redux`, so its
        // `StoreEnhancer` is nominally unrelated to RTK's — cast to reconcile.
        return enhancers.concat(
          devToolsEnhancer({
            name: 'Casper Wallet',
            hostname: 'localhost',
            port: 8000,
            realtime: true,
            secure: false
          }) as StoreEnhancer
        );
      }

      return enhancers;
    }
  });

  sagaMiddleware.run(rootSaga);

  return store;
};

export { reduxAction as rootAction };
