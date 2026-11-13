import {
  IEIP712SignTypedDataOptions,
  IEIP712TypedData
} from 'casper-wallet-core';

export interface Eip712Payload {
  typedData?: IEIP712TypedData;
  options?: IEIP712SignTypedDataOptions;
  isInvalidPayload?: boolean;
}

/**
 * Parses the stored `signTypedData` payload. `rejectUnknownFields` is always forced on: it is
 * wallet policy, so a dapp cannot opt out of rejecting fields its types do not declare.
 */
export function parseEip712Payload(raw: string | undefined): Eip712Payload {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...parsed,
      options: { ...parsed.options, rejectUnknownFields: true }
    };
  } catch {
    return { isInvalidPayload: true };
  }
}
