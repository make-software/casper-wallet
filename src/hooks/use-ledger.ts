import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { windows } from 'webextension-polyfill';

import { RouterPath } from '@popup/router';

import { openNewSeparateWindow } from '@background/create-open-window';
import {
  ledgerNewWindowIdChanged,
  ledgerStateCleared
} from '@background/redux/ledger/actions';
import { selectLedgerNewWindowId } from '@background/redux/ledger/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import {
  ILedgerEvent,
  IsBluetoothLedgerTransportAvailable,
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
  beforeLedgerActionCb: () => Promise<void>;
  initialEventToRender?: ILedgerEvent;
  shouldLoadAccountList?: boolean;
  withWaitingEventOnDisconnect?: boolean;
  /** We have to open new browser window to handle device permission */
  askPermissionUrlData?: {
    domain: string;
    params?: Record<string, string>;
    hash: string;
  };
}

export const useLedger = ({
  ledgerAction,
  beforeLedgerActionCb,
  initialEventToRender = {
    status: LedgerEventStatus.WaitingResponseFromDevice
  },
  withWaitingEventOnDisconnect = true,
  shouldLoadAccountList = false,
  askPermissionUrlData = {
    domain: 'popup.html',
    params: {},
    hash: RouterPath.SignWithLedgerInNewWindow
  }
}: IUseLedgerParams) => {
  const [isLedgerConnected, setIsLedgerConnected] = useState(
    ledger.isConnected
  );
  const [ledgerEventStatusToRender, setLedgerEventStatusToRender] =
    useState<ILedgerEvent>(initialEventToRender);
  const windowId = useSelector(selectLedgerNewWindowId);
  const shouldTrySignAfterConnectRef = useRef<boolean>(false);
  const selectedTransportRef = useRef<SelectedTransport>(undefined);
  const isFirstEventRef = useRef<boolean>(true);
  const triggeredRef = useRef(false);

  const params = new URLSearchParams({
    ...(askPermissionUrlData.params ?? {}),
    initialEventToRender: LedgerEventStatus.LedgerAskPermission,
    ...(selectedTransportRef.current
      ? { ledgerTransport: selectedTransportRef.current }
      : {})
  }).toString();

  const url = useMemo(
    () =>
      `${askPermissionUrlData.domain}?${params}#${askPermissionUrlData.hash}`,
    [askPermissionUrlData.domain, askPermissionUrlData.hash, params]
  );

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

    await beforeLedgerActionCb();

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
      console.log('-------- event', JSON.stringify(event.status, null, ' '));
    });

    return () => sub.unsubscribe();
  }, [withWaitingEventOnDisconnect]);

  useEffect(() => {
    if (isLedgerConnected && shouldTrySignAfterConnectRef.current) {
      makeSubmitLedgerAction(selectedTransportRef.current)();
      shouldTrySignAfterConnectRef.current = false;
    }
  }, [isLedgerConnected, makeSubmitLedgerAction]);

  /** We have to open new browser window to handle device permission */
  useEffect(() => {
    (async () => {
      if (
        ledgerEventStatusToRender.status ===
          LedgerEventStatus.LedgerPermissionRequired &&
        !windowId &&
        !triggeredRef.current
      ) {
        const w = await openNewSeparateWindow({ url });

        if (w.id) {
          dispatchToMainStore(ledgerNewWindowIdChanged(w.id));
          triggeredRef.current = true;

          const handleCloseWindow = () => {
            dispatchToMainStore(ledgerStateCleared());
            windows.onRemoved.removeListener(handleCloseWindow);
          };

          windows.onRemoved.addListener(handleCloseWindow);
        }
      }
    })();
  }, [ledgerEventStatusToRender.status, url, windowId]);

  const closeNewLedgerWindowsAndClearState = useCallback(async () => {
    if (windowId) {
      const all = await windows.getAll({ windowTypes: ['popup'] });
      all.forEach(w => w.id && windows.remove(w.id));
      dispatchToMainStore(ledgerStateCleared());
      await windows.remove(windowId);
    }
  }, [windowId]);

  useEffect(() => {
    if (windowId && askPermissionUrlData?.domain !== 'popup.html') {
      const sub = ledger.subscribeToLedgerEventStatuss(event => {
        if (
          event.status === LedgerEventStatus.SignatureCompleted ||
          event.status === LedgerEventStatus.MsgSignatureCompleted
        ) {
          closeNewLedgerWindowsAndClearState();
        }
      });

      return () => sub.unsubscribe();
    }
  }, [
    askPermissionUrlData?.domain,
    closeNewLedgerWindowsAndClearState,
    windowId
  ]);

  return {
    ledgerEventStatusToRender,
    isLedgerConnected,
    makeSubmitLedgerAction,
    closeNewLedgerWindowsAndClearState,
    windowId
  };
};
