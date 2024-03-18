export interface KeyPair {
  secretKey: string;
  publicKey: string;
}
export interface Account extends KeyPair {
  name: string;
  imported?: boolean;
  hidden: boolean;
}

export interface AccountListRows extends Account {
  id: string;
}
