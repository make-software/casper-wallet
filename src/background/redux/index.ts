import {
  applyMiddleware, // TODO: Move to actual `createStore`
  compose,
  legacy_createStore as createStoreRedux
} from 'redux';
import createSagaMiddleware from 'redux-saga';
import { composeWithDevTools } from 'remote-redux-devtools';
import { RootState } from 'typesafe-actions';

import reduxAction from './redux-action';
import rootReducer from './root-reducer';
import rootSaga from './root-saga';

// export const composeEnhancers = compose;
export const composeEnhancers =
  process.env.NODE_ENV === 'development'
    ? composeWithDevTools({
        name: 'Casper Wallet',
        hostname: 'localhost',
        port: 8000
      })
    : compose;

export const createStore = (initialState: Partial<RootState>) => {
  const sagaMiddleware = createSagaMiddleware();
  // configure middlewares
  const middlewares: any[] = [sagaMiddleware];
  // compose enhancers
  const enhancer = composeEnhancers(applyMiddleware(...middlewares));
  // create store
  const store = createStoreRedux(rootReducer, initialState, enhancer);
  // run sagas
  sagaMiddleware.run(rootSaga);

  return store;
};

export { reduxAction as rootAction };
