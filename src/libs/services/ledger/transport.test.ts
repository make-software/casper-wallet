import type {
  DeviceManagementKit,
  DiscoveredDevice
} from '@ledgerhq/device-management-kit';
import { webHidIdentifier } from '@ledgerhq/device-transport-kit-web-hid';
import type { ILedgerTransport } from 'casper-wallet-core';
import { EMPTY, Observable, of } from 'rxjs';

import {
  KNOWN_DEVICES_WAIT_MS,
  connectLedgerTransport,
  getPreferredTransport,
  subscribeToBluetoothAvailability
} from './transport';
import { LedgerEventStatus } from './types';

/** Flushes pending microtasks, including chained `.then()` callbacks. */
const flushMicrotasks = () => new Promise(resolve => setImmediate(resolve));

function createFakeBluetoothSource(
  overrides: { available?: boolean; rejects?: boolean } = {}
) {
  const listeners = new Set<(event: { value: boolean }) => void>();

  const source = {
    getAvailability: jest.fn(() =>
      overrides.rejects
        ? Promise.reject(new Error('boom'))
        : Promise.resolve(overrides.available ?? true)
    ),
    addEventListener: jest.fn(
      (_type: string, listener: (event: { value: boolean }) => void) => {
        listeners.add(listener);
      }
    ),
    removeEventListener: jest.fn(
      (_type: string, listener: (event: { value: boolean }) => void) => {
        listeners.delete(listener);
      }
    )
  };

  return {
    source,
    emit: (value: boolean) => listeners.forEach(listener => listener({ value }))
  };
}

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
  const disableDeviceSessionRefresher = jest.fn(() => jest.fn());

  return {
    listenToAvailableDevices,
    startDiscovering,
    connect,
    sendApdu,
    disconnect,
    getDeviceSessionState,
    disableDeviceSessionRefresher
  };
}

