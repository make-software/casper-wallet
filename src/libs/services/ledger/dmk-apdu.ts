/**
 * The slice of DMK this adapter needs, injected so the adapter is testable without a device.
 */
export type ApduSender = (args: {
  apdu: Uint8Array;
  abortTimeout?: number;
}) => Promise<{ statusCode: Uint8Array; data: Uint8Array }>;

export class ApduStatusError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number) {
    super(`Unexpected APDU status word: 0x${statusCode.toString(16)}`);
    this.statusCode = statusCode;
  }
}

export const MAX_APDU_DATA_LENGTH = 256;

/**
 * Adapts DMK's `sendApdu` (which splits the response into `statusCode`/`data` and never
 * throws on a bad status word) to the `LedgerTransport.send` shape `@zondax/ledger-casper`
 * expects: header framing, a single concatenated `Buffer`, and a throw on any status word
 * not in `statusList`.
 */
export function createApduSend(sendApdu: ApduSender) {
  return async (
    cla: number,
    ins: number,
    p1: number,
    p2: number,
    data: Buffer = Buffer.alloc(0),
    statusList: number[] = [0x9000],
    options: { abortTimeoutMs?: number } = {}
  ): Promise<Buffer> => {
    if (data.length >= MAX_APDU_DATA_LENGTH) {
      throw new Error(
        `data.length exceed 256 bytes limit. Got: ${data.length}`
      );
    }

    const apdu = new Uint8Array([cla, ins, p1, p2, data.length, ...data]);

    const { statusCode, data: body } = await sendApdu({
      apdu,
      ...(options.abortTimeoutMs === undefined
        ? {}
        : { abortTimeout: options.abortTimeoutMs })
    });

    const sw = (statusCode[0] << 8) | statusCode[1];
    if (!statusList.some(s => s === sw)) {
      throw new ApduStatusError(sw);
    }

    return Buffer.concat([Buffer.from(body), Buffer.from(statusCode)]);
  };
}
