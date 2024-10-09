import { CEP18Client } from 'casper-cep18-js-client';
import {
  CLPublicKey,
  CLValueBuilder,
  DeployUtil,
  Keys,
  RuntimeArgs,
  decodeBase16
} from 'casper-js-sdk';
import { sub } from 'date-fns';

import {
  AuctionManagerEntryPoint,
  CasperNodeUrl,
  NetworkName,
  REFERRER_URL,
  STAKE_COST_MOTES,
  TRANSFER_COST_MOTES
} from '@src/constants';

import { getRawPublicKey } from '@libs/entities/Account';
import { toJson } from '@libs/services/utils';
import {
  Account,
  AccountWithBalance,
  HardwareWalletType
} from '@libs/types/account';
import { CSPRtoMotes, multiplyErc20Balance } from '@libs/ui/utils';

import { ledger } from '../ledger';
import {
  ICasperNetworkSendDeployErrorResponse,
  ICasperNetworkSendDeployResponse,
  ICasperNodeStatusResponse
} from './types';

export const getAuctionManagerDeployCost = (
  entryPoint: AuctionManagerEntryPoint
) => {
  switch (entryPoint) {
    case AuctionManagerEntryPoint.delegate:
    case AuctionManagerEntryPoint.undelegate:
    case AuctionManagerEntryPoint.redelegate:
      return STAKE_COST_MOTES;

    default:
      throw Error('getAuctionManagerDeployCost: unknown entry point');
  }
};

export const getDateForDeploy = async (nodeUrl: CasperNodeUrl) => {
  const defaultDate = sub(new Date(), { seconds: 2 }).getTime();

  try {
    const casperNodeTimestamp: ICasperNodeStatusResponse = await fetch(
      `${nodeUrl}/info_get_status`,
      {
        referrer: REFERRER_URL
      }
    ).then(toJson);

    return casperNodeTimestamp?.last_progress
      ? new Date(casperNodeTimestamp?.last_progress).getTime()
      : defaultDate;
  } catch {
    return defaultDate;
  }
};

export const makeAuctionManagerDeploy = async (
  contractEntryPoint: AuctionManagerEntryPoint,
  delegatorPublicKeyHex: string,
  validatorPublicKeyHex: string,
  redelegateValidatorPublicKeyHex: string | null,
  amountMotes: string,
  networkName: NetworkName,
  auctionManagerContractHash: string,
  nodeUrl: CasperNodeUrl
) => {
  const hash = decodeBase16(auctionManagerContractHash);

  const delegatorPublicKey = getRawPublicKey(delegatorPublicKeyHex);
  const validatorPublicKey = getRawPublicKey(validatorPublicKeyHex);
  const newValidatorPublicKey =
    redelegateValidatorPublicKeyHex &&
    getRawPublicKey(redelegateValidatorPublicKeyHex);

  const runtimeArgs = RuntimeArgs.fromMap({
    validator: validatorPublicKey,
    delegator: delegatorPublicKey,
    amount: CLValueBuilder.u512(amountMotes),
    ...(newValidatorPublicKey && {
      new_validator: newValidatorPublicKey
    })
  });

  const date = await getDateForDeploy(nodeUrl);

  const deployParams = new DeployUtil.DeployParams(
    delegatorPublicKey,
    networkName,
    undefined,
    undefined,
    undefined,
    date // https://github.com/casper-network/casper-node/issues/4152
  );

  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    hash,
    contractEntryPoint,
    runtimeArgs
  );

  const deployCost = getAuctionManagerDeployCost(contractEntryPoint);

  const payment = DeployUtil.standardPayment(deployCost);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

