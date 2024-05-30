import React, { useEffect, useState } from 'react';

import {
  ILedgerEvent,
  LedgerEventStatus,
  isLedgerError,
  isTransportAvailable
} from '@libs/services/ledger';
import {
  LedgerErrorView,
  NoConnectedLedger,
  ReviewWithLedger
} from '@libs/ui/components';

interface ILedgerEventViewProps {
  event: ILedgerEvent;
  isAccountSelection?: boolean;
}

export const LedgerEventView: React.FC<ILedgerEventViewProps> = ({
  event,
  isAccountSelection = false
}) => {
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    isTransportAvailable().then(setAvailable);
  }, []);

  if (!available) {
    return (
      <LedgerErrorView event={{ status: LedgerEventStatus.NotAvailable }} />
    );
  }

  if (
    event.status === LedgerEventStatus.SignatureRequestedToUser &&
    event.deployHash
  ) {
    return <ReviewWithLedger hash={event.deployHash} hashLabel={'Txn hash'} />;
  }

  if (
    event.status === LedgerEventStatus.MsgSignatureRequestedToUser &&
    event.msgHash
  ) {
    return <ReviewWithLedger hash={event.msgHash} hashLabel={'Msg hash'} />;
  }

  if (isLedgerError(event)) {
    return <LedgerErrorView event={event} />;
  }

  return (
    <NoConnectedLedger event={event} isAccountSelection={isAccountSelection} />
  );
};
