import { ActionType, StateType } from 'typesafe-actions';

import { AccountInfoState } from '@background/redux/account-info/types';
import { ActiveOriginFaviconState } from '@background/redux/active-origin-favicon/types';
import { ActiveOriginState } from '@background/redux/active-origin/types';
import { AppEventsState } from '@background/redux/app-events/types';
import { ContactsState } from '@background/redux/contacts/types';
import { KeysState } from '@background/redux/keys/types';
import { LastActivityTimeState } from '@background/redux/last-activity-time/reducer';
import { LedgerState } from '@background/redux/ledger/types';
import { LoginRetryCountState } from '@background/redux/login-retry-count/reducer';
import { LoginRetryLockoutTimeState } from '@background/redux/login-retry-lockout-time/types';
import { RateAppState } from '@background/redux/rate-app/types';
import { RecentRecipientPublicKeysState } from '@background/redux/recent-recipient-public-keys/types';
import { SessionState } from '@background/redux/session/types';
import { SettingsState } from '@background/redux/settings/types';
import { VaultCipherState } from '@background/redux/vault-cipher/types';
import { VaultState } from '@background/redux/vault/types';
import { WindowManagementState } from '@background/redux/windowManagement/types';

declare module 'typesafe-actions' {
  export type Store = StateType<typeof import('./index').default>;
  export type RootAction = ActionType<typeof import('./redux-action').default>;
  export type RootStateKey = Extract<
    keyof StateType<typeof import('./root-reducer').default>,
    string
  >;
  export type RootState = Pick<
    StateType<typeof import('./root-reducer').default>,
    RootStateKey
  >;
  export type Services = typeof import('@libs/services');

  interface Types {
    RootAction: RootAction;
  }
}
export type PopupState = {
  keys: KeysState;
  session: SessionState;
  loginRetryCount: LoginRetryCountState;
  vault: VaultState;
  windowManagement: WindowManagementState;
  vaultCipher: VaultCipherState;
  loginRetryLockoutTime: LoginRetryLockoutTimeState;
  lastActivityTime: LastActivityTimeState;
  settings: SettingsState;
  activeOrigin: ActiveOriginState;
  activeOriginFavicon: ActiveOriginFaviconState;
  recentRecipientPublicKeys: RecentRecipientPublicKeysState;
  accountInfo: AccountInfoState;
  contacts: ContactsState;
  rateApp: RateAppState;
  ledger: LedgerState;
  appEvents: AppEventsState;
};
