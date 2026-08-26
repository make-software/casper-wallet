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
 * `extraReducers` below — but a deletion can be MISSED, and a clean auto-lock
 * with an approval window open is enough on its own. `lockVaultSaga` runs
 * `updateVaultCipher()` BEFORE `vaultReseted()`/`deploysReseted()`, so the
 * unanswered payload is persisted into the cipher; the `windowRequestResponded`
 * that arrives afterwards finds an already-emptied in-memory map and deletes
 * nothing; the debounced re-encrypt early-returns because the vault is locked;
 * and `vaultLoaded` restores the entry on the next unlock. No service-worker
 * death is involved — it reproduces on Firefox and Safari too, where the
 * background page is persistent. Nothing else in this reducer deletes a key, so
 * a leaked payload sits in `storage.local` — the payload maps ride unfiltered
 * in every broadcast — until `reconcileStalePayloadsSaga` reclaims its slot,
 * or `mergePayloadMaps` drops it as the oldest entry over the ceiling.
 *
 * Ten is far above real concurrency (one approval window means 1-2 in-flight
 * requests) and far below anything that costs memory. See `storePayload` for
 * which write loses when the ceiling is reached, and why it is the incoming one.
 */
export const MAX_STORED_PAYLOADS = 10;

/**
 * Slots `mergePayloadMaps` holds back for the cipher side, whatever the
 * in-memory map is holding.
 *
 * Without it the cipher's share is whatever the in-memory map leaves over, and
 * that reaches zero on demand: `handleSdkMethod` has no lock gate on either
 * sign branch, so a page that fires `MAX_STORED_PAYLOADS` requests at a locked
 * wallet fills the map by itself and the whole cipher side is discarded on the
 * next unlock — including the request the user was already mid-approval on
 * when the lock hit, which is the one entry `storePayload` names as the one
 * that must never be lost.
 *
 * Two, because that is the concurrency `MAX_STORED_PAYLOADS` documents for a
 * single approval window: the deploy itself, plus the Ledger permission window
 * that can accompany it.
 */
const CIPHER_RESERVED_SLOTS = 2;

type PayloadMap = State['jsonById'];
type PayloadSeqMap = State['payloadSeqById'];

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
// At capacity the INCOMING write is refused; nothing already stored is evicted
// HERE. That is a property of this function, not of the map: `mergePayloadMaps`
// does evict stored entries, from both sides, and it is the only path that
// does. See the note there — the trade runs the opposite way across a lock,
// because "oldest" ranges over a different population once entries have
// outlived their request lifecycle.
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
// cipher. Two routes, not one — the request is never answered at all, which a
// clean auto-lock with an approval window open causes on its own (`lockVaultSaga`
// runs `updateVaultCipher()` BEFORE `vaultReseted()`/`deploysReseted()`, so the
// entry is persisted; the later `windowRequestResponded` finds an already-emptied
// in-memory map and deletes nothing; the debounced re-encrypt early-returns while
// the vault is locked — no worker death anywhere, and it reproduces on Firefox
// and Safari too, where the background page is persistent), or it IS answered and
// the worker dies inside the 500ms re-encrypt debounce that would have persisted
// the deletion. Either way `vaultLoaded` restores the entry on unlock, so enough
// of them fill the map and refuse every later payload.
//
// Reclaimed by `reconcileStalePayloadsSaga` (sagas/vault-sagas.ts), and by
// `mergePayloadMaps` when the merge on unlock is over the ceiling.
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

// The ordinal is stamped once per request. A rewrite of an id already stored is
// the same request refreshed, and it is the request's age the merge ranks on —
// re-stamping it would make a page able to promote its own entry by re-sending.
// A refused write (`__proto__`, or the ceiling) gets none, so the sequence only
// ever names ids a map actually holds and cannot leak a slot of its own.
function stampPayloadSeq(
  seqById: PayloadSeqMap,
  requestId: string,
  stored: boolean
): PayloadSeqMap {
  if (!stored || payloadSeqOf(seqById, requestId) != null) {
    return seqById;
  }

  // Read without a type check, unlike `payloadSeqOf`: this map is never the
  // cipher's. `vaultLoaded` renumbers whatever it decrypts, so everything that
  // reaches here is an ordinal this reducer wrote. Guarding it anyway would add
  // a branch nothing can enter.
  const stamped = Object.values(seqById);

  return {
    ...seqById,
    [requestId]: stamped.length === 0 ? 0 : Math.max(...stamped) + 1
  };
}

// Own properties only, for the reason `getPayload` exists: `requestId` is
// dapp-chosen, so a bare index answers `toString` with a function. The type
// check is not decoration either — this map arrives from the cipher as an
// unchecked cast.
function payloadSeqOf(
  seqById: PayloadSeqMap | undefined,
  requestId: string
): number | undefined {
  const seq =
    seqById != null && Object.prototype.hasOwnProperty.call(seqById, requestId)
      ? seqById[requestId]
      : undefined;

  return typeof seq === 'number' ? seq : undefined;
}

