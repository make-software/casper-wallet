// TODO: Implement account type
export interface Account {
  accountName: string;
  balance: number | null;
}

export type VaultState = {
  password: string | null;
  isLocked: boolean;
  accounts: Account[];
};
