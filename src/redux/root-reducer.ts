import { combineReducers } from 'redux';

import { reducer as vaultReducer } from './vault/reducer';

const rootReducer = combineReducers({
  vault: vaultReducer
});

export default rootReducer;
