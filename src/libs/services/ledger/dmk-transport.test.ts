import { DeviceStatus } from '@ledgerhq/device-management-kit';
import type { ILedgerTransport } from 'casper-wallet-core';

import { DmkSessionHandle, createDmkLedgerTransport } from './dmk-transport';

const okResponse = {
  statusCode: new Uint8Array([0x90, 0x00]),
  data: new Uint8Array([])
};

function createSessionState() {
  const observers: Array<{ next: (state: { deviceStatus: string }) => void }> =
    [];
  const unsubscribe = jest.fn();

  return {
    subscribe: jest.fn(
      (observer: { next: (state: { deviceStatus: string }) => void }) => {
        observers.push(observer);
        return { unsubscribe };
      }
    ),
    emit(deviceStatus: string) {
      observers.forEach(observer => observer.next({ deviceStatus }));
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

  const dmk: DmkSessionHandle = {
    sendApdu,
    disconnect,
    getDeviceSessionState: () => sessionState
  };

  return { dmk, sendApdu, disconnect, sessionState };
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
});
