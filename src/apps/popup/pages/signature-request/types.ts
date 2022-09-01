export interface SigningRequest {
  signingKey: string;
  account: string;
  deployHash: string;
  timestamp: string;
  chain: string;
  payment: string;
  deployType: 'Transfer Call' | 'Contract Call';
  [key: string]: string;
}
