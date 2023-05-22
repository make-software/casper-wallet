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
    toAccountPublicKey = target.parsed;
  } else {
    if (publicKey) {
      const activeAccountHash = getAccountHashFromPublicKey(publicKey);
      toAccountPublicKey =
        activeAccountHash === target.parsed ? publicKey : target.parsed;
    }
  }

  return toAccountPublicKey;
};
