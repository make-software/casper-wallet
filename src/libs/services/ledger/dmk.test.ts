import { LogLevel } from '@ledgerhq/device-management-kit';

import { describeDeviceFailure, deviceFailureLogger } from './dmk';

describe('describeDeviceFailure', () => {
  it('unwraps a DMK error wrapper into its tag and the cause underneath', () => {
    expect(
      describeDeviceFailure({
        _tag: 'OpeningConnectionError',
        originalError: new Error('GATT connect timed out')
      })
    ).toEqual({
      tag: 'OpeningConnectionError',
      name: 'Error',
      message: 'GATT connect timed out'
    });
  });

  it('reads a bare error directly when there is no wrapper', () => {
    const error = new TypeError('MTU negotiation timeout');

    expect(describeDeviceFailure(error)).toEqual({
      tag: undefined,
      name: 'TypeError',
      message: 'MTU negotiation timeout'
    });
  });

  it('keeps a tag that carries no originalError', () => {
    expect(describeDeviceFailure({ _tag: 'DeviceNotRecognizedError' })).toEqual(
      {
        tag: 'DeviceNotRecognizedError',
        name: undefined,
        message: undefined
      }
    );
  });

  it('carries a string through as the message', () => {
    expect(describeDeviceFailure('device is busy')).toEqual({
      message: 'device is busy'
    });
  });

  it.each([[null], [undefined], [42]])(
    'describes %p without throwing and without a message',
    value => {
      expect(describeDeviceFailure(value)).toEqual({ message: undefined });
    }
  );

  it('keeps only the three described fields, whatever else the error carries', () => {
    const described = describeDeviceFailure({
      _tag: 'SendApduError',
      originalError: Object.assign(new Error('nope'), {
        apdu: Uint8Array.from([0x80, 0x02]),
        publicKey: '0202f5a3...'
      })
    });

    expect(Object.keys(described).sort()).toEqual(['message', 'name', 'tag']);
  });
});

describe('deviceFailureLogger', () => {
  let error: jest.SpyInstance;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['Info', LogLevel.Info],
    ['Debug', LogLevel.Debug]
  ])('writes nothing at %s level', (_name, level) => {
    deviceFailureLogger.log(level, 'sending apdu', {
      tag: 'SendApduUseCase',
      data: { apdu: '8002000000' }
    });

    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it.each([
    ['Fatal', LogLevel.Fatal],
    ['Error', LogLevel.Error]
  ])('writes %s level to console.error', (_name, level) => {
    deviceFailureLogger.log(level, 'exchange failed', {
      tag: 'SendApduUseCase',
      data: { error: new Error('device disconnected') }
    });

    expect(error).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('writes a warning to console.warn', () => {
    deviceFailureLogger.log(LogLevel.Warning, 'session already exists', {
      tag: 'DeviceSessionService'
    });

    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });

  // The guard this whole logger exists for: on a signing exchange that APDU is the transaction.
  it('never writes the outgoing APDU an error-level call carries', () => {
    deviceFailureLogger.log(LogLevel.Error, 'exchange failed', {
      tag: 'SendApduUseCase',
      data: {
        sessionId: 'session-1',
        apdu: '800200002102f5a3deadbeef',
        error: new Error('device disconnected')
      }
    });

    const written = JSON.stringify(error.mock.calls[0]);

    expect(written).not.toContain('800200002102f5a3deadbeef');
    expect(written).not.toContain('apdu');
    expect(written).not.toContain('session-1');
    expect(written).toContain('device disconnected');
  });

  it.each([['e'], ['error'], ['err']])('reads the cause from data.%s', key => {
    deviceFailureLogger.log(LogLevel.Error, 'failed', {
      tag: 'DeviceSession',
      data: { [key]: new Error('the cause') }
    });

    expect(JSON.stringify(error.mock.calls[0])).toContain('the cause');
  });

  it('writes the tag and message even when no cause is attached', () => {
    deviceFailureLogger.log(LogLevel.Error, 'no cause here', {
      tag: 'DeviceSessionService'
    });

    expect(error).toHaveBeenCalledWith(
      'ledger/dmk',
      'DeviceSessionService',
      'no cause here',
      { message: undefined }
    );
  });
});
