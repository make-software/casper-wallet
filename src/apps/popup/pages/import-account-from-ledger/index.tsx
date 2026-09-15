import React, { useEffect } from 'react';

import { RouterPath, useTypedNavigate } from '@popup/router';

import { useLedger } from '@hooks/use-ledger';

import { LedgerEventStatus } from '@libs/services/ledger';
import { LedgerConnectionView } from '@libs/ui/components';

import { ConnectedLedger } from './connected-ledger';

export const ImportAccountFromLedgerPage = () => {
  const searchParams = new URLSearchParams(document.location.search);
  const initialEventToRender =
    (searchParams.get('initialEventToRender') as LedgerEventStatus) ??
    LedgerEventStatus.Disconnected;

  const navigate = useTypedNavigate();

  const {
    ledgerEventStatusToRender,
    makeSubmitLedgerAction,
    closeNewLedgerWindowsAndClearState,
    permissionWindowClosed
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

  // The accounts this page exists to import are added by the permission
  // window, not here, so once that window is gone this page has nothing left
  // to show — and the window closing is the only signal of it. Home is where
  // the imported accounts are. WALLET-1249.
  useEffect(() => {
    if (permissionWindowClosed) {
      navigate(RouterPath.Home);
    }
  }, [navigate, permissionWindowClosed]);

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