// An array index in the spec's sense: the keys an object enumerates FIRST, in
// ascending numeric order, ahead of every string key. `requestId` is
// dapp-chosen and only `__proto__` is refused, so `"42"` is an id the wallet
// accepts and stores.
function isHoistedKey(requestId: string): boolean {
  const index = Number(requestId);

  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < 2 ** 32 - 1 &&
    String(index) === requestId
  );
}

// Oldest first, by stored ordinal rather than by enumeration order — see the
// note on `payloadSeqById` for why the two are not the same thing.
//
// An id carrying no ordinal comes from a cipher written before the field
// existed, so it predates everything stamped and sorts first. Among themselves
// those keep their enumeration order, which is exactly the ranking this
// replaced — with one exception, because that order lies about one class of
// id. A hoisted key sits at the front of the map whenever it was written, so
// its position carries no age at all, while an ordinary key's does. Its true
// position is unrecoverable, so it is ranked NEWEST rather than oldest: the two
// mistakes do not cost the same. Keeping a leak spends a slot
// `reconcileStalePayloadsSaga` reclaims on this same unlock; evicting a live
// request loses the payload the user is about to approve, which is the
// WALLET-1418 symptom itself.
function orderOldestFirst(
  requestIds: string[],
  seqById: PayloadSeqMap | undefined
): string[] {
  const ranked: [string, number][] = [];
  const unranked: string[] = [];
  const unrankedHoisted: string[] = [];

  for (const requestId of requestIds) {
    const seq = payloadSeqOf(seqById, requestId);

    if (seq == null) {
      (isHoistedKey(requestId) ? unrankedHoisted : unranked).push(requestId);
    } else {
      ranked.push([requestId, seq]);
    }
  }

  ranked.sort(([, a], [, b]) => a - b);

  // Still ahead of everything stamped: an unstamped entry predates the field,
  // and the hoisting question only orders the unstamped set against itself.
  return [
    ...unranked,
    ...unrankedHoisted,
    ...ranked.map(([requestId]) => requestId)
  ];
}

// `storePayload`'s key guard on the merge path — `vaultLoaded` is forwarded
// with no `isTrustedUiSender` gate. Widened past `VaultState` because a cipher
// written before a map existed decrypts without it, and throwing here would
// leave the vault permanently locked.
function sanitizePayloadMap(payloads: PayloadMap | undefined): PayloadMap {
  return Object.fromEntries(
    Object.entries(payloads ?? {}).filter(([requestId]) =>
      isStorableRequestId(requestId)
    )
  );
}

// The one writer to these maps `storePayload` does not cover: the union of two
// capped maps is twice the cap, so it bounds itself instead of waiting for
// `reconcileStalePayloadsSaga`, which returns without reclaiming on an empty
// entry read, on a failed `windows.getAll` and in its catch, with no retry.
//
// In-memory entries win and all survive: each arrived in THIS worker session
// (`signRequest` has no lock gate, so one lands while locked too), so none can
// be a payload stranded before the last restart. The cipher fills the rest
// NEWEST first — the reverse of `storePayload`, because age means the opposite
// across a lock: not the request waited on longest, but the entry that survived
// the most unlocks unanswered. A live pre-lock request is the newest of them.
//
// "Newest" is read off `payloadSeqById`, never off the map's own key order: an
// object hoists integer-like keys ahead of every string key, and `requestId` is
// dapp-chosen, so ranking on enumeration order evicted a live request keyed
// `"42"` ahead of ten leaked UUID-keyed ones — the exact inversion of the rule
// this comment states.
function mergePayloadMaps(
  cipher: PayloadMap | undefined,
  cipherSeq: PayloadSeqMap | undefined,
  inMemory: PayloadMap,
  inMemorySeq: PayloadSeqMap | undefined
): PayloadMap {
  const carried = sanitizePayloadMap(cipher);

  // Never taken out of the in-memory side: an id held by both spends one slot,
  // so `carriedIds` is already what the cipher is asking to add.
  const carriedIds = orderOldestFirst(
    Object.keys(carried).filter(
      requestId => getPayload(inMemory, requestId) == null
    ),
    cipherSeq
  );
  const liveIds = orderOldestFirst(Object.keys(inMemory), inMemorySeq);

  // The room left over after the in-memory side — but never less than the
  // reserve, so the cipher cannot be displaced wholesale.
  const cipherSlots = Math.min(
    carriedIds.length,
    Math.max(MAX_STORED_PAYLOADS - liveIds.length, CIPHER_RESERVED_SLOTS)
  );
  const keptCarried = carriedIds.slice(carriedIds.length - cipherSlots);
  const keptLive = liveIds.slice(
    Math.max(liveIds.length - (MAX_STORED_PAYLOADS - cipherSlots), 0)
  );

  // Both sides log, the way the sibling reclaim does
  // (`reconcileStalePayloadsSaga`): ids and counts only, never payloads.
  // Separate lines because the two losses are not the same event. A dropped
  // locked-session write is the eviction a page can reach on demand; a dropped
  // carried entry is usually a leak this merge is here to reclaim, but it is
  // NOT always one — the reserve is a count, not a liveness test, so a live
  // pre-lock request outside the newest `CIPHER_RESERVED_SLOTS` goes the same
  // way. Without a line for each, a vanished pending transaction looks the
  // same as every other cause, and the two are diagnosed differently.
  if (keptLive.length < liveIds.length) {
    console.warn('mergePayloadMaps: evicted locked-session payloads', {
      evicted: liveIds.slice(0, liveIds.length - keptLive.length),
      keptCount: keptCarried.length + keptLive.length
    });
  }

  if (keptCarried.length < carriedIds.length) {
    console.warn('mergePayloadMaps: evicted carried payloads', {
      evicted: carriedIds.slice(0, carriedIds.length - keptCarried.length),
      keptCount: keptCarried.length + keptLive.length
    });
  }

  return Object.fromEntries([
    ...keptCarried.map((requestId): [string, string] => [
      requestId,
      carried[requestId]
    ]),
    ...keptLive.map((requestId): [string, string] => [
      requestId,
      inMemory[requestId]
    ])
  ]);
}

