import {
  DeviceSessionStateType,
  DeviceStatus
} from '@ledgerhq/device-management-kit';
import type { DeviceSessionState } from '@ledgerhq/device-management-kit';

import { toLedgerDeviceState } from './dmk-state';

const connectedState = (deviceStatus: string): DeviceSessionState =>
  ({
    sessionStateType: DeviceSessionStateType.Connected,
    deviceStatus
  }) as unknown as DeviceSessionState;

const readyState = (
  deviceStatus: string,
  currentApp: { name: string; version: string }
): DeviceSessionState =>
  ({
    sessionStateType: DeviceSessionStateType.ReadyWithoutSecureChannel,
    deviceStatus,
    currentApp
  }) as unknown as DeviceSessionState;

describe('toLedgerDeviceState', () => {
  it('maps a locked device onto the locked status', () => {
    expect(toLedgerDeviceState(connectedState(DeviceStatus.LOCKED))).toEqual({
      status: 'locked'
    });
  });

  it('maps a busy device onto the busy status', () => {
    expect(toLedgerDeviceState(connectedState(DeviceStatus.BUSY))).toEqual({
      status: 'busy'
    });
  });

  it('maps a connected device onto the connected status', () => {
    expect(toLedgerDeviceState(connectedState(DeviceStatus.CONNECTED))).toEqual(
      {
        status: 'connected'
      }
    );
  });

  it('maps a not-connected device onto the disconnected status', () => {
    expect(
      toLedgerDeviceState(connectedState(DeviceStatus.NOT_CONNECTED))
    ).toEqual({ status: 'disconnected' });
  });

  it('falls back to the unknown status for an unrecognised device status', () => {
    expect(toLedgerDeviceState(connectedState('SOMETHING ELSE'))).toEqual({
      status: 'unknown'
    });
  });

  it('carries the app identity when the state shape has one', () => {
    expect(
      toLedgerDeviceState(
        readyState(DeviceStatus.CONNECTED, { name: 'Casper', version: '3.1.5' })
      )
    ).toEqual({
      status: 'connected',
      app: { name: 'Casper', version: '3.1.5' }
    });
  });

  it('omits the app key entirely on a state shape that carries none', () => {
    expect(
      toLedgerDeviceState(connectedState(DeviceStatus.CONNECTED))
    ).not.toHaveProperty('app');
  });

  it('carries the app identity alongside a non-connected status', () => {
    expect(
      toLedgerDeviceState(
        readyState(DeviceStatus.BUSY, { name: 'Casper', version: '3.1.5' })
      )
    ).toEqual({ status: 'busy', app: { name: 'Casper', version: '3.1.5' } });
  });

  it('reports the dashboard as itself rather than dropping or renaming it', () => {
    expect(
      toLedgerDeviceState(
        readyState(DeviceStatus.CONNECTED, { name: 'BOLOS', version: '1.4.0' })
      )
    ).toEqual({
      status: 'connected',
      app: { name: 'BOLOS', version: '1.4.0' }
    });
  });

  it('treats a blank app name as no identity at all', () => {
    expect(
      toLedgerDeviceState(
        readyState(DeviceStatus.CONNECTED, { name: '', version: '1.0.0' })
      )
    ).not.toHaveProperty('app');
  });
});
