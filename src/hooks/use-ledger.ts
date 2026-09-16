import { LedgerError, createLedgerSubmitResume } from 'casper-wallet-core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { windows } from 'webextension-polyfill';

import { RouterPath } from '@popup/router';

import { closeCurrentWindow } from '@background/close-current-window';
import { openNewSeparateWindow } from '@background/create-open-window';
import {
  closeLedgerFlowWindows,
  ledgerNewWindowIdChanged
} from '@background/redux/ledger/actions';
import {
  selectLedgerNewWindowId,
  selectLedgerOpenerRequestId,
  selectLedgerOpenerWindowId
} from '@background/redux/ledger/selectors';
import { dispatchToMainStore } from '@background/redux/utils';

import { connectLedgerOnce } from '@hooks/ledger-connect-once';
import { runWithDeviceConfirmationReported } from '@hooks/ledger-device-confirmation';
import { decideOpenerHandoff } from '@hooks/ledger-opener-handoff';
import {
  isLedgerPermissionWindowDocument,
  needsLedgerPermissionWindow
} from '@hooks/ledger-permission-window-trigger';
import { createLedgerWindowCloseTracker } from '@hooks/ledger-window-close-listener';
import { resolveOwnPermissionWindowId } from '@hooks/ledger-window-ownership';
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
 * Search params carried into the permission window's URL. Spelled out rather than
 * `Record<string, string>` so a renamed key is a compile error, not a silent `undefined`.
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
  /**
   * Must have parked whatever the permission window will sign by the time it
   * resolves: a popup opener closes itself once that window exists.
   */
  beforeLedgerActionCb: () => Promise<void>;
  initialEventToRender?: ILedgerEvent;
  shouldLoadAccountList?: boolean;
  withWaitingEventOnDisconnect?: boolean;
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
  const openerWindowId = useSelector(selectLedgerOpenerWindowId);
  const openerRequestId = useSelector(selectLedgerOpenerRequestId);
  const selectedTransportRef = useRef<SelectedTransport>(undefined);
  const isFirstEventRef = useRef<boolean>(true);
  const triggeredRef = useRef(false);
  const submitResume = useMemo(() => createLedgerSubmitResume(), []);

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
      // Fire-and-forget: the status below must render while the device is read.
      const settleSubmit = submitResume.issued();
      void runWithDeviceConfirmationReported(
        askPermissionUrlData.params?.requestId,
        ledgerAction
      ).finally(settleSubmit);

      if (shouldLoadAccountList) {
        setLedgerEventStatusToRender({
          status: LedgerEventStatus.LoadingAccountsList
        });
      }
    } else {
      submitResume.awaitingConnect();

      const transportToOpen = selectedTransportRef.current;

      // Checked before connecting: core reports a failed chooser open as a device error.
      if (
        transportToOpen &&
        needsLedgerPermissionWindow({
          transport: transportToOpen,
          hasPermittedUsbDevice: (await getPreferredTransport()) === 'USB',
          isPermissionWindow: isLedgerPermissionWindowDocument(
            document.location.search
          )
        })
      ) {
        setLedgerEventStatusToRender({
          status: LedgerEventStatus.LedgerPermissionRequired
        });

        return;
      }

      try {
        if (selectedTransportRef.current === 'USB') {
          await connectLedgerOnce(() =>
            ledger.connect(usbTransportCreator, isTransportAvailable)
          );
        } else if (selectedTransportRef.current === 'Bluetooth') {
          await connectLedgerOnce(() =>
            ledger.connect(
              bluetoothTransportCreator,
              IsBluetoothLedgerTransportAvailable,
              true
            )
          );
        } else {
          setLedgerEventStatusToRender({
            status: LedgerEventStatus.Disconnected
          });
        }
      } catch (error) {
        // The subscription below already renders this. Logged because every transport-open
        // failure arrives as the same status; the message is left out, it carries the key.
        console.error('useLedger: connecting to the device failed', {
          transport: selectedTransportRef.current,
          errorName: (error as Error)?.name,
          ledgerStatus:
            error instanceof LedgerError ? error.ledgerEvent.status : undefined
        });
      }
    }
  };

  // Core clears its own connection flag on states it does not report as `Disconnected` — a
  // locked device is one — so the flag is subscribed, never derived from the event stream.
  useEffect(() => {
    const sub = ledger.connected$.subscribe(connected => {
      setIsLedgerConnected(connected);

      // A device that leaves mid-action takes the submit with it; the connect branch
      // only covers one that was already away.
      if (!connected) {
        submitResume.deviceLeft();
      }
    });

    return () => sub.unsubscribe();
  }, [submitResume]);

  useEffect(() => {
    const sub = ledger.subscribeToLedgerEventStatus(event => {
      // The device has answered for the submit, so recovery must not re-issue it.
      submitResume.outcomeReported(event.status);

      if (event.status === LedgerEventStatus.Disconnected) {
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
      }

      isFirstEventRef.current = false;
    });

    return () => sub.unsubscribe();
  }, [withWaitingEventOnDisconnect, submitResume]);

  useEffect(() => {
    if (isLedgerConnected && submitResume.shouldResume()) {
      makeSubmitLedgerAction(selectedTransportRef.current)();
      submitResume.resumed();
    }
  }, [isLedgerConnected, makeSubmitLedgerAction, submitResume]);

  /**
   * Drops a submit still waiting for the device: `DeviceLocked` keeps polling behind
   * the error screen, so a dismissed flow would otherwise sign once it is unlocked.
   */
  const cancelPendingLedgerAction = useCallback(() => {
    submitResume.dropped();
  }, [submitResume]);

  const closeTracker = useMemo(() => createLedgerWindowCloseTracker(), []);

  // `openerWindowId` rides in the slice so a remounted popup still owns the window
  // its predecessor opened; the other two witnesses are per-document.
  const openedPermissionWindowIdRef = useRef<number | null>(null);
  const [hostWindowId, setHostWindowId] = useState<number | null>(null);
  // Mirror for the open effect below, which must not re-run when the state lands.
  const hostWindowIdRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    windows
      .getCurrent()
      .then(current => {
        if (!cancelled && current.id != null) {
          hostWindowIdRef.current = current.id;
          setHostWindowId(current.id);
        }
      })
      .catch(error =>
        console.error('useLedger: reading the host window failed', {
          errorName: (error as Error)?.name
        })
      );

    return () => {
      cancelled = true;
    };
  }, []);

  // Null until the slot names a window this instance owns, so a takeover reads as
  // "no permission window of mine" rather than as someone else's.
  const ownPermissionWindowId = resolveOwnPermissionWindowId({
    slotWindowId: windowId,
    openerWindowId,
    openerRequestId,
    openedWindowId: openedPermissionWindowIdRef.current,
    hostWindowId,
    ownRequestId: askPermissionUrlData.params?.requestId ?? null
  });

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
          // No `windows.onRemoved` ever fires for a window without an id.
          console.error(
            'useLedger: the permission window resolved without an id'
          );
          setLedgerEventStatusToRender({
            status: LedgerEventStatus.PermissionWindowFailed
          });
          return;
        }

        openedPermissionWindowIdRef.current = w.id;

        // Awaited so the close below cannot drop it: this id is what clears the slice.
        await dispatchToMainStore(
          ledgerNewWindowIdChanged({
            windowId: w.id,
            openerWindowId: hostWindowIdRef.current,
            openerRequestId: askPermissionUrlData.params?.requestId ?? null
          })
        );

        const permissionWindowAttached = await registerLedgerPermissionWindow({
          domain: askPermissionUrlData.domain,
          requestId: askPermissionUrlData.params?.requestId,
          windowId: w.id
        });

        triggeredRef.current = true;

        const handoff = decideOpenerHandoff({
          permissionWindowDomain: askPermissionUrlData.domain,
          isPermissionWindow: isLedgerPermissionWindowDocument(
            document.location.search
          ),
          permissionWindowAttached
        });

        if (handoff === 'close-popup') {
          window.close();
          return;
        }

        if (handoff === 'close-approval-window') {
          try {
            await closeCurrentWindow();
            return;
          } catch (error) {
            // The opener is still standing, so it still needs the recovery below.
            console.error(
              'useLedger: dismissing the opener window failed',
              error
            );
          }
        }

        // Reached only by an opener that stays; nothing else here lowers the screen.
        closeTracker.arm(w.id, () => {
          setLedgerEventStatusToRender({
            status: LedgerEventStatus.Disconnected
          });
        });
      }
    })().catch(error => {
      // Log the error's NAME only: `url` embeds the plaintext `signMessage`
      // message as a query param, and a rejection's text can echo the URL.
      console.error('useLedger: opening the permission window failed', {
        errorName: (error as Error)?.name
      });
      // Nothing in this effect's dependencies changes on failure, so the screen would
      // otherwise stay on LedgerPermissionRequired with no retry path.
      setLedgerEventStatusToRender({
        status: LedgerEventStatus.PermissionWindowFailed
      });
    });
  }, [
    askPermissionUrlData.domain,
    askPermissionUrlData.params?.requestId,
    closeTracker,
    ledgerEventStatusToRender.status,
    url,
    windowId
  ]);

  // Unmount only, not the cleanup of the effect above: `windowId` is one of its
  // dependencies, so that cleanup would remove the listener the arm path just registered.
  useEffect(() => () => closeTracker.detach(), [closeTracker]);

  // The slice can be cleared while this window stays open, letting another useLedger
  // instance take it over; a listener still watching ours would wipe that flow's deploy.
  useEffect(() => {
    if (windowId != null) return;

    closeTracker.detach();
  }, [closeTracker, windowId]);

  // The background decides which windows to close — the owning ids live in
  // `windowManagement.requests`, which `selectPopupState` strips from every replica.
  const closeNewLedgerWindowsAndClearState = useCallback(() => {
    if (ownPermissionWindowId == null) {
      console.warn('useLedger: no permission window of this flow to close');
      return;
    }

    dispatchToMainStore(
      closeLedgerFlowWindows({
        requestId: askPermissionUrlData.params?.requestId,
        permissionWindowId: ownPermissionWindowId
      })
    );
  }, [askPermissionUrlData.params?.requestId, ownPermissionWindowId]);

  useEffect(() => {
    if (windowId && askPermissionUrlData?.domain !== 'popup.html') {
      const sub = ledger.subscribeToLedgerEventStatus(event => {
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
    cancelPendingLedgerAction,
    closeNewLedgerWindowsAndClearState,
    // Deliberately not the raw slot: a page must not see a foreign flow's window.
    ownPermissionWindowId
  };
};
