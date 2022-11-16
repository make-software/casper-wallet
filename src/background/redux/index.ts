import {
  applyMiddleware,
  // TODO: Move to actual `createStore`
  legacy_createStore as createStoreRedux
} from 'redux';
import createSagaMiddleware from 'redux-saga';

import reduxAction from './redux-action';
import rootReducer from './root-reducer';
import rootSaga from './root-saga';

import { composeEnhancers } from './utils';

export const createStore = (initialState: any) => {
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
