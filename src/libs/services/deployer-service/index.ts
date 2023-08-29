import { CasperServiceByJsonRPC, CLPublicKey, DeployUtil } from 'casper-js-sdk';

import { signDeploy } from '@libs/crypto';
import { GrpcUrl } from '@src/constants';

import { RPCResponse } from './types';

const casperService = (url: string) => new CasperServiceByJsonRPC(url);

export const signAndDeploy = (
  deploy: DeployUtil.Deploy,
  senderPublicKeyHex: string,
  senderSecretKeyHex: string,
  url: GrpcUrl
): Promise<RPCResponse> => {
  const signature = signDeploy(
    deploy.hash,
    senderPublicKeyHex,
    senderSecretKeyHex
  );

  const signedDeploy = DeployUtil.setSignature(
    deploy,
    signature,
    CLPublicKey.fromHex(senderPublicKeyHex)
  );
  // TODO: this request failed due to the CORS policy in FF
  return casperService(url)
    .deploy(signedDeploy)
    .then(function (res) {
      return res;
    })
    .catch(error => {
      throw error;
    });
};
