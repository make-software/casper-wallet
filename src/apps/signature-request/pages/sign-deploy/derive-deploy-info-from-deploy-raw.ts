import { convertBytesToHex } from '@libs/crypto/utils';

import { CasperDeploy } from './deploy-types';
import {
  getContractHash,
  getContractName,
  getDeployArgs,
  getDeployPayment,
  getDeployType,
  getEntryPoint
} from './deploy-utils';

export function deriveDeployInfoFromDeployRaw(deploy: CasperDeploy) {
  const {
    header: { account, chainName, bodyHash, timestamp, gasPrice }
  } = deploy;

  const payment = getDeployPayment(deploy);
  const deployType = getDeployType(deploy);
  const deployArgs = getDeployArgs(deploy);
  const entryPoint = getEntryPoint(deploy);
  const contractHashBytes = getContractHash(deploy);
  const contractName = getContractName(deploy);
  const contractHash = contractHashBytes
    ? convertBytesToHex(contractHashBytes)
    : undefined;

  return {
    account: account.toHex(false),
    deployHash: convertBytesToHex(deploy.hash),
    bodyHash: convertBytesToHex(bodyHash),
    gasPrice: gasPrice.toString(),
    timestamp: timestamp.toString(),
    contractHash,
    contractName,
    chainName,
    deployType,
    payment,
    entryPoint,
    deployArgs
  };
}
