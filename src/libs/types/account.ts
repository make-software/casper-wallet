export interface KeyPair {
  secretKey: string; // can be empty string
  publicKey: string;
}
export interface Account extends KeyPair {
  name: string;
  imported?: boolean;
  hardware?: HardwareWalletType;
}

export enum HardwareWalletType {
  Ledger = 'Ledger'
}

export interface AccountListRows extends Account {
  id: string;
}
