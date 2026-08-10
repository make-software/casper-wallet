import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { windowRequestResponded } from '@background/redux/windowManagement/actions';
import { isStorableRequestId } from '@background/redux/windowManagement/request-map';

import { CasperWalletSupports } from '@content/sdk-types';

import { SecretPhrase } from '@libs/crypto';
import { Account } from '@libs/types/account';

import { getPayload } from './payload-map';
import { VaultState } from './types';

type State = VaultState;

/**
 * Ceiling on `jsonById` / `eip712ById`.
 *
 * Both maps are cleared per request by the `windowRequestResponded` case in
 * `extraReducers` below — but a deletion can be MISSED. An MV3 service-worker
 * restart wipes `windowManagement.requests` (in-memory only) while these maps
 * come back from the encrypted cipher through `vaultLoaded`, so the response
 * for a pre-restart id can never arrive. Nothing else deletes a key:
 * `deploysReseted` is a full-slice reset dispatched on lock, and `lockVaultSaga`
 * flushes `updateVaultCipher` BEFORE it, so a leaked payload is re-loaded on the
 * next unlock and lives in `storage.local` for good — while riding along in
 * every popup-state broadcast, since `selectPopupState` sends `vault` whole.
 *
 * Ten is far above real concurrency (one approval window means 1-2 in-flight
 * requests) and far below anything that costs memory. See `storePayload` for
 * which write loses when the ceiling is reached, and why it is the incoming one.
 */
export const MAX_STORED_PAYLOADS = 10;

type PayloadMap = State['jsonById'];

// `__proto__` is refused outright, for the reason `isStorableRequestId` was
// written: the map is built by assignment, and assigning `__proto__` runs the
// setter instead of adding an entry. `tsconfig.json` targets es2017, so
// `{ ...payloads, [requestId]: json }` is EMITTED as nested `Object.assign` —
// with a string value that setter is a silent no-op, but the deploy path
// dispatches a parsed OBJECT (see the note on `deployPayloadReceived`), and an
// object value sets this map's prototype for every later lookup. Relying on the
// emit would also make the guarantee a `target` setting: at es2018 the spread is
// native and the computed key becomes an own property instead. The guard states
// it here so neither the toolchain nor the value type can move it.
//
// Not reachable today either — `handleSdkMethod` rejects that id at the message
// boundary for every approval type — but the two guards answer to different
// owners, and this map is the one at risk.
//
// At capacity the INCOMING write is refused; nothing already stored is evicted.
//
// The obvious alternative — make room by dropping the oldest entry — puts the
// loss on the request that has waited longest, which is exactly the one this
// fix exists to protect: a request the user is confirming on a Ledger while a
// page pushes ten more. `signRequest` has no connected-site precondition, the
// message handlers are concurrent, and a supersede only frees a slot after
// `windows.create` plus `CANCEL_GRACE_MS`, so a burst lands entirely before any
// `windowRequestResponded` can. Refusing instead puts the loss on the request
// the caller controls.
//
// A rewrite of an id already present is always applied — it cannot grow the map.
//
// Residual, accepted: a payload leaks whenever its deletion never reaches the
// cipher. Two routes, not one — the request is never answered at all (auto-lock
// while an approval window is open, then the MV3 worker dies with no
// `windows.onRemoved` handler alive to cancel it), or it IS answered and the
// worker dies inside the 500ms re-encrypt debounce that would have persisted
// the deletion. Either way the entry outlives lock/unlock, because
// `lockVaultSaga` flushes the cipher before `deploysReseted` and `vaultLoaded`
// restores from it, so enough of them fill the map and refuse every later
// payload.
//
// That state has an exit, and it is worth writing down because nothing in the
// UI points at it: `vaultLoaded` keeps the IN-MEMORY map whenever it is
// non-empty and discards the cipher's. `signRequest` has no lock gate, so one
// request arriving while the vault is locked writes the only entry there is —
// lock, let a dapp send one request, unlock, and the accumulated entries are
// gone. Reclaiming the slots without that sequence means reconciling the map
// against the windows actually open, which is a separate change.
function storePayload(
  payloads: PayloadMap,
  requestId: string,
  json: string
): PayloadMap {
  if (!isStorableRequestId(requestId)) {
    return payloads;
  }

  if (
    Object.keys(payloads).length >= MAX_STORED_PAYLOADS &&
    getPayload(payloads, requestId) == null
  ) {
    return payloads;
  }

  return { ...payloads, [requestId]: json };
}

const initialState: State = {
  secretPhrase: null,
  accounts: [],
  accountNamesByOriginDict: {},
  siteNameByOriginDict: {},
  activeAccountName: null,
  jsonById: {},
  eip712ById: {}
};

