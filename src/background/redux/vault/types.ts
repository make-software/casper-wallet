import { Account } from '@libs/types/account';

type AccountNamesByOriginDict = Record<string, string[] | undefined>;
type SiteNameByOriginDict = Record<string, string | undefined>;

export type VaultState = {
  secretPhrase: null | string[];
  accounts: Account[];
  accountNamesByOriginDict: AccountNamesByOriginDict;
  siteNameByOriginDict: SiteNameByOriginDict;
  activeAccountName: string | null;
  jsonById: Record<string, string>;
  eip712ById: Record<string, string>;
  // Write order for the two maps above, as an ordinal per `requestId`. It is
  // stored rather than read back off the maps because a plain object does not
  // enumerate in insertion order: integer-like keys are hoisted ahead of every
  // string key, in ascending numeric order, and `requestId` is dapp-chosen, so
  // `"42"` is an id the wallet accepts. `JSON.parse` rebuilds the cipher the
  // same way, so the hoisting survives the round trip too. One counter covers
  // both maps — a request belongs to exactly one of them, and
  // `windowRequestResponded` deletes from both by the same id.
  //
  // Declared required for the same reason the two maps above are, and widened
  // at the one boundary where it can be absent: a cipher written before this
  // field existed decrypts without it (`decryptVault` is a bare cast, there is
  // no migration). See `mergePayloadMaps`.
  payloadSeqById: Record<string, number>;
};
