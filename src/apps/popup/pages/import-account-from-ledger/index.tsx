import React, { useEffect, useState } from 'react';

import { ConnectedLedger } from './connected-ledger';
import { NotConnectedLedger } from './not-connected-ledger';

export const ImportAccountFromLedgerPage = () => {
  const [isLedgerConnected, setIsLedgerConnected] = useState(false);

  useEffect(() => {
    const interval = setTimeout(() => {
      setIsLedgerConnected(true);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return isLedgerConnected ? <ConnectedLedger /> : <NotConnectedLedger />;
};
