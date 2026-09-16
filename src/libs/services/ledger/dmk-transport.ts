import {
  type DeviceSessionState,
  DeviceStatus
} from '@ledgerhq/device-management-kit';
import type { ILedgerTransport, LedgerDeviceState } from 'casper-wallet-core';
import { Observable, share } from 'rxjs';

import { ApduSender, createApduSend } from './dmk-apdu';
import { createRefresherGate } from './dmk-refresher';
import { toLedgerDeviceState } from './dmk-state';

/** The slice of the DMK instance this adapter needs. Injected so it is testable without a device. */
export interface DmkSessionHandle {
  sendApdu(args: {
    sessionId: string;
    apdu: Uint8Array;
    abortTimeout?: number;
  }): Promise<{
    statusCode: Uint8Array;
    data: Uint8Array;
  }>;
  disconnect(args: { sessionId: string }): Promise<void>;
  getDeviceSessionState(args: { sessionId: string }): {
    subscribe(observer: {
      next: (state: DeviceSessionState) => void;
      error?: (error: unknown) => void;
    }): {
      unsubscribe(): void;
    };
  };
  disableDeviceSessionRefresher(args: {
    sessionId: string;
    blockerId: string;
  }): () => void;
}

export interface DmkLedgerTransport extends ILedgerTransport {
  observeState(): Observable<LedgerDeviceState>;
  send(
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data?: Buffer,
    statusList?: number[],
    options?: { abortTimeoutMs?: number }
  ): Promise<Buffer>;
}

/**
 * Makes a DMK session look like the `ILedgerTransport` core drives: a `'disconnect'` fired at
 * most once, a latched exchange timeout, and an `observeState()` that gates the refresher.
 */
export function createDmkLedgerTransport(
  dmk: DmkSessionHandle,
  sessionId: string
): DmkLedgerTransport {
  let disconnectPromise: Promise<void> | undefined;
  let stateSubscription: { unsubscribe(): void } | undefined;
  let disconnectListeners: Array<(...args: any[]) => any> = [];
  let hasFiredDisconnect = false;
  let latchedAbortTimeout: number | undefined;

  function ensureSubscription(): void {
    if (stateSubscription) return;

    stateSubscription = dmk.getDeviceSessionState({ sessionId }).subscribe({
      next: state => {
        if (hasFiredDisconnect) return;

        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) {
          hasFiredDisconnect = true;
          disconnectListeners.forEach(listener => listener());
        }
      }
    });
  }

  const apduSender: ApduSender = ({ apdu, abortTimeout }) =>
    dmk.sendApdu({ sessionId, apdu, abortTimeout });

  const send = createApduSend(apduSender);

  const gate = createRefresherGate(dmk, sessionId);

  // Shared so a second reader costs no extra device traffic; reset at zero subscribers.
  const state$ = new Observable<LedgerDeviceState>(subscriber => {
    const releaseObservation = gate.beginObserving();

    const subscription = dmk.getDeviceSessionState({ sessionId }).subscribe({
      next: state => subscriber.next(toLedgerDeviceState(state)),
      error: error => subscriber.error(error)
    });

    return () => {
      subscription.unsubscribe();
      releaseObservation();
    };
  }).pipe(share({ resetOnRefCountZero: true }));

  return {
    async close() {
      stateSubscription?.unsubscribe();
      gate.dispose();

      if (!disconnectPromise) {
        disconnectPromise = dmk
          .disconnect({ sessionId })
          .catch(() => undefined);
      }

      return disconnectPromise;
    },
    on(eventName, cb) {
      if (eventName !== 'disconnect') return;

      disconnectListeners.push(cb);
      ensureSubscription();
    },
    off(eventName, cb) {
      if (eventName !== 'disconnect') return;

      disconnectListeners = disconnectListeners.filter(
        listener => listener !== cb
      );
    },
    setExchangeTimeout(exchangeTimeout) {
      latchedAbortTimeout = exchangeTimeout;
    },
    observeState() {
      return state$;
    },
    send(cla, ins, p1, p2, data, statusList, options = {}) {
      const abortTimeoutMs = options.abortTimeoutMs ?? latchedAbortTimeout;

      return gate.duringExchange(() =>
        send(
          cla,
          ins,
          p1,
          p2,
          data,
          statusList,
          abortTimeoutMs === undefined ? {} : { abortTimeoutMs }
        )
      );
    }
  };
}
