import type { ISignTransactionResponse } from 'casper-wallet-core';

import { convertBytesToHex } from './utils';

/**
 * The `signatureHex` the wallet returns to a dapp for `sign` and `signMessage`.
 *
 * Core hands back two signatures of the same type over the same bytes: `signature`, and
 * `signatureWithPrefix`, which carries a leading key-algorithm byte for on-chain approvals. The
 * provider contract is the raw one — a prefixed signature fails verification on every dapp.
 */
export const toProviderSignatureHex = (
  response: ISignTransactionResponse
): string => convertBytesToHex(response.signature);
