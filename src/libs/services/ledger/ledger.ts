import CasperApp from '@zondax/ledger-casper';
import {
  type ICasperLedgerService,
  createCasperLedgerService
} from 'casper-wallet-core';

import type { DmkLedgerTransport } from './dmk-transport';

export const ledger: ICasperLedgerService = createCasperLedgerService({
  createLedgerApp: (transport: DmkLedgerTransport) => new CasperApp(transport)
});
