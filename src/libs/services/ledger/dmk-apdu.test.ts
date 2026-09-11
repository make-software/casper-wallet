import {
  ApduSender,
  ApduStatusError,
  MAX_APDU_DATA_LENGTH,
  createApduSend
} from './dmk-apdu';

const okResponse = {
  statusCode: new Uint8Array([0x90, 0x00]),
  data: new Uint8Array([])
};

describe('createApduSend', () => {
  it('caps APDU data at the 256-byte limit hw-transport enforced', () => {
    expect(MAX_APDU_DATA_LENGTH).toBe(256);
  });

  // Row: Frames the APDU header
  it('frames cla, ins, p1, p2, Lc and data into a single APDU', async () => {
    const sendApdu = jest.fn<ReturnType<ApduSender>, Parameters<ApduSender>>(
      () => Promise.resolve(okResponse)
    );
    const send = createApduSend(sendApdu);

    await send(0x11, 0x01, 0x00, 0x00, Buffer.from([0xaa, 0xbb]));

    expect(sendApdu).toHaveBeenCalledWith(
      expect.objectContaining({
        apdu: new Uint8Array([0x11, 0x01, 0x00, 0x00, 0x02, 0xaa, 0xbb])
      })
    );
  });

  // Row: Omitted data
  it('sends Lc of zero and no body when data is omitted', async () => {
    const sendApdu = jest.fn<ReturnType<ApduSender>, Parameters<ApduSender>>(
      () => Promise.resolve(okResponse)
    );
    const send = createApduSend(sendApdu);

    await send(0x11, 0x01, 0x00, 0x00);

    expect(sendApdu).toHaveBeenCalledWith(
      expect.objectContaining({
        apdu: new Uint8Array([0x11, 0x01, 0x00, 0x00, 0x00])
      })
    );
  });

  // Row: Concatenates the response
  it('resolves to data followed by the status word', async () => {
    const sendApdu: ApduSender = () =>
      Promise.resolve({
        data: new Uint8Array([0x01, 0x02]),
        statusCode: new Uint8Array([0x90, 0x00])
      });
    const send = createApduSend(sendApdu);

    const result = await send(0x11, 0x01, 0x00, 0x00);

    expect(result).toEqual(Buffer.from([0x01, 0x02, 0x90, 0x00]));
  });

  // Row: Empty response data
  it('resolves to just the status word when data is empty', async () => {
    const sendApdu: ApduSender = () =>
      Promise.resolve({
        data: new Uint8Array([]),
        statusCode: new Uint8Array([0x90, 0x00])
      });
    const send = createApduSend(sendApdu);

    const result = await send(0x11, 0x01, 0x00, 0x00);

    expect(result).toEqual(Buffer.from([0x90, 0x00]));
  });

  // Row: Default status list accepts 0x9000
  it('resolves when the status word is 0x9000 and no statusList is given', async () => {
    const sendApdu: ApduSender = () =>
      Promise.resolve({
        data: new Uint8Array([]),
        statusCode: new Uint8Array([0x90, 0x00])
      });
    const send = createApduSend(sendApdu);

    await expect(send(0x11, 0x01, 0x00, 0x00)).resolves.toBeDefined();
  });

  // Row: Rejects an unlisted status word
  it('rejects with the numeric status when the word is not in the default list', async () => {
    const sendApdu: ApduSender = () =>
      Promise.resolve({
        data: new Uint8Array([]),
        statusCode: new Uint8Array([0x69, 0x86])
      });
    const send = createApduSend(sendApdu);

    const error = await send(0x11, 0x01, 0x00, 0x00).catch(e => e);

    expect(error).toBeInstanceOf(ApduStatusError);
    expect((error as ApduStatusError).statusCode).toBe(0x6986);
  });

  // Row: Honours an explicit status list
  it('resolves for a status word present in an explicit statusList', async () => {
    const sendApdu: ApduSender = () =>
      Promise.resolve({
        data: new Uint8Array([]),
        statusCode: new Uint8Array([0x6e, 0x01])
      });
    const send = createApduSend(sendApdu);

    const result = await send(
      0x11,
      0x01,
      0x00,
      0x00,
      undefined,
      [0x9000, 0x6e01]
    );

    expect(result).toEqual(Buffer.from([0x6e, 0x01]));
  });

  // Row: Data at the limit
  it('frames and sends normally when data.length is exactly 255', async () => {
    const sendApdu = jest.fn<ReturnType<ApduSender>, Parameters<ApduSender>>(
      () => Promise.resolve(okResponse)
    );
    const send = createApduSend(sendApdu);
    const data = Buffer.alloc(255, 0xff);

    await send(0x11, 0x01, 0x00, 0x00, data);

    expect(sendApdu).toHaveBeenCalledWith(
      expect.objectContaining({
        apdu: new Uint8Array([0x11, 0x01, 0x00, 0x00, 255, ...data])
      })
    );
  });

  // Row: Data over the limit
  it('rejects before calling sendApdu when data.length is 256', async () => {
    const sendApdu = jest.fn<ReturnType<ApduSender>, Parameters<ApduSender>>(
      () => Promise.resolve(okResponse)
    );
    const send = createApduSend(sendApdu);
    const data = Buffer.alloc(256, 0xff);

    await expect(send(0x11, 0x01, 0x00, 0x00, data)).rejects.toThrow();
    expect(sendApdu).not.toHaveBeenCalled();
  });

  // Row: Maps the abort timeout
  it('passes abortTimeoutMs through as abortTimeout', async () => {
    const sendApdu = jest.fn<ReturnType<ApduSender>, Parameters<ApduSender>>(
      () => Promise.resolve(okResponse)
    );
    const send = createApduSend(sendApdu);

    await send(0x11, 0x01, 0x00, 0x00, undefined, undefined, {
      abortTimeoutMs: 10000
    });

    expect(sendApdu).toHaveBeenCalledWith(
      expect.objectContaining({ abortTimeout: 10000 })
    );
  });

  // Row: No timeout supplied
  it('omits abortTimeout when options is not supplied', async () => {
    const sendApdu = jest.fn<ReturnType<ApduSender>, Parameters<ApduSender>>(
      () => Promise.resolve(okResponse)
    );
    const send = createApduSend(sendApdu);

    await send(0x11, 0x01, 0x00, 0x00);

    const [callArgs] = sendApdu.mock.calls[0];
    expect(callArgs.abortTimeout).toBeUndefined();
  });

  // Row: DMK rejects
  it('propagates a rejection from sendApdu unchanged', async () => {
    const dmkError = new Error('device disconnected');
    const sendApdu: ApduSender = () => Promise.reject(dmkError);
    const send = createApduSend(sendApdu);

    await expect(send(0x11, 0x01, 0x00, 0x00)).rejects.toBe(dmkError);
  });
});
