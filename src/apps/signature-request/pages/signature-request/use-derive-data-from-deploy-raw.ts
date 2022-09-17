import { CasperDeploy } from './types';
import { getDeployPayment, getDeployType, bytesToHex } from './deploy';

export function useDeriveDataFromDeployRaw(deploy: CasperDeploy) {
  const { header } = deploy;
  const payment = getDeployPayment(deploy);
  const deployType = getDeployType(deploy);

  return {
    deployHash: bytesToHex(deploy.hash),
    account: header.account.toHex(),
    bodyHash: bytesToHex(header.bodyHash),
    chainName: header.chainName,
    timestamp: new Date(header.timestamp).toLocaleString(),
    gasPrice: header.gasPrice.toString(),
    deployType,
    payment,
    // TODO: implement Deploy Arguments parsing
    deployArgs: {}
  };
}
