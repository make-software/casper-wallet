import React from 'react';

import { useLedger } from '@hooks/use-ledger';

import { LedgerEventStatus } from '@libs/services/ledger';

import { ConnectedLedger } from './connected-ledger';
import { NotConnectedLedger } from './not-connected-ledger';

export const ImportAccountFromLedgerPage = () => {
  const { ledgerEventStatusToRender, makeSubmitLedgerAction } = useLedger({
    ledgerAction: async () => {},
    shouldLoadAccountList: true,
    beforeLedgerActionCb: () => {},
    initialEventToRender: { status: LedgerEventStatus.Disconnected },
    withWaitingEventOnDisconnect: false
  });

  return ledgerEventStatusToRender.status ===
    LedgerEventStatus.AccountListUpdated ||
    ledgerEventStatusToRender.status ===
      LedgerEventStatus.LoadingAccountsList ? (
    <ConnectedLedger />
  ) : (
    <NotConnectedLedger
      event={ledgerEventStatusToRender}
      onConnect={makeSubmitLedgerAction}
    />
  );
};
