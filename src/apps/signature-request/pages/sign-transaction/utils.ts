import { TxCommonDetailsKeys } from './signature-request-content';

export const mapTxKeyToLabel: Record<TxCommonDetailsKeys, string> = {
  expires: 'Expires',
  fee: 'Transaction fee',
  memo: 'Transaction ID',
  network: 'Network',
  sender: 'Sender',
  txHash: 'Transaction hash'
};
