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

  console.log(
    'signedDeploy',
    JSON.stringify(DeployUtil.deployToJson(signedDeploy), null, 2)
  );

  return casperService(url)
    .deploy(signedDeploy)
    .then(function (res) {
      console.log('res', res);
      return res;
    })
    .catch(error => {
      console.log(error);
      throw error;
    });
};
