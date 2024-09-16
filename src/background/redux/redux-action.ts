import { ActionType } from 'typesafe-actions';

import * as accountBalances from './account-balances/actions';
import * as accountInfo from './account-info/actions';
import * as activeOrigin from './active-origin/actions';
import * as contacts from './contacts/actions';
import * as keys from './keys/actions';
import * as lastActivityTime from './last-activity-time/actions';
import * as ledger from './ledger/actions';
import * as loginRetryCount from './login-retry-count/actions';
import * as loginRetryLockoutTime from './login-retry-lockout-time/actions';
import * as promotion from './promotion/actions';
import * as rateApp from './rate-app/actions';
import * as recentRecipientPublicKeys from './recent-recipient-public-keys/actions';
import * as sagas from './sagas/actions';
import * as session from './session/actions';
import * as settings from './settings/actions';
import * as vaultCipher from './vault-cipher/actions';
import * as vault from './vault/actions';
import * as windowManagement from './windowManagement/actions';

const reduxAction = {
  sagas,
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
  accountInfo,
  contacts,
  rateApp,
  accountBalances,
  ledger,
  promotion
};

export type ReduxAction = ActionType<typeof reduxAction>;

export function isReduxAction(action?: {
  type?: unknown;
  meta?: unknown;
}): action is ReduxAction {
  return typeof action?.type === 'string';
}

export default reduxAction;
