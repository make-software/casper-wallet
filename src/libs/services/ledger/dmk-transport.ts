import { DeviceStatus } from '@ledgerhq/device-management-kit';
import type { ILedgerTransport } from 'casper-wallet-core';

import { ApduSender, createApduSend } from './dmk-apdu';

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
    subscribe(observer: { next: (state: { deviceStatus: string }) => void }): {
      unsubscribe(): void;
    };
  };
  disableDeviceSessionRefresher(args: {
    sessionId: string;
    blockerId: string;
  }): () => void;
}

export interface DmkLedgerTransport extends ILedgerTransport {
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
 * Makes a DMK session look like the `ILedgerTransport` core drives: a synthetic `'disconnect'`
 * event derived from the session-state observable (fired at most once, so core's 3600 ms
 * reconnection gate is never re-armed), and a latched exchange timeout applied to every
 * subsequent `send` until overridden per call.
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

  return {
    async close() {
      stateSubscription?.unsubscribe();

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
    send(cla, ins, p1, p2, data, statusList, options = {}) {
      const abortTimeoutMs = options.abortTimeoutMs ?? latchedAbortTimeout;

      return send(
        cla,
        ins,
        p1,
        p2,
        data,
        statusList,
        abortTimeoutMs === undefined ? {} : { abortTimeoutMs }
      );
    }
  };
}
