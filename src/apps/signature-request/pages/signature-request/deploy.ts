import { encodeBase16 } from 'casper-js-sdk';
import { CasperDeploy, DeployType } from './types';

export function getDeployType(deploy: CasperDeploy): DeployType {
  if (deploy.isTransfer()) {
    return 'Transfer Call';
  }

  if (
    deploy.session.isStoredContractByHash() ||
    deploy.session.isStoredContractByName()
  ) {
    return 'Contract Call';
  }

  throw new Error('getDeployType failed');
}

export function getDeployPayment(deploy: CasperDeploy): string {
  const arg = deploy.payment.moduleBytes?.getArgByName('amount');
  if (arg != null) {
    return arg.value().toString();
  }

  throw new Error('getDeployPayment failed');
}

export function bytesToHex(bytes: Uint8Array): string {
  return encodeBase16(bytes);
}
