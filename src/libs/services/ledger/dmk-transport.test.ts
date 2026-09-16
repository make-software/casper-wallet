import {
  DeviceModelId,
  type DeviceSessionState,
  DeviceSessionStateType,
  DeviceStatus
} from '@ledgerhq/device-management-kit';
import type { ILedgerTransport, LedgerDeviceState } from 'casper-wallet-core';

import { DmkSessionHandle, createDmkLedgerTransport } from './dmk-transport';

const okResponse = {
  statusCode: new Uint8Array([0x90, 0x00]),
  data: new Uint8Array([])
};

type SessionStateObserver = Parameters<
  ReturnType<DmkSessionHandle['getDeviceSessionState']>['subscribe']
>[0];

const connectedState = (deviceStatus: DeviceStatus): DeviceSessionState => ({
  sessionStateType: DeviceSessionStateType.Connected,
  deviceStatus,
  deviceModelId: DeviceModelId.NANO_X
});

function createSessionState() {
  const observers: SessionStateObserver[] = [];
  const unsubscribe = jest.fn();

  return {
    subscribe: jest.fn((observer: SessionStateObserver) => {
      observers.push(observer);
      return { unsubscribe };
    }),
    emit(deviceStatus: DeviceStatus) {
      observers.forEach(observer =>
        observer.next(connectedState(deviceStatus))
      );
    },
    emitError(error: unknown) {
      observers.forEach(observer => observer.error?.(error));
    },
    unsubscribe
  };
}

function createFakeDmk() {
  const sessionState = createSessionState();
  const sendApdu = jest.fn<
    ReturnType<DmkSessionHandle['sendApdu']>,
    Parameters<DmkSessionHandle['sendApdu']>
  >(() => Promise.resolve(okResponse));
  const disconnect = jest.fn<
    ReturnType<DmkSessionHandle['disconnect']>,
    Parameters<DmkSessionHandle['disconnect']>
  >(() => Promise.resolve(undefined));
  const releaseRefresherBlocker = jest.fn<void, []>();
  const disableDeviceSessionRefresher = jest.fn<
    ReturnType<DmkSessionHandle['disableDeviceSessionRefresher']>,
    Parameters<DmkSessionHandle['disableDeviceSessionRefresher']>
  >(() => releaseRefresherBlocker);

  const dmk: DmkSessionHandle = {
    sendApdu,
    disconnect,
    getDeviceSessionState: () => sessionState,
    disableDeviceSessionRefresher
  };

  return {
    dmk,
    sendApdu,
    disconnect,
    sessionState,
    disableDeviceSessionRefresher,
    releaseRefresherBlocker
  };
}

