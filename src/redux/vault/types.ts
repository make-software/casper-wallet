// TODO: Implement account type
export interface Account {
  name: string;
  balance: number | null;
}

export type VaultState = {
  password: string | null;
  isLocked: boolean;
  accounts: Account[];
};
