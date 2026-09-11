import type {
  DeviceManagementKit,
  DiscoveredDevice
} from '@ledgerhq/device-management-kit';
import type { ILedgerTransport } from 'casper-wallet-core';
import { EMPTY, Observable, of } from 'rxjs';

import { KNOWN_DEVICES_WAIT_MS, connectLedgerTransport } from './transport';
import { LedgerEventStatus } from './types';

const fakeDevice = { id: 'device-1' } as unknown as DiscoveredDevice;

/**
 * Models the real transport's `BehaviorSubject`-backed `listenToAvailableDevices`: a seeded
 * empty array synchronously on subscribe, then the real read on a later tick. `neverUpdates`
 * models an observable that never gets past the seed, to exercise the bounded-wait fallback.
 */
function createSeededDevicesObservable(
  devices: DiscoveredDevice[],
  {
    neverUpdates = false,
    unsubscribeSpy
  }: {
    neverUpdates?: boolean;
    unsubscribeSpy?: () => void;
  } = {}
) {
  return new Observable<DiscoveredDevice[]>(subscriber => {
    subscriber.next([]);
    const timer = neverUpdates
      ? undefined
      : setTimeout(() => subscriber.next(devices), 0);

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribeSpy?.();
    };
  });
}

function createFakeConnectDmk(overrides: {
  knownDevices?: DiscoveredDevice[];
  discovered?: DiscoveredDevice;
  neverUpdatesKnownDevices?: boolean;
  errorsKnownDevices?: boolean;
  unsubscribeSpy?: () => void;
}) {
  const listenToAvailableDevices = jest.fn(() =>
    overrides.errorsKnownDevices
      ? new Observable<DiscoveredDevice[]>(subscriber => {
          subscriber.error(new Error('boom'));
        })
      : createSeededDevicesObservable(overrides.knownDevices ?? [], {
          neverUpdates: overrides.neverUpdatesKnownDevices,
          unsubscribeSpy: overrides.unsubscribeSpy
        })
  );
  const startDiscovering = jest.fn(() =>
    overrides.discovered ? of(overrides.discovered) : EMPTY
  );
  const connect = jest.fn(() => Promise.resolve('session-1'));
  const sendApdu = jest.fn(() =>
    Promise.resolve({
      statusCode: new Uint8Array([0x90, 0x00]),
      data: new Uint8Array([])
    })
  );
  const disconnect = jest.fn(() => Promise.resolve(undefined));
  const getDeviceSessionState = jest.fn(() => ({
    subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
  }));

  return {
    listenToAvailableDevices,
    startDiscovering,
    connect,
    sendApdu,
    disconnect,
    getDeviceSessionState
  };
}

