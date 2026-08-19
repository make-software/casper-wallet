import { CasperWalletSupports } from '@content/sdk-types';

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
  supports?: CasperWalletSupports[];
  /**
   * Set only on broadcast copies: true for a watch-only account specifically
   * (empty secretKey and no `hardware`) — a Ledger account also has an empty
   * secretKey but is not "watching".
   */
  watching?: boolean;
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
