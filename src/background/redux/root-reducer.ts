import { combineReducers } from 'redux';

import { reducer as vault } from './vault/reducer';
import { reducer as windowManagement } from './windowManagement/reducer';

const rootReducer = combineReducers({
  vault,
  windowManagement
});

export default rootReducer;
