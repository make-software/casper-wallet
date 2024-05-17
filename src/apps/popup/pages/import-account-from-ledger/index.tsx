import React from 'react';

import { RouterPath } from '@popup/router';

import { useLedger } from '@hooks/use-ledger';

import { LedgerEventStatus } from '@libs/services/ledger';
import { LedgerConnectionView } from '@libs/ui/components';

import { ConnectedLedger } from './connected-ledger';

export const ImportAccountFromLedgerPage = () => {
  const searchParams = new URLSearchParams(document.location.search);
  const initialEventToRender =
    (searchParams.get('initialEventToRender') as LedgerEventStatus) ??
    LedgerEventStatus.Disconnected;

  const {
    ledgerEventStatusToRender,
    makeSubmitLedgerAction,
    closeNewLedgerWindowsAndClearState
  } = useLedger({
    ledgerAction: async () => {},
    shouldLoadAccountList: true,
    beforeLedgerActionCb: async () => {},
    initialEventToRender: { status: initialEventToRender },
    withWaitingEventOnDisconnect: false,
    askPermissionUrlData: {
      domain: 'popup.html',
      params: {},
      hash: RouterPath.ImportAccountFromLedger
    }
  });

  return ledgerEventStatusToRender.status ===
    LedgerEventStatus.AccountListUpdated ||
    ledgerEventStatusToRender.status ===
      LedgerEventStatus.LoadingAccountsList ? (
    <ConnectedLedger onClose={closeNewLedgerWindowsAndClearState} />
  ) : (
    <LedgerConnectionView
      isAccountSelection
      event={ledgerEventStatusToRender}
      onConnect={makeSubmitLedgerAction}
      closeNewLedgerWindowsAndClearState={closeNewLedgerWindowsAndClearState}
    />
  );
};