// The merged map holds ordinals minted by two different counters — the
// cipher's, from before the lock, and this session's, which restarted at 0 when
// `vaultReseted` cleared the maps. Left side by side they would rank a pre-lock
// entry above everything written since, and the error would compound at every
// later lock. Renumbered into one sequence instead: carried entries keep their
// relative age and all sit below the in-memory ones, which are newer by
// construction — each arrived in THIS worker session.
//
// Built from the merged maps, so an evicted payload takes its ordinal with it
// and this map cannot outgrow the slots it describes.
function renumberPayloadSeq(
  merged: Pick<State, 'jsonById' | 'eip712ById'>,
  cipherSeq: PayloadSeqMap | undefined,
  inMemory: Pick<State, 'jsonById' | 'eip712ById' | 'payloadSeqById'>
): PayloadSeqMap {
  const fromCipher: string[] = [];
  const fromMemory: string[] = [];

  for (const requestId of new Set([
    ...Object.keys(merged.jsonById),
    ...Object.keys(merged.eip712ById)
  ])) {
    if (
      getPayload(inMemory.jsonById, requestId) == null &&
      getPayload(inMemory.eip712ById, requestId) == null
    ) {
      fromCipher.push(requestId);
    } else {
      fromMemory.push(requestId);
    }
  }

  return Object.fromEntries(
    [
      ...orderOldestFirst(fromCipher, cipherSeq),
      ...orderOldestFirst(fromMemory, inMemory.payloadSeqById)
    ].map((requestId, index): [string, number] => [requestId, index])
  );
}

const initialState: State = {
  secretPhrase: null,
  accounts: [],
  accountNamesByOriginDict: {},
  siteNameByOriginDict: {},
  activeAccountName: null,
  jsonById: {},
  eip712ById: {},
  payloadSeqById: {}
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
          eip712ById,
          payloadSeqById
        }
      }: PayloadAction<VaultState>
    ) => {
      const merged = {
        jsonById: mergePayloadMaps(
          jsonById,
          payloadSeqById,
          state.jsonById,
          state.payloadSeqById
        ),
        eip712ById: mergePayloadMaps(
          eip712ById,
          payloadSeqById,
          state.eip712ById,
          state.payloadSeqById
        )
      };

      return {
        accountNamesByOriginDict,
        siteNameByOriginDict,
        accounts,
        activeAccountName,
        secretPhrase,
        ...merged,
        payloadSeqById: renumberPayloadSeq(merged, payloadSeqById, state)
      };
    },
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
    ): State => {
      const jsonById = storePayload(state.jsonById, payload.id, payload.json);

      return {
        ...state,
        jsonById,
        // Identity is how a refusal is told from a write: `storePayload`
        // returns the map it was given when it declines one.
        payloadSeqById: stampPayloadSeq(
          state.payloadSeqById,
          payload.id,
          jsonById !== state.jsonById
        )
      };
    },
    eip712PayloadReceived: (
      state,
      { payload }: PayloadAction<{ id: string; json: string }>
    ): State => {
      const eip712ById = storePayload(
        state.eip712ById,
        payload.id,
        payload.json
      );

      return {
        ...state,
        eip712ById,
        payloadSeqById: stampPayloadSeq(
          state.payloadSeqById,
          payload.id,
          eip712ById !== state.eip712ById
        )
      };
    },
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
  // reducer no-ops the transition unless the request is currently 'open',
  // which is exactly one of the residual descriptor-less paths (a lost mirror
  // write, a sanitizer-dropped row, etc., between registration and the
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
        // Dropped with the payload it dates. An ordinal outliving its entry
        // would be a leaked slot of the same kind this reducer exists to
        // reclaim, only in a map nothing enumerates.
        const payloadSeqById = { ...state.payloadSeqById };

        delete jsonById[requestId];
        delete eip712ById[requestId];
        delete payloadSeqById[requestId];

        return { ...state, jsonById, eip712ById, payloadSeqById };
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
