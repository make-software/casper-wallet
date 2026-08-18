import { KeysState } from '@background/redux/keys/types';
import { SessionState } from '@background/redux/session/types';
import { RootState } from '@background/redux/store-types';
import { VaultState } from '@background/redux/vault/types';
import { WindowManagementState } from '@background/redux/windowManagement/types';

// The single definition of what leaves the background for UI replicas. A slice is
// broadcast only by being listed here, and only in the shape the overrides below
// pin — adding either is a deliberate, reviewable edit.
export const POPUP_SLICES = [
  'keys',
  'session',
  'loginRetryCount',
  'vault',
  'windowManagement',
  'loginRetryLockoutTime',
  'lastActivityTime',
  'activeOrigin',
  'activeOriginFavicon',
  'settings',
  'recentRecipientPublicKeys',
  'accountInfo',
  'contacts',
  'rateApp',
  'ledger',
  'appEvents',
  'trustedWasm',
  'csprNameExpirations'
] as const satisfies readonly (keyof RootState)[];

export type PopupSlice = (typeof POPUP_SLICES)[number];

type PopupSliceOverrides = {
  // Cipher/hash material is served on demand — see handlers/private-state.ts.
  keys: Omit<
    KeysState,
    'passwordHash' | 'passwordSaltHash' | 'keyDerivationSaltHash'
  > & {
    passwordHash: null;
    passwordSaltHash: null;
    keyDerivationSaltHash: null;
  };
  session: Omit<SessionState, 'encryptionKeyHash'> & {
    encryptionKeyHash: null;
  };
  // `requests` carries each in-flight request's dapp origin and tabId; no replica
  // reads it, and `exportKeysWindowId` is background-only.
  windowManagement: Pick<WindowManagementState, 'windowId'>;
  // Write-order bookkeeping for the two payload maps — background-only.
  vault: Omit<VaultState, 'payloadSeqById'>;
};

export type PopupState = {
  [K in PopupSlice]: K extends keyof PopupSliceOverrides
    ? PopupSliceOverrides[K]
    : RootState[K];
};

export const selectPopupState = (state: RootState): PopupState => ({
  keys: {
    passwordHash: null,
    passwordSaltHash: null,
    keyDerivationSaltHash: null,
    keysDoesExist: state.keys.keysDoesExist
  },
  session: popupSession(state.session),
  loginRetryCount: state.loginRetryCount,
  vault: popupVault(state.vault),
  windowManagement: { windowId: state.windowManagement.windowId },
  loginRetryLockoutTime: state.loginRetryLockoutTime,
  lastActivityTime: state.lastActivityTime,
  activeOrigin: state.activeOrigin,
  activeOriginFavicon: state.activeOriginFavicon,
  settings: state.settings,
  recentRecipientPublicKeys: state.recentRecipientPublicKeys,
  accountInfo: state.accountInfo,
  contacts: state.contacts,
  rateApp: state.rateApp,
  ledger: state.ledger,
  appEvents: state.appEvents,
  trustedWasm: state.trustedWasm,
  csprNameExpirations: state.csprNameExpirations
});

// Field-by-field, not `{ ...session, encryptionKeyHash: null }`: a spread both
// satisfies and widens the override type, so the next field added to
// SessionState — the slice that holds session-secret material — would reach
// every page with no compile error.
function popupSession(session: SessionState): PopupSliceOverrides['session'] {
  return {
    encryptionKeyHash: null,
    encryptionKeyDoesExist: session.encryptionKeyDoesExist,
    isLocked: session.isLocked,
    isContactEditingAllowed: session.isContactEditingAllowed
  };
}

function popupVault(vault: VaultState): Omit<VaultState, 'payloadSeqById'> {
  return {
    secretPhrase: vault.secretPhrase,
    accounts: vault.accounts,
    accountNamesByOriginDict: vault.accountNamesByOriginDict,
    siteNameByOriginDict: vault.siteNameByOriginDict,
    activeAccountName: vault.activeAccountName,
    jsonById: vault.jsonById,
    eip712ById: vault.eip712ById
  };
}
