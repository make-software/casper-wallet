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
  // Write order for the two maps above, as an ordinal per `requestId`. Stored
  // because a plain object hoists integer-like keys and `requestId` is dapp-chosen.
  payloadSeqById: Record<string, number>;
};