describe('createDmkLedgerTransport', () => {
  it('satisfies ILedgerTransport', () => {
    const { dmk } = createFakeDmk();

    const asCoreTransport: ILedgerTransport = createDmkLedgerTransport(
      dmk,
      'session-1'
    );

    expect(asCoreTransport).toBeDefined();
  });

  describe('close', () => {
    it('disconnects the session using the sessionId from construction', async () => {
      const { dmk, disconnect } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');

      await transport.close();

      expect(disconnect).toHaveBeenCalledTimes(1);
      expect(disconnect).toHaveBeenCalledWith({ sessionId: 'session-1' });
    });

    it('tears down the device-session-state subscription', async () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      transport.on('disconnect', jest.fn());

      await transport.close();

      expect(sessionState.unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('calls dmk.disconnect once across two close() calls, and the second resolves', async () => {
      const { dmk, disconnect } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');

      await transport.close();

      await expect(transport.close()).resolves.toBeUndefined();
      expect(disconnect).toHaveBeenCalledTimes(1);
    });

    it('resolves even when dmk.disconnect rejects', async () => {
      const { dmk, disconnect } = createFakeDmk();
      disconnect.mockImplementation(() =>
        Promise.reject(new Error('disconnect failed'))
      );
      const transport = createDmkLedgerTransport(dmk, 'session-1');

      await expect(transport.close()).resolves.toBeUndefined();
    });
  });

  describe('disconnect event', () => {
    it('calls the handler once when the state becomes NOT_CONNECTED', () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const fn = jest.fn();
      transport.on('disconnect', fn);

      sessionState.emit(DeviceStatus.NOT_CONNECTED);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not call the handler for CONNECTED, BUSY or LOCKED', () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const fn = jest.fn();
      transport.on('disconnect', fn);

      sessionState.emit(DeviceStatus.CONNECTED);
      sessionState.emit(DeviceStatus.BUSY);
      sessionState.emit(DeviceStatus.LOCKED);

      expect(fn).not.toHaveBeenCalled();
    });

    it('calls the handler exactly once when NOT_CONNECTED is emitted twice', () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const fn = jest.fn();
      transport.on('disconnect', fn);

      sessionState.emit(DeviceStatus.NOT_CONNECTED);
      sessionState.emit(DeviceStatus.NOT_CONNECTED);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('stops calling the handler after off()', () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const fn = jest.fn();
      transport.on('disconnect', fn);
      transport.off('disconnect', fn);

      sessionState.emit(DeviceStatus.NOT_CONNECTED);

      expect(fn).not.toHaveBeenCalled();
    });

    it('does not throw when off() is called with an unregistered function, and the real handler still fires', () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const fn = jest.fn();
      const otherFn = jest.fn();
      transport.on('disconnect', fn);

      expect(() => transport.off('disconnect', otherFn)).not.toThrow();
      sessionState.emit(DeviceStatus.NOT_CONNECTED);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('does not call a handler registered under a different event name', () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const fn = jest.fn();
      transport.on('somethingElse', fn);
      transport.on('disconnect', jest.fn());

      sessionState.emit(DeviceStatus.NOT_CONNECTED);

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('setExchangeTimeout', () => {
    it('passes the latched timeout as abortTimeout on send', async () => {
      const { dmk, sendApdu } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      transport.setExchangeTimeout(10000);

      await transport.send(0x11, 0x01, 0x00, 0x00);

      expect(sendApdu).toHaveBeenCalledWith(
        expect.objectContaining({ abortTimeout: 10000 })
      );
    });

    it('applies the latched timeout to two subsequent send calls', async () => {
      const { dmk, sendApdu } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      transport.setExchangeTimeout(10000);

      await transport.send(0x11, 0x01, 0x00, 0x00);
      await transport.send(0x11, 0x01, 0x00, 0x00);

      expect(sendApdu).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ abortTimeout: 10000 })
      );
      expect(sendApdu).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ abortTimeout: 10000 })
      );
    });

    it('omits abortTimeout when setExchangeTimeout was never called', async () => {
      const { dmk, sendApdu } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');

      await transport.send(0x11, 0x01, 0x00, 0x00);

      const [callArgs] = sendApdu.mock.calls[0];
      expect(callArgs.abortTimeout).toBeUndefined();
    });

    it('lets an explicit abortTimeoutMs override the latched timeout for that call', async () => {
      const { dmk, sendApdu } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      transport.setExchangeTimeout(10000);

      await transport.send(0x11, 0x01, 0x00, 0x00, undefined, undefined, {
        abortTimeoutMs: 500
      });

      expect(sendApdu).toHaveBeenCalledWith(
        expect.objectContaining({ abortTimeout: 500 })
      );
    });
  });

  describe('observeState', () => {
    it('exposes observeState as a function on a value that satisfies ILedgerTransport', () => {
      const { dmk } = createFakeDmk();

      const asCoreTransport: ILedgerTransport = createDmkLedgerTransport(
        dmk,
        'session-1'
      );

      expect(typeof asCoreTransport.observeState).toBe('function');
    });

    it('translates a LOCKED session state into a locked device state', () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const states: LedgerDeviceState[] = [];
      transport.observeState().subscribe(state => states.push(state));

      sessionState.emit(DeviceStatus.LOCKED);

      expect(states).toEqual([{ status: 'locked' }]);
    });

    it('releases the standing refresher blocker on the first subscription', () => {
      const { dmk, releaseRefresherBlocker } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');

      expect(releaseRefresherBlocker).not.toHaveBeenCalled();

      transport.observeState().subscribe();

      expect(releaseRefresherBlocker).toHaveBeenCalledTimes(1);
    });

    it('takes a refresher blocker again when the only subscription is torn down', () => {
      const { dmk, disableDeviceSessionRefresher } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const subscription = transport.observeState().subscribe();
      const blockersWhileObserving =
        disableDeviceSessionRefresher.mock.calls.length;

      subscription.unsubscribe();

      expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(
        blockersWhileObserving + 1
      );
    });

    it('subscribes to the session state once for two subscribers and feeds both', () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const first: LedgerDeviceState[] = [];
      const second: LedgerDeviceState[] = [];
      transport.observeState().subscribe(state => first.push(state));
      transport.observeState().subscribe(state => second.push(state));

      sessionState.emit(DeviceStatus.LOCKED);

      expect(sessionState.subscribe).toHaveBeenCalledTimes(1);
      expect(first).toEqual([{ status: 'locked' }]);
      expect(second).toEqual(first);
    });

    it('releases the standing blocker once and retakes it once across two subscribers', () => {
      const { dmk, disableDeviceSessionRefresher, releaseRefresherBlocker } =
        createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const blockersBefore = disableDeviceSessionRefresher.mock.calls.length;

      const first = transport.observeState().subscribe();
      const second = transport.observeState().subscribe();

      expect(releaseRefresherBlocker).toHaveBeenCalledTimes(1);

      first.unsubscribe();

      expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(
        blockersBefore
      );

      second.unsubscribe();

      expect(releaseRefresherBlocker).toHaveBeenCalledTimes(1);
      expect(disableDeviceSessionRefresher).toHaveBeenCalledTimes(
        blockersBefore + 1
      );
    });

    it('propagates a session-state error to the subscriber without throwing', () => {
      const { dmk, sessionState } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const error = jest.fn();
      transport.observeState().subscribe({ next: jest.fn(), error });

      expect(() =>
        sessionState.emitError(new Error('session lost'))
      ).not.toThrow();

      expect(error).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'session lost' })
      );
    });

    it('holds a refresher blocker for the span of an exchange and releases it after', async () => {
      const {
        dmk,
        sendApdu,
        disableDeviceSessionRefresher,
        releaseRefresherBlocker
      } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      const blockersBefore = disableDeviceSessionRefresher.mock.calls.length;
      let blockersDuringExchange = 0;
      let releasesDuringExchange = 0;
      sendApdu.mockImplementation(() => {
        blockersDuringExchange =
          disableDeviceSessionRefresher.mock.calls.length;
        releasesDuringExchange = releaseRefresherBlocker.mock.calls.length;

        return Promise.resolve(okResponse);
      });

      await transport.send(0x11, 0x01, 0x00, 0x00);

      expect(blockersDuringExchange).toBe(blockersBefore + 1);
      expect(releaseRefresherBlocker).toHaveBeenCalledTimes(
        releasesDuringExchange + 1
      );
    });

    it('releases the exchange blocker when the exchange rejects', async () => {
      const { dmk, sendApdu, releaseRefresherBlocker } = createFakeDmk();
      sendApdu.mockImplementation(() =>
        Promise.reject(new Error('apdu failed'))
      );
      const transport = createDmkLedgerTransport(dmk, 'session-1');

      await expect(transport.send(0x11, 0x01, 0x00, 0x00)).rejects.toThrow(
        'apdu failed'
      );

      expect(releaseRefresherBlocker).toHaveBeenCalledTimes(1);
    });

    it('tears down the session subscription and disposes the gate on close', async () => {
      const { dmk, sessionState, releaseRefresherBlocker } = createFakeDmk();
      const transport = createDmkLedgerTransport(dmk, 'session-1');
      transport.on('disconnect', jest.fn());

      await transport.close();

      expect(sessionState.unsubscribe).toHaveBeenCalledTimes(1);
      expect(releaseRefresherBlocker).toHaveBeenCalledTimes(1);
    });
  });
});
