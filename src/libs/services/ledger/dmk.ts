import {
  type DeviceManagementKit,
  DeviceManagementKitBuilder,
  type DeviceSessionId,
  type DiscoveredDevice
} from '@ledgerhq/device-management-kit';
import { webBleTransportFactory } from '@ledgerhq/device-transport-kit-web-ble';
import { webHidTransportFactory } from '@ledgerhq/device-transport-kit-web-hid';

let dmk: DeviceManagementKit | undefined;

/**
 * DMK should be built once per document (its own docs call this out), so every USB and
 * Bluetooth connection in this document shares the same instance and session registry.
 */
export const getDmk = (): DeviceManagementKit =>
  (dmk ??= new DeviceManagementKitBuilder()
    .addTransport(webHidTransportFactory)
    .addTransport(webBleTransportFactory)
    .build());

let usbAvailabilityDmk: DeviceManagementKit | undefined;

/**
 * `DeviceManagementKit.isEnvironmentSupported` reports "any transport registered on this
 * instance", so a USB-only instance is the only way to ask about WebHID in isolation.
 */
export const getUsbAvailabilityDmk = (): DeviceManagementKit =>
  (usbAvailabilityDmk ??= new DeviceManagementKitBuilder()
    .addTransport(webHidTransportFactory)
    .build());

let bluetoothAvailabilityDmk: DeviceManagementKit | undefined;

export const getBluetoothAvailabilityDmk = (): DeviceManagementKit =>
  (bluetoothAvailabilityDmk ??= new DeviceManagementKitBuilder()
    .addTransport(webBleTransportFactory)
    .build());

/** Every DMK session disables the refresher: a per-signature popup must not hold the device busy. */
export const connectSession = (
  dmk: Pick<DeviceManagementKit, 'connect'>,
  device: DiscoveredDevice
): Promise<DeviceSessionId> =>
  dmk.connect({
    device,
    sessionRefresherOptions: { isRefresherDisabled: true }
  });
