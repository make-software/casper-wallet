export interface KeyPair {
  secretKey: string; // can be empty string
  publicKey: string;
}
export interface Account extends KeyPair {
  name: string;
  imported?: boolean;
  hardware?: HardwareWalletType;
  hidden: boolean;
  derivationIndex?: number;
}

export enum HardwareWalletType {
  Ledger = 'Ledger'
}

export interface AccountListRows extends Account {
  id: string;
}

export type AccountListRowWithAccountHash<T extends AccountListRows> = T & {
  accountHash: string;
};
