import { CLTypeTypeResult } from '@libs/types/cl';
import { getAccountHashFromPublicKey } from '@libs/entities/Account';

export const getPublicKeyFormTarget = (
  target: {
    cl_type: CLTypeTypeResult;
    parsed: string;
  },
  publicKey?: string
) => {
  let toAccountPublicKey = '';

  if (target.cl_type === 'PublicKey') {
    // sometimes we receive the public key in uppercase
    toAccountPublicKey = target.parsed.toLowerCase();
  } else {
    if (publicKey) {
      const activeAccountHash = getAccountHashFromPublicKey(publicKey);
      toAccountPublicKey =
        activeAccountHash === target.parsed ? publicKey : target.parsed;
    }
  }

  return toAccountPublicKey;
};
