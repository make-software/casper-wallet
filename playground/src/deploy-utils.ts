import {
  CLPublicKey,
  CLValueBuilder,
  decodeBase16,
  DeployUtil,
  RuntimeArgs
} from 'casper-js-sdk';

const config = {
  network_name: 'casper-test',
  auction_manager_contract_hash:
    '93d923e336b20a4c4ca14d592b60e5bd3fe330775618290104f9beb326db7ae2',
  delegate_cost: '2500000000', // in motes
  undelegate_cost: '10000', // in motes
  redelegate_cost: '10000', // in motes
  transfer_cost: '100000000' // in motes
};

export enum AuctionManagerEntryPoint {
  delegate = 'delegate',
  undelegate = 'undelegate',
  redelegate = 'redelegate'
}

const getAuctionManagerDeployCost = (entryPoint: AuctionManagerEntryPoint) => {
  switch (entryPoint) {
    case AuctionManagerEntryPoint.delegate:
      return config.delegate_cost;
    case AuctionManagerEntryPoint.undelegate:
      return config.undelegate_cost;
    case AuctionManagerEntryPoint.redelegate:
      return config.redelegate_cost;

    default:
      throw Error('getAuctionManagerDeployCost: unknown entry point');
  }
};

export const makeAuctionManagerDeploy = (
  contractEntryPoint: AuctionManagerEntryPoint,
  delegatorPublicKeyHex: string,
  validatorPublicKeyHex: string,
  redelegateValidatorPublicKeyHex: string | null,
  amountMotes: string
) => {
  const delegatorPublicKey = CLPublicKey.fromHex(delegatorPublicKeyHex);
  const validatorPublicKey = CLPublicKey.fromHex(validatorPublicKeyHex);
  const newValidatorPublicKey =
    redelegateValidatorPublicKeyHex &&
    CLPublicKey.fromHex(redelegateValidatorPublicKeyHex);

  const deployParams = new DeployUtil.DeployParams(
    delegatorPublicKey,
    config.network_name
  );

  const args = RuntimeArgs.fromMap({
    delegator: delegatorPublicKey,
    validator: validatorPublicKey,
    amount: CLValueBuilder.u512(amountMotes),
    ...(newValidatorPublicKey && {
      new_validator: newValidatorPublicKey
    })
  });

  const session = DeployUtil.ExecutableDeployItem.newStoredContractByHash(
    decodeBase16(config.auction_manager_contract_hash),
    contractEntryPoint,
    args
  );

  const deployCost = getAuctionManagerDeployCost(contractEntryPoint);

  const payment = DeployUtil.standardPayment(deployCost);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};

export const makeNativeTransferDeploy = (
  senderPublicKeyHex: string,
  recipientPublicKeyHex: string,
  amountMotes: string,
  transferIdMemo: string
) => {
  const senderPublicKey = CLPublicKey.fromHex(senderPublicKeyHex);
  const recipientPublicKey = CLPublicKey.fromHex(recipientPublicKeyHex);

  const deployParams = new DeployUtil.DeployParams(
    senderPublicKey,
    config.network_name
  );

  const session = DeployUtil.ExecutableDeployItem.newTransfer(
    amountMotes,
    recipientPublicKey,
    undefined,
    transferIdMemo
  );

  const payment = DeployUtil.standardPayment(config.transfer_cost);

  return DeployUtil.makeDeploy(deployParams, session, payment);
};
