import { AccountInfoState } from '@background/redux/account-info/types';
import { ActiveOriginFaviconState } from '@background/redux/active-origin-favicon/types';
import { ActiveOriginState } from '@background/redux/active-origin/types';
import { AppEventsState } from '@background/redux/app-events/types';
import { ContactsState } from '@background/redux/contacts/types';
import { CsprNameExpirationsState } from '@background/redux/cspr-name-expirations/types';
import { KeysState } from '@background/redux/keys/types';
import { LastActivityTimeState } from '@background/redux/last-activity-time/reducer';
import { LedgerState } from '@background/redux/ledger/types';
import { LoginRetryCountState } from '@background/redux/login-retry-count/reducer';
import { LoginRetryLockoutTimeState } from '@background/redux/login-retry-lockout-time/types';
import { RateAppState } from '@background/redux/rate-app/types';
import { RecentRecipientPublicKeysState } from '@background/redux/recent-recipient-public-keys/types';
import { SessionState } from '@background/redux/session/types';
import { SettingsState } from '@background/redux/settings/types';
import { TrustedWasmState } from '@background/redux/trusted-wasm/types';
import { VaultState } from '@background/redux/vault/types';
import { WindowManagementState } from '@background/redux/windowManagement/types';

export type PopupState = {
  keys: KeysState;
  session: SessionState;
  loginRetryCount: LoginRetryCountState;
  vault: VaultState;
  // `pendingRequests` is deliberately NOT broadcast: it holds each in-flight
  // request's dapp origin and tabId, and only background code needs it. See
  // the narrowing in `selectPopupState`.
  windowManagement: Omit<
    WindowManagementState,
    'pendingRequests' | 'exportKeysWindowId' | 'requests'
  >;
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
  trustedWasm: TrustedWasmState;
  csprNameExpirations: CsprNameExpirationsState;
};
