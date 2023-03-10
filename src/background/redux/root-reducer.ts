import { combineReducers } from 'redux';

import { reducer as vaultCipher } from './vault-cipher/reducer';
import { reducer as loginRetryCount } from './login-retry-count/reducer';
import { reducer as vault } from './vault/reducer';
import { reducer as keys } from './keys/reducer';
import { reducer as deploys } from './deploys/reducer';
import { reducer as windowManagement } from './windowManagement/reducer';
import { reducer as session } from './session/reducer';
import { reducer as loginRetryLockoutTime } from './login-retry-lockout-time/reducer';
import { reducer as timeoutDurationSetting } from './timeout-duration-setting/reducer';
import { reducer as lastActivityTime } from './last-activity-time/reducer';
import { reducer as activeOrigin } from './active-origin/reducer';

const rootReducer = combineReducers({
  vaultCipher,
  loginRetryCount,
  vault,
  keys,
  deploys,
  windowManagement,
  session,
  loginRetryLockoutTime,
  timeoutDurationSetting,
  lastActivityTime,
  activeOrigin
});

export default rootReducer;
