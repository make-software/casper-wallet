import { CasperDeploy } from './types';
import {
  getDeployPayment,
  getDeployType,
  getDeployArgs,
  getEntryPoint
} from './deploy';
import { convertBytesToHex } from '@src/libs/crypto/utils';

export function deriveDeployInfoFromDeployRaw(deploy: CasperDeploy) {
  const {
    header: { account, chainName, bodyHash, timestamp, gasPrice }
  } = deploy;

  const payment = getDeployPayment(deploy);
  const deployType = getDeployType(deploy);
  const deployArgs = getDeployArgs(deploy);
  const entryPoint = getEntryPoint(deploy);

  return {
    signingKey: account.toHex(),
    account: account.toHex(),
    deployHash: convertBytesToHex(deploy.hash),
    bodyHash: convertBytesToHex(bodyHash),
    gasPrice: gasPrice.toString(),
    timestamp: timestamp.toString(),
    chainName,
    deployType,
    payment,
    entryPoint,
    deployArgs
  };
}
