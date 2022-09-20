import { CasperDeploy } from './types';
import {
  getDeployPayment,
  getDeployType,
  getDeployArgs,
  bytesToHex
} from './deploy';

export function useDeriveDataFromDeployRaw(deploy: CasperDeploy) {
  const {
    header: { account, chainName, bodyHash, timestamp, gasPrice }
  } = deploy;

  const payment = getDeployPayment(deploy);
  const deployType = getDeployType(deploy);
  const deployArgs = getDeployArgs(deploy);

  return {
    deployHash: bytesToHex(deploy.hash),
    account: account.toHex(),
    bodyHash: bytesToHex(bodyHash),
    gasPrice: gasPrice.toString(),
    timestamp: timestamp.toString(),
    chainName,
    deployType,
    payment,
    deployArgs
  };
}
