import { KeysState } from '@background/redux/keys/types';
import { SessionState } from '@background/redux/session/types';
import { RootState } from '@background/redux/store-types';
import { VaultState } from '@background/redux/vault/types';
import { WindowManagementState } from '@background/redux/windowManagement/types';

import { Account } from '@libs/types/account';

// The single definition of what leaves the background for UI replicas: a slice is
// broadcast only by being listed here, and only in the shape the overrides below pin.
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

type BroadcastAccount = Omit<Account, 'secretKey'> & {
  /** Never broadcast — fetch with fetchAccountSecretKeys() at the point of use. */
  secretKey: '';
  /** Derived at the boundary: the vault holds no signing key for this account. */
  watching: boolean;
};

type BroadcastVaultState = Omit<
  VaultState,
  'secretPhrase' | 'accounts' | 'payloadSeqById'
> & {
  secretPhrase: null;
  accounts: BroadcastAccount[];
};

type PopupSliceOverrides = {
  // Cipher/hash material stays background-only — see handlers/unlock-requests.ts,
  // which verifies passwords without ever sending this to a replica.
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
  // Secret phrase and account secret keys are served on demand — see
  // handlers/vault-secrets.ts and fetchAccountSecretKeys().
  vault: BroadcastVaultState;
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

// Field-by-field, not a spread: a spread both satisfies and widens the override
// type, so the next field added to SessionState would reach every page silently.
function popupSession(session: SessionState): PopupSliceOverrides['session'] {
  return {
    encryptionKeyHash: null,
    encryptionKeyDoesExist: session.encryptionKeyDoesExist,
    isLocked: session.isLocked,
    isContactEditingAllowed: session.isContactEditingAllowed
  };
}

function popupVault(vault: VaultState): BroadcastVaultState {
  return {
    secretPhrase: null,
    accounts: vault.accounts.map(({ secretKey, ...account }) => ({
      ...account,
      // The literal type is the enforcement: forgetting to blank a key is a compile
      // error. `watching` means watch-only — a Ledger account is excluded via `hardware`.
      secretKey: '' as const,
      watching: secretKey === '' && account.hardware == null
    })),
    accountNamesByOriginDict: vault.accountNamesByOriginDict,
    siteNameByOriginDict: vault.siteNameByOriginDict,
    activeAccountName: vault.activeAccountName,
    jsonById: vault.jsonById,
    eip712ById: vault.eip712ById
  };
}
