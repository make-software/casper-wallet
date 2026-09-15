import Transport from '@ledgerhq/hw-transport';
import CasperApp from '@zondax/ledger-casper';
import {
  type ICasperLedgerService,
  createCasperLedgerService
} from 'casper-wallet-core';

export const ledger: ICasperLedgerService = createCasperLedgerService({
  createLedgerApp: (transport: Transport) => new CasperApp(transport)
});
