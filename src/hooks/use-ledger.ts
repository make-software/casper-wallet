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

import { registerLedgerPermissionWindow } from '@hooks/register-ledger-permission-window';

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

/**
 * Search params carried into the permission window's URL. Spelled out rather
 * than `Record<string, string>` so renaming `requestId` at a call site is a
 * compile error: the lookup below is what registers the window against its
 * request, and against a string record a renamed key silently yields
 * `undefined` and takes the whole approval back to the P0 this model fixes.
 */
interface LedgerPermissionParams {
  requestId?: string;
  signingPublicKeyHex?: string;
  message?: string;
  origin?: string;
  tabId?: string;
}

interface IUseLedgerParams {
  ledgerAction: () => Promise<void>;
  beforeLedgerActionCb: () => Promise<void>;
  initialEventToRender?: ILedgerEvent;
  shouldLoadAccountList?: boolean;
  withWaitingEventOnDisconnect?: boolean;
  /** We have to open new browser window to handle device permission */
  askPermissionUrlData?: {
    domain: string;
    params?: LedgerPermissionParams;
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

  // Built key by key (rather than spread into the constructor) because
  // `LedgerPermissionParams` has optional members: an absent one must be left
  // out, not stringified as "undefined". Insertion order matches the previous
  // spread, so the URL is unchanged for every existing flow.
  const searchParams = new URLSearchParams();
  Object.entries(askPermissionUrlData.params ?? {}).forEach(([key, value]) => {
    if (value != null) {
      searchParams.set(key, value);
    }
  });
  searchParams.set(
    'initialEventToRender',
    LedgerEventStatus.LedgerAskPermission
  );
  if (selectedTransportRef.current) {
    searchParams.set('ledgerTransport', selectedTransportRef.current);
  }
  const params = searchParams.toString();

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

        if (w.id == null) {
          // Nothing below can run, and no `windows.onRemoved` will ever fire
          // for a window without an id — so the request keeps claiming a
          // display it does not have.
          console.error(
            'useLedger: the permission window resolved without an id'
          );
          setLedgerEventStatusToRender({
            status: LedgerEventStatus.PermissionWindowFailed
          });
          return;
        }

        dispatchToMainStore(ledgerNewWindowIdChanged(w.id));

        registerLedgerPermissionWindow({
          domain: askPermissionUrlData.domain,
          requestId: askPermissionUrlData.params?.requestId,
          windowId: w.id
        });

        triggeredRef.current = true;

        const handleCloseWindow = () => {
          dispatchToMainStore(ledgerStateCleared());
          windows.onRemoved.removeListener(handleCloseWindow);
        };

        windows.onRemoved.addListener(handleCloseWindow);
      }
    })().catch(error => {
      // `openNewSeparateWindow` is an awaited call that can reject, and without
      // this the whole body — including the attach that keeps the request alive
      // — is skipped with nothing anywhere. Log the error's NAME only: `url`
      // embeds the plaintext `signMessage` message as a query param, and a
      // rejection's text can echo the URL it failed on.
      console.error('useLedger: opening the permission window failed', {
        errorName: (error as Error)?.name
      });
      // Without this the screen keeps rendering LedgerPermissionRequired: it
      // tells the user to grant permission in a window that was never opened
      // and never will be, with no retry path — nothing in this effect's
      // dependency array has changed, so it will not run again. The only exit
      // was the CTA that abandons the approval.
      setLedgerEventStatusToRender({
        status: LedgerEventStatus.PermissionWindowFailed
      });
    });
  }, [
    askPermissionUrlData.domain,
    askPermissionUrlData.params?.requestId,
    ledgerEventStatusToRender.status,
    url,
    windowId
  ]);

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
