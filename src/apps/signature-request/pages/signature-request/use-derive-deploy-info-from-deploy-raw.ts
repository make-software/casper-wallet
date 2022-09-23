import { CasperDeploy } from './types';
import {
  getDeployPayment,
  getDeployType,
  getDeployArgs,
  bytesToHex
} from './deploy';

export function useDeriveDeployInfoFromDeployRaw(deploy: CasperDeploy) {
  const {
    header: { account, chainName, bodyHash, timestamp, gasPrice }
  } = deploy;

  const payment = getDeployPayment(deploy);
  const deployType = getDeployType(deploy);
  const deployArgs = getDeployArgs(deploy);

  return {
    signingKey: account.toHex(),
    account: account.toHex(),
    deployHash: bytesToHex(deploy.hash),
    bodyHash: bytesToHex(bodyHash),
    gasPrice: gasPrice.toString(),
    timestamp: timestamp.toString(),
    chainName,
    deployType,
    payment,
    deployArgs
  };
}
