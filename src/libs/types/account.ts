export interface KeyPair {
  secretKey: string;
  publicKey: string;
}
export interface Account extends KeyPair {
  name: string;
  imported?: boolean;
  hidden: boolean;
}

export interface AccountWithBalance extends Account {
  balance: {
    liquidMotes: string | null;
  };
}

export interface AccountListRows extends AccountWithBalance {
  id: string;
}