describe('connectLedgerTransport', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('connects with the session refresher left enabled', async () => {
    const dmk = createFakeConnectDmk({ knownDevices: [fakeDevice] });

    await connectLedgerTransport(dmk, 'usb-identifier');

    expect(dmk.connect).toHaveBeenCalledWith({
      device: fakeDevice,
      sessionRefresherOptions: { isRefresherDisabled: false }
    });
  });

  it('resolves an object that satisfies ILedgerTransport and has send', async () => {
    const dmk = createFakeConnectDmk({ knownDevices: [fakeDevice] });

    const transport = await connectLedgerTransport(dmk, 'usb-identifier');
    const asCoreTransport: ILedgerTransport = transport;

    expect(asCoreTransport).toBeDefined();
    expect(typeof transport.send).toBe('function');
  });

  it('uses listenToAvailableDevices and never calls startDiscovering when a device is already known', async () => {
    const dmk = createFakeConnectDmk({ knownDevices: [fakeDevice] });

    await connectLedgerTransport(dmk, 'usb-identifier');

    expect(dmk.listenToAvailableDevices).toHaveBeenCalledWith({
      transport: 'usb-identifier'
    });
    expect(dmk.startDiscovering).not.toHaveBeenCalled();
  });

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

  it('threads the given transport identifier through to a web-ble style connect', async () => {
    const dmk = createFakeConnectDmk({ knownDevices: [fakeDevice] });

    await connectLedgerTransport(dmk, 'bluetooth-identifier');

    expect(dmk.listenToAvailableDevices).toHaveBeenCalledWith({
      transport: 'bluetooth-identifier'
    });
    expect(dmk.connect).toHaveBeenCalledWith({
      device: fakeDevice,
      sessionRefresherOptions: { isRefresherDisabled: false }
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

function createFakeProbeDmk(
  overrides: {
    knownDevices?: DiscoveredDevice[];
    neverUpdatesKnownDevices?: boolean;
    errorsKnownDevices?: boolean;
    unsubscribeSpy?: () => void;
  } = {}
) {
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
  const startDiscovering = jest.fn(() => EMPTY);

  return { listenToAvailableDevices, startDiscovering };
}

describe('getPreferredTransport', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves USB when a permitted device exists, without prompting', async () => {
    const dmk = createFakeProbeDmk({ knownDevices: [fakeDevice] });

    await expect(getPreferredTransport(dmk)).resolves.toBe('USB');
    expect(dmk.startDiscovering).not.toHaveBeenCalled();
  });

  it('resolves USB when several permitted devices exist, without prompting', async () => {
    const dmk = createFakeProbeDmk({
      knownDevices: [
        fakeDevice,
        { id: 'device-2' } as unknown as DiscoveredDevice
      ]
    });

    await expect(getPreferredTransport(dmk)).resolves.toBe('USB');
    expect(dmk.startDiscovering).not.toHaveBeenCalled();
  });

  it('resolves undefined when no device is permitted, without prompting', async () => {
    const dmk = createFakeProbeDmk({ knownDevices: [] });

    await expect(getPreferredTransport(dmk)).resolves.toBeUndefined();
    expect(dmk.startDiscovering).not.toHaveBeenCalled();
  });

  it('resolves undefined after the bounded wait when listenToAvailableDevices never gets past the seeded value', async () => {
    jest.useFakeTimers();
    const dmk = createFakeProbeDmk({ neverUpdatesKnownDevices: true });

    const result = getPreferredTransport(dmk);
    await jest.advanceTimersByTimeAsync(KNOWN_DEVICES_WAIT_MS);

    await expect(result).resolves.toBeUndefined();
    expect(dmk.startDiscovering).not.toHaveBeenCalled();
  });

  it('resolves undefined when listenToAvailableDevices errors', async () => {
    const dmk = createFakeProbeDmk({ errorsKnownDevices: true });

    await expect(getPreferredTransport(dmk)).resolves.toBeUndefined();
    expect(dmk.startDiscovering).not.toHaveBeenCalled();
  });

  it('unsubscribes from listenToAvailableDevices before resolving, with no leak across repeated calls', async () => {
    const unsubscribeSpy = jest.fn();
    const dmk = createFakeProbeDmk({
      knownDevices: [fakeDevice],
      unsubscribeSpy
    });

    await getPreferredTransport(dmk);
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);

    await getPreferredTransport(dmk);
    expect(unsubscribeSpy).toHaveBeenCalledTimes(2);
  });

  it('always probes with the USB identifier and never resolves Bluetooth', async () => {
    const dmk = createFakeProbeDmk({ knownDevices: [fakeDevice] });

    const result = await getPreferredTransport(dmk);

    expect(dmk.listenToAvailableDevices).toHaveBeenCalledWith({
      transport: webHidIdentifier
    });
    expect(result).not.toBe('Bluetooth');
  });
});

describe('IsUsbLedgerTransportAvailable / IsBluetoothLedgerTransportAvailable', () => {
  function fakeAvailability(
    isSupported: boolean
  ): Pick<DeviceManagementKit, 'isEnvironmentSupported'> {
    return { isEnvironmentSupported: () => isSupported };
  }

  it('IsUsbLedgerTransportAvailable resolves true when the injected dmk reports support', async () => {
    const { IsUsbLedgerTransportAvailable } = await import('./transport');

    await expect(
      IsUsbLedgerTransportAvailable(fakeAvailability(true))
    ).resolves.toBe(true);
  });

  it('IsUsbLedgerTransportAvailable resolves false when the injected dmk reports no support', async () => {
    const { IsUsbLedgerTransportAvailable } = await import('./transport');

    await expect(
      IsUsbLedgerTransportAvailable(fakeAvailability(false))
    ).resolves.toBe(false);
  });
});

describe('isTransportAvailable', () => {
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

describe('subscribeToBluetoothAvailability', () => {
  it('delivers true when the adapter is available at subscribe time', async () => {
    const observer = jest.fn();
    const { source } = createFakeBluetoothSource({ available: true });

    subscribeToBluetoothAvailability(observer, source);
    await flushMicrotasks();

    expect(observer).toHaveBeenCalledWith(true);
  });

  it('delivers false when the adapter is unavailable at subscribe time', async () => {
    const observer = jest.fn();
    const { source } = createFakeBluetoothSource({ available: false });

    subscribeToBluetoothAvailability(observer, source);
    await flushMicrotasks();

    expect(observer).toHaveBeenCalledWith(false);
  });

  it('delivers the new value when availability flips after subscribe', async () => {
    const observer = jest.fn();
    const { source, emit } = createFakeBluetoothSource({ available: true });

    subscribeToBluetoothAvailability(observer, source);
    await flushMicrotasks();
    observer.mockClear();

    emit(false);

    expect(observer).toHaveBeenCalledWith(false);
  });

  it('delivers nothing further once unsubscribed', async () => {
    const observer = jest.fn();
    const { source, emit } = createFakeBluetoothSource({ available: true });

    const { unsubscribe } = subscribeToBluetoothAvailability(observer, source);
    await flushMicrotasks();
    unsubscribe();
    observer.mockClear();

    emit(false);

    expect(observer).not.toHaveBeenCalled();
  });

  it('removes the same listener reference it registered', async () => {
    const observer = jest.fn();
    const { source } = createFakeBluetoothSource({ available: true });

    const { unsubscribe } = subscribeToBluetoothAvailability(observer, source);
    unsubscribe();

    expect(source.addEventListener).toHaveBeenCalledWith(
      'availabilitychanged',
      expect.any(Function)
    );
    expect(source.removeEventListener).toHaveBeenCalledWith(
      'availabilitychanged',
      source.addEventListener.mock.calls[0][1]
    );
  });

  it('delivers false and stays callable without throwing when navigator.bluetooth is absent', () => {
    const observer = jest.fn();

    const { unsubscribe } = subscribeToBluetoothAvailability(
      observer,
      undefined
    );

    expect(observer).toHaveBeenCalledWith(false);
    expect(() => unsubscribe()).not.toThrow();
  });

  it('delivers false and swallows the rejection when getAvailability rejects', async () => {
    const observer = jest.fn();
    const { source } = createFakeBluetoothSource({ rejects: true });

    subscribeToBluetoothAvailability(observer, source);
    await flushMicrotasks();

    expect(observer).toHaveBeenCalledWith(false);
  });
});
