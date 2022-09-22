import {
  CLAccountHash,
  CLByteArray,
  CLKey,
  CLList,
  CLMap,
  CLOption,
  CLPublicKey,
  CLResult,
  CLTuple1,
  CLTuple2,
  CLTuple3,
  CLType,
  CLTypeTag,
  CLURef,
  CLValue,
  DeployUtil,
  encodeBase16
} from 'casper-js-sdk';

import { snakeAndKebabToCamel } from '@libs/ui/utils/formatters';
import { ArgDict, CasperDeploy, DeployType } from './types';

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

export function getDeployArgs(deploy: CasperDeploy) {
  if (deploy.session.transfer) {
    return parseTransferData(deploy.session.transfer);
  }

  if (deploy.session.moduleBytes) {
    try {
      const deployArgs: ArgDict = parseDeployArgs(
        deploy.session.moduleBytes.args.args
      );
      deployArgs.moduleBytes =
        deploy.session.moduleBytes.moduleBytes.toString();

      return deployArgs;
    } catch (err) {
      throw err;
    }
  }

  const storedContract = getStoredContractFromSession(deploy.session);

  try {
    const deployArgs: ArgDict = parseDeployArgs(storedContract.args.args);
    deployArgs.entryPoint = storedContract.entryPoint;

    return deployArgs;
  } catch (err) {
    throw err;
  }
}

function sanitiseNestedLists(value: CLValue): string {
  const parsedValue = parseDeployArg(value);
  if (Array.isArray(parsedValue)) {
    const parsedType = (value as CLList<CLValue>).vectorType;
    return `<${parsedType}>[...]`;
  }
  return parsedValue;
}

function parseTransferData(transferDeploy: DeployUtil.Transfer) {
  const transferArgs: ArgDict = {};
  const targetFromDeploy = transferDeploy.getArgByName('target');

  if (targetFromDeploy == null) {
    throw new Error("Couldn't find 'target' in transfer data");
  }

  switch (targetFromDeploy.clType().tag) {
    case CLTypeTag.ByteArray:
      transferArgs.recipientHash = encodeBase16(targetFromDeploy.value());
      break;
    // If deploy is created using version of SDK gte than 2.7.0
    // In fact this logic can be removed in future as well as pkHex param
    case CLTypeTag.PublicKey:
      transferArgs.recipientKey = (targetFromDeploy as CLPublicKey).toHex();
      break;
    default: {
      throw new Error(
        'Target from deploy was neither AccountHash or PublicKey'
      );
    }
  }

  const amountString = transferDeploy.getArgByName('amount');
  if (amountString == null) {
    throw new Error("Couldn't find 'amount' in transfer data");
  }
  const idString = transferDeploy.getArgByName('id');
  if (idString == null) {
    throw new Error("Couldn't find 'id' in transfer data");
  }

  transferArgs.amount = amountString.value().toString();
  transferArgs.transferId = idString.value().unwrap().value().toString();

  return transferArgs;
}

function getStoredContractFromSession(
  session: DeployUtil.ExecutableDeployItem
):
  | DeployUtil.StoredContractByHash
  | DeployUtil.StoredContractByName
  | DeployUtil.StoredVersionedContractByHash
  | DeployUtil.StoredVersionedContractByName {
  if (session.storedContractByHash) {
    return session.storedContractByHash;
  }

  if (session.storedContractByName) {
    return session.storedContractByName;
  }

  if (session.storedVersionedContractByHash) {
    return session.storedVersionedContractByHash;
  }

  if (session.storedVersionedContractByName) {
    return session.storedVersionedContractByName;
  }

  throw new Error(`Stored Contract could not be parsed.\n\
          Provided session code: ${session}`);
}

function parseDeployArgs(args: Map<string, CLValue>) {
  const deployArgs: ArgDict = {};

  args.forEach((argument, key) => {
    deployArgs[snakeAndKebabToCamel(key)] = parseDeployArg(argument);
  });

  return deployArgs;
}

function parseDeployArg(arg: CLValue): string | string[] {
  const tag = arg.clType().tag;

  switch (tag) {
    case CLTypeTag.Unit:
      return String('CLValue Unit');

    case CLTypeTag.Key:
      const key = arg as CLKey;
      if (key.isAccount()) {
        return parseDeployArg(key.value() as CLAccountHash);
      }

      if (key.isURef()) {
        return parseDeployArg(key.value() as CLURef);
      }

      if (key.isHash()) {
        return parseDeployArg(key.value() as CLByteArray);
      }

      throw new Error('Failed to parse key argument');

    case CLTypeTag.URef:
      return (arg as CLURef).toFormattedStr();

    case CLTypeTag.Option:
      const option = arg as CLOption<CLValue>;
      if (option.isSome()) {
        return parseDeployArg(option.value().unwrap());
      }
      // This will be None due to the above logic
      const optionValue = option.value().toString();
      // This will be the inner CLType of the CLOption e.g. '(bool)'
      const optionCLType = option.clType().toString().split(' ')[1];
      // The format ends up looking like `None (bool)`
      return `${optionValue} ${optionCLType}`;

    case CLTypeTag.List:
      const list = (arg as CLList<CLValue>).value();
      return list.map(member => sanitiseNestedLists(member));

    case CLTypeTag.ByteArray:
      const bytes = (arg as CLByteArray).value();
      return bytesToHex(bytes);

    case CLTypeTag.Result:
      const result = arg as CLResult<CLType, CLType>;
      const status = result.isOk() ? 'OK:' : 'ERR:';
      const parsed = parseDeployArg(result.value().val);
      return `${status} ${parsed}`;

    case CLTypeTag.Map:
      const map = arg as CLMap<CLValue, CLValue>;
      return map.value().toString();

    case CLTypeTag.Tuple1:
      const tupleOne = arg as CLTuple1;
      return parseDeployArg(tupleOne.value()[0]);

    case CLTypeTag.Tuple2:
      const tupleTwo = arg as CLTuple2;
      return tupleTwo.value().map(member => sanitiseNestedLists(member));

    case CLTypeTag.Tuple3:
      const tupleThree = arg as CLTuple3;
      return tupleThree.value().map(member => sanitiseNestedLists(member));

    case CLTypeTag.PublicKey:
      return (arg as CLPublicKey).toHex();

    default:
      // Special handling as there is no CLTypeTag for CLAccountHash
      if (arg instanceof CLAccountHash) {
        return bytesToHex(arg.value());
      }
      return arg.value().toString();
  }
}
