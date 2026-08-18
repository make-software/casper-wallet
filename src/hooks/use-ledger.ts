import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { windows } from 'webextension-polyfill';

import { RouterPath } from '@popup/router';

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
  const openerWindowId = useSelector(selectLedgerOpenerWindowId);
  const openerRequestId = useSelector(selectLedgerOpenerRequestId);
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

  // One per hook instance, stable across renders: the effect below arms it and
  // the two effects after it are the only things that take it back down.
  const closeTracker = useMemo(() => createLedgerWindowCloseTracker(), []);

  // The witnesses `resolveOwnPermissionWindowId` weighs: the window this
  // instance opened, and the window it renders in. Both are per-document; the
  // third (`openerWindowId` qualified by `openerRequestId`) rides in the slice
  // so a remounted popup still owns the window its predecessor opened.
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

  // Null until the slot names a window this instance owns, so a takeover between
  // the two flows reads as "no permission window of mine" rather than as someone
  // else's. Still derived from the slot, so a window this instance opened and
  // then lost stops counting once the background clears the stale id.
  const ownPermissionWindowId = resolveOwnPermissionWindowId({
    slotWindowId: windowId,
    openerWindowId,
    openerRequestId,
    openedWindowId: openedPermissionWindowIdRef.current,
    hostWindowId,
    ownRequestId: askPermissionUrlData.params?.requestId ?? null
  });

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

        openedPermissionWindowIdRef.current = w.id;

        dispatchToMainStore(
          ledgerNewWindowIdChanged({
            windowId: w.id,
            openerWindowId: hostWindowIdRef.current,
            openerRequestId: askPermissionUrlData.params?.requestId ?? null
          })
        );

        registerLedgerPermissionWindow({
          domain: askPermissionUrlData.domain,
          requestId: askPermissionUrlData.params?.requestId,
          windowId: w.id
        });

        triggeredRef.current = true;

        closeTracker.arm(w.id);
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
    closeTracker,
    ledgerEventStatusToRender.status,
    url,
    windowId
  ]);

  // Unmount only — deliberately NOT the cleanup of the effect above. `windowId`
  // is one of that effect's dependencies and the arm path dispatches
  // ledgerNewWindowIdChanged, so its cleanup would run a broadcast round-trip
  // after arming and remove the listener that was just registered.
  useEffect(() => () => closeTracker.detach(), [closeTracker]);

  // The slice can be cleared without this window ever closing —
  // LedgerDisconnectedFooter's Connect CTA does it, and renderLedgerFooter
  // shows that footer for LedgerAskPermission as well as Disconnected. Once
  // that happens another useLedger instance can open its own permission window
  // and take over the slice; a listener still watching ours would wipe that
  // flow's deploy/transaction the moment our stale window is closed.
  useEffect(() => {
    if (windowId != null) return;

    closeTracker.detach();
  }, [closeTracker, windowId]);

  // Asks the background to close the windows THIS flow owns — the tracked
  // permission window plus every window still displaying this flow's request —
  // and to clear the ledger slice.
  //
  // The decision cannot be made here. The owning window ids live in
  // `windowManagement.requests`, which `selectPopupState` strips from every
  // replica on purpose (it maps requestIds to dapp origins and tab ids). What
  // this replaced asked `windows.getAll({ windowTypes: ['popup'] })` instead
  // and removed every popup window in the profile: other dapps' approval
  // windows, the secret-key export window, and popup windows belonging to
  // ordinary web pages. It never closed its own permission window either —
  // `openNewSeparateWindow` creates that one `type: 'normal'`. WALLET-1416.
  //
  // Synchronous by design: `dispatchToMainStore` is fire-and-forget, and every
  // call site is unawaited — the previous `async` body handed each of them a
  // promise that rejected on a stale windowId with nothing to catch it.
  //
  // `permissionWindowId` is the proof of ownership the background cannot derive:
  // the slot is global, so without it the handler can only guess whether the
  // window it is about to remove belongs to the caller's flow.
  const closeNewLedgerWindowsAndClearState = useCallback(() => {
    if (ownPermissionWindowId == null) {
      // A control the user pressed did nothing. Reachable two ways: the slot was
      // released or taken over, and — briefly, on mount — before
      // `windows.getCurrent` resolves for a page that IS (or shares a browser
      // window with the opener of) the permission window.
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
    // Deliberately not the raw slot: a page that branches on "is there a
    // permission window" must not see a foreign flow's.
    ownPermissionWindowId
  };
};
