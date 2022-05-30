import { combineReducers } from 'redux';

import { reducer as vaultReducer } from './vault/reducer';
import { reducer as windowManagementReducer } from './windowManagement/reducer';

const rootReducer = combineReducers({
  vault: vaultReducer,
  windowManagement: windowManagementReducer
});

export default rootReducer;
