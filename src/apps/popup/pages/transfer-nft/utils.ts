import {
  CLKeyParameters,
  CLPublicKey,
  CLValueBuilder,
  DeployUtil,
  Keys,
  RuntimeArgs
} from 'casper-js-sdk';

import {
  NFT_CEP47_PAYMENT_AMOUNT_AVERAGE_MOTES,
  NFT_CEP78_PAYMENT_AMOUNT_AVERAGE_MOTES,
  NetworkName
} from '@src/constants';
import { NFTTokenStandard } from '@src/utils';

import { getDateForDeploy } from '@libs/services/deployer-service';
import { motesToCSPR } from '@libs/ui/utils';

export interface TokenArgs {
  tokenId?: string;
  tokenHash?: string;
}

export type Cep47TransferArgs = {
  target: CLKeyParameters;
  ids: string[];
};

export type TransferArgs = {
  target: CLKeyParameters;
  source: CLKeyParameters;
} & TokenArgs;

export const getDefaultPaymentAmountBasedOnNftTokenStandard = (
  tokenStandard: NFTTokenStandard | ''
) => {
  switch (tokenStandard) {
    case NFTTokenStandard.CEP47:
      return motesToCSPR(NFT_CEP47_PAYMENT_AMOUNT_AVERAGE_MOTES);
    case NFTTokenStandard.CEP78:
      return motesToCSPR(NFT_CEP78_PAYMENT_AMOUNT_AVERAGE_MOTES);
    default:
      return '0';
  }
};

export const getRuntimeArgsForCep78Transfer = (args: TransferArgs) => {
  const runtimeArgs = RuntimeArgs.fromMap({
    target_key: CLValueBuilder.key(args.target),
    source_key: CLValueBuilder.key(args.source)
  });

  if (args.tokenId) {
    runtimeArgs.insert('is_hash_identifier_mode', CLValueBuilder.bool(false));
    runtimeArgs.insert('token_id', CLValueBuilder.u64(args.tokenId));
  }

  if (args.tokenHash) {
    runtimeArgs.insert('is_hash_identifier_mode', CLValueBuilder.bool(true));
    runtimeArgs.insert('token_id', CLValueBuilder.u64(args.tokenHash));
  }

  return runtimeArgs;
};

export const getRuntimeArgsForCep47Transfer = ({
  target,
  ids
}: Cep47TransferArgs) =>
  RuntimeArgs.fromMap({
    recipient: CLValueBuilder.key(target),
    token_ids: CLValueBuilder.list(ids.map(id => CLValueBuilder.u256(id)))
  });

export const getRuntimeArgs = (
  tokenStandard: NFTTokenStandard | '',
  args: TransferArgs
) => {
  switch (tokenStandard) {
    case NFTTokenStandard.CEP47:
      return getRuntimeArgsForCep47Transfer({
        target: args.target,
        ids: [args.tokenId!]
      });
    case NFTTokenStandard.CEP78:
      return getRuntimeArgsForCep78Transfer({
        target: args.target,
        source: args.source,
        tokenId: args.tokenId
      });

    default:
      throw new Error('Unknown token standard.');
  }
};

export const signNftDeploy = async (
  runtimeArgs: RuntimeArgs,
  paymentAmount: string,
  deploySender: CLPublicKey,
  networkName: NetworkName,
  contractPackageHash: string,
  keys: Keys.AsymmetricKey[]
) => {
  const hash = Uint8Array.from(Buffer.from(contractPackageHash, 'hex'));

  const date = await getDateForDeploy();

  const deployParams = new DeployUtil.DeployParams(
    deploySender,
    networkName,
    undefined,
    undefined,
    undefined,
    date // https://github.com/casper-network/casper-node/issues/4152
  );
  const session =
    DeployUtil.ExecutableDeployItem.newStoredVersionContractByHash(
      hash,
      null,
      'transfer',
      runtimeArgs
    );
  const payment = DeployUtil.standardPayment(paymentAmount);
  const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

  return deploy.sign(keys);
};
