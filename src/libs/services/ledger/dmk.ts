import {
  type DeviceManagementKit,
  DeviceManagementKitBuilder,
  type DeviceSessionId,
  type DiscoveredDevice,
  LogLevel
} from '@ledgerhq/device-management-kit';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';

/** The shape of a device failure this module is willing to put on the console. */
export interface DeviceFailureDescription {
  tag?: string;
  name?: string;
  message?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Flattens DMK's error wrappers — a `_tag` around an `originalError` — into the three fields
 * above. Only ever applied to an error raised by DMK: its messages name the step that failed
 * ("GATT connect timed out", "MTU negotiation timeout"), whereas core's carry the public key
 * and transaction hash the exchange failed on.
 */
export function describeDeviceFailure(
  error: unknown
): DeviceFailureDescription {
  if (!isRecord(error)) {
    return { message: typeof error === 'string' ? error : undefined };
  }

  const cause = isRecord(error.originalError) ? error.originalError : error;

  return {
    tag: typeof error._tag === 'string' ? error._tag : undefined,
    name: typeof cause.name === 'string' ? cause.name : undefined,
    message: typeof cause.message === 'string' ? cause.message : undefined
  };
}

/**
 * Without a subscriber DMK discards its own record of every failure — which is how a transport
 * that breaks reaches the user as a bare "unable to connect" with nothing on any console.
 * Errors and warnings only, and never `options.data` itself: `SendApduUseCase` logs the
 * outgoing APDU at error level, and on a signing exchange that APDU is the transaction.
 */
export const deviceFailureLogger = {
  log: (
    level: LogLevel,
    message: string,
    options: { tag: string; data?: Record<string, unknown> }
  ): void => {
    if (level > LogLevel.Warning) return;

    const cause = options.data?.e ?? options.data?.error ?? options.data?.err;
    const write = level === LogLevel.Warning ? console.warn : console.error;

    write('ledger/dmk', options.tag, message, describeDeviceFailure(cause));
  }
};

let dmk: DeviceManagementKit | undefined;

/** Built once per document, so every connection shares one instance and session registry. */
export const getDmk = (): DeviceManagementKit =>
  (dmk ??= new DeviceManagementKitBuilder()
    .addTransport(webHidTransportFactory)
    .addTransport(webBleTransportFactory)
    .addLogger(deviceFailureLogger)
    .build());

let usbAvailabilityDmk: DeviceManagementKit | undefined;

/** `isEnvironmentSupported` answers for any registered transport, so USB needs its own instance. */
export const getUsbAvailabilityDmk = (): DeviceManagementKit =>
  (usbAvailabilityDmk ??= new DeviceManagementKitBuilder()
    .addTransport(webHidTransportFactory)
    .build());

let bluetoothAvailabilityDmk: DeviceManagementKit | undefined;

export const getBluetoothAvailabilityDmk = (): DeviceManagementKit =>
  (bluetoothAvailabilityDmk ??= new DeviceManagementKitBuilder()
    .addTransport(webBleTransportFactory)
    .build());

/** The refresher is left enabled here; the transport gates it to observed, non-exchange spans. */
export const connectSession = (
  dmk: Pick<DeviceManagementKit, 'connect'>,
  device: DiscoveredDevice
): Promise<DeviceSessionId> =>
  dmk.connect({
    device,
    sessionRefresherOptions: { isRefresherDisabled: false }
  });
