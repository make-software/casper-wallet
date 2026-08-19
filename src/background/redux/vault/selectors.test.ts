import { RootState } from '@background/redux/store-types';

import { Account, HardwareWalletType } from '@libs/types/account';

import { selectVaultAccountsAvailableForExport } from './selectors';

// Broadcast shape: the replica is what this selector runs against, and there
// every `secretKey` is `''` — only `watching` still tells the accounts apart.
const accounts: Account[] = [
  {
    name: 'alice',
    publicKey: '01alice',
    secretKey: '',
    hidden: false,
    watching: false
  },
  {
    name: 'ledger',
    publicKey: '01ledger',
    secretKey: '',
    hidden: false,
    hardware: HardwareWalletType.Ledger,
    watching: false
  },
  {
    name: 'watch',
    publicKey: '01watch',
    secretKey: '',
    hidden: false,
    imported: true,
    watching: true
  }
];

const state = { vault: { accounts } } as unknown as RootState;

it('selectVaultAccountsAvailableForExport excludes hardware and watch-only accounts', () => {
  expect(selectVaultAccountsAvailableForExport(state)).toEqual([accounts[0]]);
});
