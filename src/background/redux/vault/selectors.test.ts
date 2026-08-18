import { RootState } from '@background/redux/store-types';

import { Account, HardwareWalletType } from '@libs/types/account';

import { selectVaultAccountsAvailableForExport } from './selectors';

const accounts: Account[] = [
  { name: 'alice', publicKey: '01alice', secretKey: 'sk-alice', hidden: false },
  {
    name: 'ledger',
    publicKey: '01ledger',
    secretKey: 'sk-ledger',
    hidden: false,
    hardware: HardwareWalletType.Ledger
  },
  {
    name: 'watch',
    publicKey: '01watch',
    secretKey: '',
    hidden: false,
    imported: true
  }
];

const state = { vault: { accounts } } as unknown as RootState;

it('selectVaultAccountsAvailableForExport excludes hardware accounts and accounts with no secret key', () => {
  expect(selectVaultAccountsAvailableForExport(state)).toEqual([accounts[0]]);
});
