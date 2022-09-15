import {
  applyMiddleware,
  // TODO: Move to actual `createStore`
  legacy_createStore as createStoreRedux
} from 'redux';
import reduxAction from './redux-action';
import rootReducer from './root-reducer';
import { composeEnhancers } from './utils';

export const createStore = (initialState: any) => {
  // configure middlewares
  const middlewares: any[] = [];
  // compose enhancers
  const enhancer = composeEnhancers(applyMiddleware(...middlewares));
  // create store
  return createStoreRedux(rootReducer, initialState, enhancer);
};

export { reduxAction as rootAction };