describe('connectLedgerTransport', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  // Row: Connect disables the refresher
  it('connects with the session refresher disabled', async () => {
    const dmk = createFakeConnectDmk({ knownDevices: [fakeDevice] });

    await connectLedgerTransport(dmk, 'usb-identifier');

    expect(dmk.connect).toHaveBeenCalledWith({
      device: fakeDevice,
      sessionRefresherOptions: { isRefresherDisabled: true }
    });
  });

  // Row: Connect returns an adapter
  it('resolves an object that satisfies ILedgerTransport and has send', async () => {
    const dmk = createFakeConnectDmk({ knownDevices: [fakeDevice] });

    const transport = await connectLedgerTransport(dmk, 'usb-identifier');
    const asCoreTransport: ILedgerTransport = transport;

    expect(asCoreTransport).toBeDefined();
    expect(typeof transport.send).toBe('function');
  });

  // Row: Already-permitted device connects silently
  it('uses listenToAvailableDevices and never calls startDiscovering when a device is already known', async () => {
    const dmk = createFakeConnectDmk({ knownDevices: [fakeDevice] });

    await connectLedgerTransport(dmk, 'usb-identifier');

    expect(dmk.listenToAvailableDevices).toHaveBeenCalledWith({
      transport: 'usb-identifier'
    });
    expect(dmk.startDiscovering).not.toHaveBeenCalled();
  });

  // Row: No permitted device
  it('calls startDiscovering when no device is already known', async () => {
    const dmk = createFakeConnectDmk({
      knownDevices: [],
      discovered: fakeDevice
    });

    await connectLedgerTransport(dmk, 'usb-identifier');

    expect(dmk.startDiscovering).toHaveBeenCalledWith({
      transport: 'usb-identifier'
    });
    expect(dmk.connect).toHaveBeenCalledWith(
      expect.objectContaining({ device: fakeDevice })
    );
  });

  // Row: Bluetooth creator
  it('threads the given transport identifier through to a web-ble style connect', async () => {
    const dmk = createFakeConnectDmk({ knownDevices: [fakeDevice] });

    await connectLedgerTransport(dmk, 'bluetooth-identifier');

    expect(dmk.listenToAvailableDevices).toHaveBeenCalledWith({
      transport: 'bluetooth-identifier'
    });
    expect(dmk.connect).toHaveBeenCalledWith({
      device: fakeDevice,
      sessionRefresherOptions: { isRefresherDisabled: true }
    });
  });

  it('throws LedgerPermissionRequired when neither check finds a device', async () => {
    const dmk = createFakeConnectDmk({ knownDevices: [] });

    await expect(
      connectLedgerTransport(dmk, 'usb-identifier')
    ).rejects.toMatchObject({
      ledgerEvent: { status: LedgerEventStatus.LedgerPermissionRequired }
    });
    expect(dmk.connect).not.toHaveBeenCalled();
  });

  it('falls back to startDiscovering after the bounded wait when listenToAvailableDevices never gets past the seeded value', async () => {
    jest.useFakeTimers();
    const dmk = createFakeConnectDmk({
      neverUpdatesKnownDevices: true,
      discovered: fakeDevice
    });

    const result = connectLedgerTransport(dmk, 'usb-identifier');
    await jest.advanceTimersByTimeAsync(KNOWN_DEVICES_WAIT_MS);
    await result;

    expect(dmk.startDiscovering).toHaveBeenCalledWith({
      transport: 'usb-identifier'
    });
  });

  it('falls back to startDiscovering when listenToAvailableDevices errors', async () => {
    jest.useFakeTimers();
    const dmk = createFakeConnectDmk({
      errorsKnownDevices: true,
      discovered: fakeDevice
    });

    const result = connectLedgerTransport(dmk, 'usb-identifier');
    await jest.advanceTimersByTimeAsync(0);
    await result;

    expect(dmk.startDiscovering).toHaveBeenCalledWith({
      transport: 'usb-identifier'
    });
  });

  it('unsubscribes from listenToAvailableDevices once resolved, with no leak across repeated calls', async () => {
    jest.useFakeTimers();
    const unsubscribeSpy = jest.fn();
    const dmk = createFakeConnectDmk({
      knownDevices: [fakeDevice],
      unsubscribeSpy
    });

    const first = connectLedgerTransport(dmk, 'usb-identifier');
    await jest.advanceTimersByTimeAsync(0);
    await first;
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

    const second = connectLedgerTransport(dmk, 'usb-identifier');
    await jest.advanceTimersByTimeAsync(0);
    await second;
    expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
  });
});

describe('IsUsbLedgerTransportAvailable / IsBluetoothLedgerTransportAvailable', () => {
  function fakeAvailability(
    isSupported: boolean
  ): Pick<DeviceManagementKit, 'isEnvironmentSupported'> {
    return { isEnvironmentSupported: () => isSupported };
  }

  // Row: USB availability, WebHID present
  it('IsUsbLedgerTransportAvailable resolves true when the injected dmk reports support', async () => {
    const { IsUsbLedgerTransportAvailable } = await import('./transport');

    await expect(
      IsUsbLedgerTransportAvailable(fakeAvailability(true))
    ).resolves.toBe(true);
  });

  // Row: USB availability, WebHID absent
  it('IsUsbLedgerTransportAvailable resolves false when the injected dmk reports no support', async () => {
    const { IsUsbLedgerTransportAvailable } = await import('./transport');

    await expect(
      IsUsbLedgerTransportAvailable(fakeAvailability(false))
    ).resolves.toBe(false);
  });
});

describe('isTransportAvailable', () => {
  // Row: Combined availability
  it('resolves true when only one of USB or Bluetooth is available', async () => {
    jest.resetModules();
    jest.doMock('./dmk', () => ({
      getUsbAvailabilityDmk: () => ({ isEnvironmentSupported: () => false }),
      getBluetoothAvailabilityDmk: () => ({
        isEnvironmentSupported: () => true
      }),
      getDmk: () => ({}),
      connectSession: jest.fn()
    }));

    const { isTransportAvailable } = await import('./transport');

    await expect(isTransportAvailable()).resolves.toBe(true);

    jest.dontMock('./dmk');
    jest.resetModules();
  });

  // Row: Combined availability, both fail
  it('resolves false and swallows errors when both checks reject', async () => {
    jest.resetModules();
    jest.doMock('./dmk', () => ({
      getUsbAvailabilityDmk: () => ({
        isEnvironmentSupported: () => {
          throw new Error('no navigator.hid');
        }
      }),
      getBluetoothAvailabilityDmk: () => ({
        isEnvironmentSupported: () => {
          throw new Error('no navigator.bluetooth');
        }
      }),
      getDmk: () => ({}),
      connectSession: jest.fn()
    }));

    const { isTransportAvailable } = await import('./transport');

    await expect(isTransportAvailable()).resolves.toBe(false);

    jest.dontMock('./dmk');
    jest.resetModules();
  });
});
