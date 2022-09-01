import { SigningRequest } from './types';

export const transferData: SigningRequest = {
  signingKey: '01f044...6cfg5h3',
  account: '01f044...6cfg5h3',
  deployHash: '01f044...6cfg5h3',
  timestamp: '8/14/2022, 10:51:15 AM',
  chain: 'casper-test',
  payment: '2 500 000 000',
  deployType: 'Transfer Call',
  recipient: '01f044...6cfg5h3',
  amount: '2 500 000 000',
  transferId: '1660491814768'
};

export const contractData: SigningRequest = {
  signingKey: '01f044...6cfg5h3',
  account: '01f044...6cfg5h3',
  deployHash: '01f044...6cfg5h3',
  timestamp: '8/14/2022, 10:51:15 AM',
  chain: 'casper-test',
  payment: '2 500 000 000',
  deployType: 'Contract Call'
};
