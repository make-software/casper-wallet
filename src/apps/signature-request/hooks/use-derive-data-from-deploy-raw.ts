import { CasperDeploy } from '../types';
import {
  getDeployPayment,
  getDeployType,
  parseBytesToString
} from '../deploy-utils';

export function useDeriveDataFromDeployRaw(deploy: CasperDeploy) {
  const { header } = deploy;
  const payment = getDeployPayment(deploy);
  const deployType = getDeployType(deploy);

  return {
    deployHash: parseBytesToString(deploy.hash),
    account: header.account.toHex(),
    bodyHash: parseBytesToString(header.bodyHash),
    chainName: header.chainName,
    timestamp: new Date(header.timestamp).toLocaleString(),
    gasPrice: header.gasPrice.toString(),
    deployType,
    payment,
    // TODO: implement Deploy Arguments parsing
    deployArgs: {}
  };
}
