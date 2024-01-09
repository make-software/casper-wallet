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
};