const slice = createSlice({
  name: 'vault',
  initialState,
  reducers: {
    vaultReseted: () => initialState,
    vaultLoaded: (
      state,
      {
        payload: {
          accountNamesByOriginDict,
          siteNameByOriginDict,
          accounts,
          activeAccountName,
          secretPhrase,
          jsonById,
          eip712ById
        }
      }: PayloadAction<VaultState>
    ) => ({
      accountNamesByOriginDict,
      siteNameByOriginDict,
      accounts,
      activeAccountName,
      secretPhrase,
      jsonById:
        Object.keys(state.jsonById).length === 0 ? jsonById : state.jsonById,
      eip712ById:
        Object.keys(state.eip712ById).length === 0
          ? eip712ById
          : state.eip712ById
    }),
    secretPhraseCreated: (
      state,
      action: PayloadAction<SecretPhrase>
    ): State => ({
      ...state,
      secretPhrase: action.payload
    }),
    accountAdded: (state, action: PayloadAction<Account>): State => {
      const account = action.payload;

      return {
        ...state,
        accounts: [...state.accounts, account],
        activeAccountName: account.name
      };
    },
    accountImported: (
      state,
      { payload: account }: PayloadAction<Account>
    ): State => ({
      ...state,
      accounts: [...state.accounts, account],
      activeAccountName:
        state.accounts.length === 0 ? account.name : state.activeAccountName
    }),
    accountsAdded: (
      state,
      { payload: accounts }: PayloadAction<Account[]>
    ) => ({
      ...state,
      accounts: [...state.accounts, ...accounts],
      activeAccountName:
        state.accounts.length === 0 ? accounts[0].name : state.activeAccountName
    }),
    accountsImported: (
      state,
      { payload: accounts }: PayloadAction<Account[]>
    ) => ({
      ...state,
      accounts: [...state.accounts, ...accounts],
      activeAccountName:
        state.accounts.length === 0 ? accounts[0].name : state.activeAccountName
    }),
    accountRemoved: (
      state,
      { payload: { accountName } }: PayloadAction<{ accountName: string }>
    ): State => {
      const newAccounts = state.accounts.filter(
        account => account.name !== accountName
      );

      const newActiveAccount =
        state.activeAccountName === accountName
          ? (state.accounts.length > 1 && newAccounts[0].name) || null
          : state.activeAccountName;

      const newAccountNamesByOriginDict = Object.fromEntries(
        Object.entries(state.accountNamesByOriginDict)
          // when last account for origin, remove group
          .filter(
            ([, names = []]) =>
              !(names.includes(accountName) && names.length === 1)
          )
          // otherwise just remove single account
          .map(([origin, names = []]) => [
            origin,
            names.filter(name => name !== accountName)
          ])
      );

      return {
        ...state,
        accounts: newAccounts,
        activeAccountName: newActiveAccount,
        accountNamesByOriginDict: newAccountNamesByOriginDict
      };
    },
    accountRenamed: (
      state,
      {
        payload: { oldName, newName }
      }: PayloadAction<{ oldName: string; newName: string }>
    ): State => {
      const newAccountNamesByOriginDict = Object.fromEntries(
        Object.keys(state.accountNamesByOriginDict).map(origin => [
          origin,
          (state.accountNamesByOriginDict[origin] || []).map(accountName =>
            accountName === oldName ? newName : accountName
          )
        ])
      );

      return {
        ...state,
        accounts: state.accounts.map(account => {
          if (account.name === oldName) {
            return {
              ...account,
              name: newName
            };
          }
          return account;
        }),
        activeAccountName:
          state.activeAccountName === oldName
            ? newName
            : state.activeAccountName,
        accountNamesByOriginDict: newAccountNamesByOriginDict
      };
    },
    siteConnected: (
      state,
      {
        payload: { siteOrigin, accountNames, siteTitle }
      }: PayloadAction<{
        siteOrigin: string;
        accountNames: string[];
        siteTitle: string;
      }>
    ) => {
      // Behaviour-identical to the verbatim body: the original spread the same
      // `... || []` expression twice, leaving a dead `|| []` branch inside the
      // truthy path (and a defensive `state?.` that never short-circuits since
      // `state` is always defined). Hoisting to a single const preserves
      // semantics and lets the one remaining `|| []` branch be exercised.
      // (ts-jest strips inline `istanbul ignore` comments, so annotation was
      // not viable here.)
      const existingNames = state.accountNamesByOriginDict[siteOrigin] || [];

      return {
        ...state,
        siteNameByOriginDict: {
          ...state.siteNameByOriginDict,
          [siteOrigin]: siteTitle
        },
        accountNamesByOriginDict: {
          ...state.accountNamesByOriginDict,
          [siteOrigin]:
            existingNames.length > 0
              ? [...existingNames, ...accountNames]
              : [...accountNames]
        }
      };
    },
    anotherAccountConnected: (
      state,
      {
        payload: { siteOrigin, accountName }
      }: PayloadAction<{ siteOrigin: string; accountName: string }>
    ) => {
      // See siteConnected: hoist the duplicated `... || []` to eliminate the
      // dead second `|| []` branch while preserving behaviour.
      const existingNames = state.accountNamesByOriginDict[siteOrigin] || [];

      return {
        ...state,
        accountNamesByOriginDict: {
          ...state.accountNamesByOriginDict,
          [siteOrigin]:
            existingNames.length > 0
              ? [...existingNames, accountName]
              : [accountName]
        }
      };
    },
    accountDisconnected: (
      state,
      {
        payload: { siteOrigin, accountName }
      }: PayloadAction<{ accountName: string; siteOrigin: string }>
    ) => {
      const newAccountNamesByOriginDict = Object.fromEntries(
        Object.entries(state.accountNamesByOriginDict)
          // when last account for origin, remove group
          .filter(
            ([origin, names = []]) =>
              !(
                origin === siteOrigin &&
                names.includes(accountName) &&
                names.length === 1
              )
          )
          // otherwise just remove single account
          .map(([origin, names = []]) => [
            origin,
            origin === siteOrigin
              ? names.filter(name => name !== accountName)
              : names
          ])
      );
      return {
        ...state,
        accountNamesByOriginDict: newAccountNamesByOriginDict
      };
    },
    siteDisconnected: (
      state,
      { payload: { siteOrigin } }: PayloadAction<{ siteOrigin: string }>
    ) => ({
      ...state,
      accountNamesByOriginDict: Object.fromEntries(
        Object.entries(state.accountNamesByOriginDict).filter(
          ([origin]) => origin !== siteOrigin
        )
      )
    }),
    activeAccountChanged: (state, { payload }: PayloadAction<string>) => ({
      ...state,
      activeAccountName: payload
    }),
    activeAccountSupportsChanged: (
      state,
      { payload }: PayloadAction<CasperWalletSupports[]>
    ) => ({
      ...state,
      accounts: state.accounts.map(account => {
        if (account.name === state.activeAccountName) {
          return {
            ...account,
            supports: payload
          };
        } else {
          return account;
        }
      })
    }),
    deploysReseted: (): State => initialState,
    // Merged, not replaced. Building a new single-entry dict here erased the
    // payload of every other in-flight request — and since #1427 a request can
    // legitimately outlive the window that displaced it: `cancelRequestsDisplacedBy`
    // spares one that another window still shows (the Ledger permission window
    // carries the same requestId). That survivor stayed 'open' on screen with
    // nothing to sign, because its transaction JSON had just been dropped here.
    deployPayloadReceived: (
      state,
      { payload }: PayloadAction<{ id: string; json: string }>
    ): State => ({
      ...state,
      jsonById: storePayload(state.jsonById, payload.id, payload.json)
    }),
    eip712PayloadReceived: (
      state,
      { payload }: PayloadAction<{ id: string; json: string }>
    ): State => ({
      ...state,
      eip712ById: storePayload(state.eip712ById, payload.id, payload.json)
    }),
    hideAccountFromListChanged: (
      state,
      { payload: { accountName } }: PayloadAction<{ accountName: string }>
    ) => {
      const visibleAccounts = state.accounts.filter(
        account => !account.hidden && account.name !== accountName
      );

      const newActiveAccount =
        state.activeAccountName === accountName
          ? (state.accounts.length > 1 && visibleAccounts[0].name) || null
          : state.activeAccountName;

      return {
        ...state,
        activeAccountName: newActiveAccount,
        accounts: state.accounts.map(account => {
          if (account.name === accountName) {
            return {
              ...account,
              hidden: !account.hidden
            };
          }

          return account;
        })
      };
    },
    addWatchingAccount: (state, action: PayloadAction<Account>): State => {
      const account = action.payload;

      return {
        ...state,
        accounts: [...state.accounts, account],
        activeAccountName: account.name
      };
    }
  },
  // The payload maps are bounded by the request lifecycle, not by a timer: a
  // request that has been answered — signed, cancelled, superseded, or failed
  // before its window opened — will never be read again, and every one of those
  // paths funnels through `windowRequestResponded`.
  //
  // Keyed off the ACTION, not off `windowManagement`'s resulting state: that
  // reducer no-ops the transition unless the request is currently 'open', which
  // is exactly the orphan case (an MV3 restart between registration and the
  // response) where a stale payload most needs dropping.
  extraReducers: builder => {
    builder.addCase(
      windowRequestResponded,
      (state, { payload: { requestId } }): State => {
        if (
          getPayload(state.jsonById, requestId) == null &&
          getPayload(state.eip712ById, requestId) == null
        ) {
          // Same reasoning as the `displaced.length > 0` gate in
          // cancel-requests.ts: the store subscriber compares nothing, so a new
          // state object costs a popupState broadcast to every replica plus a
          // full storage.local rewrite.
          return state;
        }

        const jsonById = { ...state.jsonById };
        const eip712ById = { ...state.eip712ById };

        delete jsonById[requestId];
        delete eip712ById[requestId];

        return { ...state, jsonById, eip712ById };
      }
    );
  }
});

export const {
  accountAdded,
  accountDisconnected,
  accountImported,
  accountRemoved,
  accountRenamed,
  accountsAdded,
  accountsImported,
  activeAccountChanged,
  activeAccountSupportsChanged,
  addWatchingAccount,
  anotherAccountConnected,
  deployPayloadReceived,
  deploysReseted,
  eip712PayloadReceived,
  hideAccountFromListChanged,
  secretPhraseCreated,
  siteConnected,
  siteDisconnected,
  vaultLoaded,
  vaultReseted
} = slice.actions;
export const reducer = slice.reducer;
