export interface KeyPair {
  secretKey: string; // can be empty string
  publicKey: string;
}
export interface Account extends KeyPair {
  name: string;
  imported?: boolean;
  hardware?: HardwareWalletType;
  hidden: boolean;
}

export enum HardwareWalletType {
  Ledger = 'Ledger'
}

export interface AccountWithBalance extends Account {
  balance: {
    liquidMotes: string | null;
  };
}

export interface AccountListRows extends AccountWithBalance {
  id: string;
}
