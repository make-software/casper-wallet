import { useEffect, useRef, useState } from 'react';

import {
  ILedgerEvent,
  IsBluetoothLedgerTransportAvailable,
  LedgerError,
  LedgerEventStatus,
  LedgerTransport,
  SelectedTransport,
  bluetoothTransportCreator,
  getPreferredTransport,
  isLedgerError,
  isTransportAvailable,
  ledger,
  usbTransportCreator
} from '@libs/services/ledger';

interface IUseLedgerParams {
  ledgerAction: () => Promise<void>;
  beforeLedgerActionCb: () => void;
  initialEventToRender?: ILedgerEvent;
  shouldLoadAccountList?: boolean;
  withWaitingEventOnDisconnect?: boolean;
}

export const useLedger = ({
  ledgerAction,
  beforeLedgerActionCb,
  initialEventToRender = {
    status: LedgerEventStatus.WaitingResponseFromDevice
  },
  withWaitingEventOnDisconnect = true,
  shouldLoadAccountList = false
}: IUseLedgerParams) => {
  const [isLedgerConnected, setIsLedgerConnected] = useState(
    ledger.isConnected
  );
  const [ledgerEventStatusToRender, setLedgerEventStatusToRender] =
    useState<ILedgerEvent>(initialEventToRender);
  const shouldTrySignAfterConnectRef = useRef<boolean>(false);
  const selectedTransportRef = useRef<SelectedTransport>(undefined);
  const isFirstEventRef = useRef<boolean>(true);

  const makeSubmitLedgerAction = (transport?: LedgerTransport) => async () => {
    if (!transport && !selectedTransportRef.current) {
      selectedTransportRef.current = await getPreferredTransport();
    }

    if (transport) {
      selectedTransportRef.current = transport;
    }

    setLedgerEventStatusToRender({
      status: LedgerEventStatus.WaitingResponseFromDevice
    });
    beforeLedgerActionCb();

    if (isLedgerConnected) {
      ledgerAction();

      if (shouldLoadAccountList) {
        setLedgerEventStatusToRender({
          status: LedgerEventStatus.LoadingAccountsList
        });
      }
    } else {
      shouldTrySignAfterConnectRef.current = true;

      try {
        if (selectedTransportRef.current === 'USB') {
          await ledger.connect(usbTransportCreator, isTransportAvailable);
        } else if (selectedTransportRef.current === 'Bluetooth') {
          await ledger.connect(
            bluetoothTransportCreator,
            IsBluetoothLedgerTransportAvailable,
            true
          );
        } else {
          setLedgerEventStatusToRender({
            status: LedgerEventStatus.Disconnected
          });
        }
      } catch (e) {
        console.log('-------- e', e);
        if (e instanceof LedgerError) {
          const event = JSON.parse(e.message);

          if (event.status === LedgerEventStatus.TransportOpenUserCancelled) {
            selectedTransportRef.current = undefined;
          }
        }

        setIsLedgerConnected(false);
      }
    }
  };

  useEffect(() => {
    const sub = ledger.subscribeToLedgerEventStatuss(event => {
      if (event.status === LedgerEventStatus.Connected) {
        setIsLedgerConnected(true);
      } else if (event.status === LedgerEventStatus.Disconnected) {
        setIsLedgerConnected(false);

        if (withWaitingEventOnDisconnect) {
          setLedgerEventStatusToRender({
            status: LedgerEventStatus.WaitingResponseFromDevice
          });
        }
      } else if (
        event.status === LedgerEventStatus.SignatureRequestedToUser ||
        event.status === LedgerEventStatus.MsgSignatureRequestedToUser ||
        event.status === LedgerEventStatus.AccountListUpdated ||
        event.status === LedgerEventStatus.LoadingAccountsList ||
        event.status === LedgerEventStatus.WaitingResponseFromDevice ||
        isLedgerError(event)
      ) {
        setLedgerEventStatusToRender(event);
      }

      if (isFirstEventRef.current && isLedgerError(event)) {
        setLedgerEventStatusToRender({
          status: LedgerEventStatus.Disconnected
        });
        setIsLedgerConnected(false);
      }

      isFirstEventRef.current = false;
      console.log('-------- event', JSON.stringify(event, null, ' '));
    });

    return () => sub.unsubscribe();
  }, [withWaitingEventOnDisconnect]);

  useEffect(() => {
    if (isLedgerConnected && shouldTrySignAfterConnectRef.current) {
      makeSubmitLedgerAction(selectedTransportRef.current)();
      shouldTrySignAfterConnectRef.current = false;
    }
  }, [isLedgerConnected, makeSubmitLedgerAction]);

  return {
    ledgerEventStatusToRender,
    isLedgerConnected,
    makeSubmitLedgerAction
  };
};
