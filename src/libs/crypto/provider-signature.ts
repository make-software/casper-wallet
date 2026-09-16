import type { ISignTransactionResponse } from 'casper-wallet-core';

import { convertBytesToHex } from './utils';

/**
 * The `signatureHex` the wallet returns to a dapp for `sign` and `signMessage`. Core also hands
 * back `signatureWithPrefix`, carrying a leading key-algorithm byte for on-chain approvals; the
 * provider contract is the raw one — a prefixed signature fails verification on every dapp.
 */
export const toProviderSignatureHex = (
  response: ISignTransactionResponse
): string => convertBytesToHex(response.signature);
