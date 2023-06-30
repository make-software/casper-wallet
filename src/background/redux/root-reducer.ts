import { combineReducers } from 'redux';

import { reducer as vaultCipher } from './vault-cipher/reducer';
import { reducer as loginRetryCount } from './login-retry-count/reducer';
import { reducer as vault } from './vault/reducer';
import { reducer as keys } from './keys/reducer';
import { reducer as windowManagement } from './windowManagement/reducer';
import { reducer as session } from './session/reducer';
import { reducer as loginRetryLockoutTime } from './login-retry-lockout-time/reducer';
import { reducer as lastActivityTime } from './last-activity-time/reducer';
import { reducer as settings } from './settings/reducer';
import { reducer as activeOrigin } from './active-origin/reducer';
import { reducer as recentRecipientPublicKeys } from './recent-recipient-public-keys/reducer';
import { reducer as accountInfo } from './account-info/reducer';

const rootReducer = combineReducers({
  vaultCipher,
  loginRetryCount,
  vault,
  keys,
  windowManagement,
  session,
  loginRetryLockoutTime,
  lastActivityTime,
  activeOrigin,
  settings,
  recentRecipientPublicKeys,
  accountInfo
});

export default rootReducer;
