import { composeWithDevTools } from '@redux-devtools/remote';
import {
  applyMiddleware, // TODO: Move to actual `createStore`
  compose,
  legacy_createStore as createStoreRedux
} from 'redux';
import createSagaMiddleware from 'redux-saga';
import { RootState } from 'typesafe-actions';

import { isChromeBuild } from '@src/utils';

import reduxAction from './redux-action';
import rootReducer from './root-reducer';
import rootSaga from './root-saga';

// export const composeEnhancers = compose;
export const composeEnhancers =
  process.env.NODE_ENV === 'development' && isChromeBuild
    ? composeWithDevTools({
        name: 'Casper Wallet',
        hostname: 'localhost',
        port: 8000
      })
    : compose;

export const createStore = (initialState: Partial<RootState>) => {
  const sagaMiddleware = createSagaMiddleware();
  // configure middlewares
  const middlewares = [sagaMiddleware];
  // compose enhancers
  // @ts-ignore
  const enhancer = composeEnhancers(applyMiddleware(...middlewares));
  // create store
  // @ts-ignore
  const store = createStoreRedux(rootReducer, initialState, enhancer);
  // run sagas
  sagaMiddleware.run(rootSaga);

  return store;
};

export { reduxAction as rootAction };
