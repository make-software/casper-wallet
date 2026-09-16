import { Reducer, configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import { RootState } from '@background/redux/store-types';

import reduxAction, { ReduxAction } from './redux-action';
import rootReducer from './root-reducer';
import rootSaga from './root-saga';

export const createStore = (initialState: Partial<RootState>) => {
  const sagaMiddleware = createSagaMiddleware();

  const store = configureStore({
    // `rootReducer` is a `combineReducers` result whose combined shape RTK cannot
    // infer, so it collapses `preloadedState` to a never-shape. Re-assert it here.
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
    devTools: false
  });

  sagaMiddleware.run(rootSaga);

  return store;
};

export { reduxAction as rootAction };
