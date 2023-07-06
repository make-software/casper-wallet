import { getAccountHashFromPublicKey } from '@libs/entities/Account';
import { ExtendedDeployClTypeResult } from '@libs/services/account-activity-service';

export const getPublicKeyFormTarget = (
  target?: ExtendedDeployClTypeResult,
  publicKey?: string
) => {
  let toAccountPublicKey = '';

  if (target && target.cl_type === 'PublicKey') {
    // sometimes we receive the public key in uppercase
    toAccountPublicKey = (target.parsed as string).toLowerCase();
  } else {
    if (publicKey && target) {
      const activeAccountHash = getAccountHashFromPublicKey(publicKey);
      toAccountPublicKey =
        activeAccountHash === (target.parsed as string)
          ? publicKey.toLowerCase()
          : (target.parsed as string);
    }
  }

  return toAccountPublicKey.toLowerCase();
};
