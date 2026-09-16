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
 * Ceiling on `jsonById` / `eip712ById`: far above real concurrency, far below
 * anything that costs memory. A payload whose deletion never reaches the cipher
 * holds its slot until `reconcileStalePayloadsSaga` or `mergePayloadMaps`
 * reclaims it.
 */
export const MAX_STORED_PAYLOADS = 10;

// Slots `mergePayloadMaps` holds back for the cipher side, so a page filling
// the in-memory map while locked cannot displace a request mid-approval.
const CIPHER_RESERVED_SLOTS = 2;

type PayloadMap = State['jsonById'];
type PayloadSeqMap = State['payloadSeqById'];

// At capacity the INCOMING write is refused; nothing stored is evicted here, so
// a page burst cannot cost the request the user is already confirming.
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

// Stamped once per request: re-stamping a rewrite would let a page promote its
// own entry by re-sending, and a refused write gets no ordinal to leak.
function stampPayloadSeq(
  seqById: PayloadSeqMap,
  requestId: string,
  stored: boolean
): PayloadSeqMap {
  if (!stored || payloadSeqOf(seqById, requestId) != null) {
    return seqById;
  }

  // Never the cipher's map: `vaultLoaded` renumbers whatever it decrypts, so
  // every ordinal reaching here was written by this reducer.
  const stamped = Object.values(seqById);

  return {
    ...seqById,
    [requestId]: stamped.length === 0 ? 0 : Math.max(...stamped) + 1
  };
}

// Own properties only: `requestId` is dapp-chosen, so a bare index answers
// `toString` with a function, and this map arrives from the cipher unchecked.
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
// ascending numeric order, ahead of every string key. `"42"` is an accepted id.
function isHoistedKey(requestId: string): boolean {
  const index = Number(requestId);

  return (
    Number.isInteger(index) &&
    index >= 0 &&
    index < 2 ** 32 - 1 &&
    String(index) === requestId
  );
}

// Oldest first by stored ordinal, not by enumeration order. A hoisted key's
// position carries no age, so it ranks NEWEST: a leaked slot beats an eviction.
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

  // Still ahead of everything stamped: an unstamped entry predates the field.
  return [
    ...unranked,
    ...unrankedHoisted,
    ...ranked.map(([requestId]) => requestId)
  ];
}

// `storePayload`'s key guard on the merge path: `vaultLoaded` is forwarded with
// no `isTrustedUiSender` gate, and a cipher predating a map decrypts without it.
function sanitizePayloadMap(payloads: PayloadMap | undefined): PayloadMap {
  return Object.fromEntries(
    Object.entries(payloads ?? {}).filter(([requestId]) =>
      isStorableRequestId(requestId)
    )
  );
}

// The union of two capped maps is twice the cap. In-memory entries win; the
// cipher fills the rest NEWEST first by `payloadSeqById`, never by key order.
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

  // Ids and counts only, never payloads. Separate lines because a dropped
  // locked-session write and a dropped carried entry are diagnosed differently.
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

// The merged map holds ordinals minted by two counters, this session's having
// restarted at 0, so side by side they rank a pre-lock entry as the newest.
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
    // Merged, not replaced: a request can outlive the window that displaced it,
    // and a new single-entry dict here would strand it with nothing to sign.
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
  // Keyed off the ACTION, not `windowManagement`'s resulting state: that reducer
  // no-ops unless the request is 'open', where a stale payload most needs dropping.
  extraReducers: builder => {
    builder.addCase(
      windowRequestResponded,
      (state, { payload: { requestId } }): State => {
        if (
          getPayload(state.jsonById, requestId) == null &&
          getPayload(state.eip712ById, requestId) == null
        ) {
          // The store subscriber compares nothing, so a new state object costs
          // a popupState broadcast to every replica plus a storage.local rewrite.
          return state;
        }

        const jsonById = { ...state.jsonById };
        const eip712ById = { ...state.eip712ById };
        // Dropped with the payload it dates, so no ordinal outlives its entry.
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
