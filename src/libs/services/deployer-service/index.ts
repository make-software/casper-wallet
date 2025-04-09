import {
  Approval,
  Deploy,
  HexBytes,
  HttpHandler,
  PublicKey,
  RpcClient
} from 'casper-js-sdk';
import { isBefore, sub } from 'date-fns';

import {
  AuctionManagerEntryPoint,
  CasperNodeUrl,
  REFERRER_URL,
  STAKE_COST_MOTES
} from '@src/constants';
import { AsymmetricKeys } from '@src/libs/crypto/create-asymmetric-key';

import { Account, HardwareWalletType } from '@libs/types/account';

import { ledger } from '../ledger';

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
  const defaultDate = sub(new Date(), { seconds: 2 });
  const handler = new HttpHandler(nodeUrl, 'fetch');
  handler.setReferrer(REFERRER_URL);
  const rpcClient = new RpcClient(handler);

  try {
    const resp = await rpcClient.getStatus();

    const nodeDate = resp.lastProgress.toDate();

    return isBefore(nodeDate, defaultDate)
      ? defaultDate.toISOString()
      : nodeDate.toISOString();
  } catch {
    return defaultDate.toISOString();
  }
};

export const signLedgerDeploy = async (
  deploy: Deploy,
  activeAccount: Account
) => {
  const resp = await ledger.singDeploy(deploy, {
    index: activeAccount.derivationIndex,
    publicKey: activeAccount.publicKey
  });

  const approval = new Approval(
    PublicKey.fromHex(activeAccount.publicKey),
    HexBytes.fromHex(resp.prefixedSignatureHex)
  );
  deploy.approvals.push(approval);

  return deploy;
};

export const signDeploy = async (
  deploy: Deploy,
  keys: AsymmetricKeys,
  activeAccount: Account
) => {
  if (activeAccount?.hardware === HardwareWalletType.Ledger) {
    return signLedgerDeploy(deploy, activeAccount);
  }

  if (!keys.secretKey) {
    throw new Error('Missing secret key');
  }

  deploy.sign(keys.secretKey);

  return deploy;
};

export const sendSignDeploy = async (
  deploy: Deploy,
  nodeUrl: CasperNodeUrl
): Promise<
  ICasperNetworkSendDeployResponse | ICasperNetworkSendDeployErrorResponse
> => {
  const oneMegaByte = 1048576;
  const size = deploy.toBytes().length;

  if (size > oneMegaByte) {
    throw new Error(
      `Deploy can not be send, because it's too large: ${size} bytes. Max size is 1 megabyte.`
    );
  }

  return fetch(nodeUrl, {
    // TODO change to rpc usage
    method: 'POST',
    referrer: REFERRER_URL,
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'account_put_deploy',
      params: [Deploy.toJSON(deploy)],
      id: new Date().getTime()
    })
  }).then(toJson);
};