export const makeNativeTransferDeploy = async (
  activeAccount: AccountWithBalance,
  recipientPublicKeyHex: string,
  amountMotes: string,
  networkName: NetworkName,
  nodeUrl: CasperNodeUrl,
  transferIdMemo?: string
) => {
  const senderPublicKey = CLPublicKey.fromHex(activeAccount.publicKey);
  const recipientPublicKey = CLPublicKey.fromHex(recipientPublicKeyHex);

  const date = await getDateForDeploy(nodeUrl);

  const deployParams = new DeployUtil.DeployParams(
    senderPublicKey,
    networkName,
    undefined,
    undefined,
    undefined,
    date // https://github.com/casper-network/casper-node/issues/4152
  );

  const session =
    DeployUtil.ExecutableDeployItem.newTransferWithOptionalTransferId(
      amountMotes,
      recipientPublicKey,
      undefined,
      transferIdMemo || undefined
    );

  const payment = DeployUtil.standardPayment(TRANSFER_COST_MOTES);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

export const makeCep18TransferDeploy = async (
  nodeUrl: CasperNodeUrl,
  networkName: NetworkName,
  tokenContractHash: string | undefined,
  tokenContractPackageHash: string | undefined,
  recipientPublicKey: string,
  amount: string,
  erc20Decimals: number | null,
  paymentAmount: string,
  activeAccount: Account
) => {
  const cep18 = new CEP18Client(nodeUrl, networkName);

  const date = await getDateForDeploy(nodeUrl);

  cep18.setContractHash(
    `hash-${tokenContractHash}`,
    `hash-${tokenContractPackageHash}`
  );

  // create deploy
  const tempDeploy = cep18.transfer(
    {
      recipient: getRawPublicKey(recipientPublicKey),
      amount: multiplyErc20Balance(amount, erc20Decimals) || '0'
    },
    CSPRtoMotes(paymentAmount),
    getRawPublicKey(activeAccount.publicKey),
    networkName
  );

  const deployParams = new DeployUtil.DeployParams(
    getRawPublicKey(activeAccount.publicKey),
    networkName,
    undefined,
    undefined,
    undefined,
    date // https://github.com/casper-network/casper-node/issues/4152
  );

  return DeployUtil.makeDeploy(
    deployParams,
    tempDeploy.session,
    tempDeploy.payment
  );
};

export const makeNFTDeploy = async (
  runtimeArgs: RuntimeArgs,
  paymentAmount: string,
  deploySender: CLPublicKey,
  networkName: NetworkName,
  contractPackageHash: string,
  nodeUrl: CasperNodeUrl
) => {
  const hash = Uint8Array.from(Buffer.from(contractPackageHash, 'hex'));

  const date = await getDateForDeploy(nodeUrl);

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

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

export const signLedgerDeploy = async (
  deploy: DeployUtil.Deploy,
  activeAccount: Account
) => {
  const resp = await ledger.singDeploy(deploy, {
    index: activeAccount.derivationIndex,
    publicKey: activeAccount.publicKey
  });

  const approval = new DeployUtil.Approval();
  approval.signer = activeAccount.publicKey;
  approval.signature = resp.signatureHex;
  deploy.approvals.push(approval);

  return deploy;
};

export const signDeploy = (
  deploy: DeployUtil.Deploy,
  keys: Keys.AsymmetricKey[],
  activeAccount: Account
) => {
  if (activeAccount?.hardware === HardwareWalletType.Ledger) {
    return signLedgerDeploy(deploy, activeAccount);
  }

  return deploy.sign(keys);
};

export const sendSignDeploy = (
  deploy: DeployUtil.Deploy,
  nodeUrl: CasperNodeUrl
): Promise<
  ICasperNetworkSendDeployResponse | ICasperNetworkSendDeployErrorResponse
> => {
  const oneMegaByte = 1048576;
  const size = DeployUtil.deploySizeInBytes(deploy);

  if (size > oneMegaByte) {
    throw new Error(
      `Deploy can not be send, because it's too large: ${size} bytes. Max size is 1 megabyte.`
    );
  }

  return fetch(nodeUrl, {
    method: 'POST',
    referrer: REFERRER_URL,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'account_put_deploy',
      params: [DeployUtil.deployToJson(deploy).deploy],
      id: new Date().getTime()
    })
  }).then(toJson);
};
