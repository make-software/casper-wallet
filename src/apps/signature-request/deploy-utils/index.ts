import { encodeBase16 } from 'casper-js-sdk';
import { CasperDeploy } from '../types';

export function getDeployType(deploy: CasperDeploy) {
  if (deploy.isTransfer()) {
    return 'Transfer Call';
  }

  if (
    deploy.session.isStoredContractByHash() ||
    deploy.session.isStoredContractByName()
  ) {
    return 'Contract Call';
  }

  throw new Error('Unknown deploy type');
}

export function getDeployPayment(deploy: CasperDeploy) {
  const arg = deploy.payment.moduleBytes?.getArgByName('amount');

  if (arg == null) {
    throw new Error("Can't acquire payment amount from deploy");
  }

  return arg.value().toString();
}

export function parseBytesToString(bytes: Uint8Array): string {
  return encodeBase16(bytes);
}
