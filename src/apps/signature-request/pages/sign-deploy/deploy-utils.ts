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

import { ArgDict, CasperDeploy, DeployType } from './deploy-types';

export function getDeployType(deploy: CasperDeploy): DeployType {
  if (deploy.isTransfer()) {
    return DeployType.TransferCall;
  }

  if (deploy.isStandardPayment()) {
    return DeployType.ContractCall;
  }

  return DeployType.Unknown;
}

export function getDeployPayment(deploy: CasperDeploy): string {
  const arg = deploy.payment.moduleBytes?.getArgByName('amount');
  if (arg != null) {
    return arg.value().toString();
  } else {
    return 'N/A';
  }
}

export function getEntryPoint(deploy: CasperDeploy): string | undefined {
  const storedContractObj = getStoredContractObjFromSession(deploy.session);
  return storedContractObj?.entryPoint;
}

export function getDeployArgs(deploy: CasperDeploy): ArgDict {
  if (deploy.session.transfer) {
    return getDeployArgsForTransfer(deploy.session.transfer);
  }

  const storedContractObj = getStoredContractObjFromSession(deploy.session);

  const deployArgs: ArgDict =
    storedContractObj != null
      ? getDeployArgsFromArgsDict(storedContractObj.args.args)
      : {};

  return deployArgs;
}

function unwrapNestedLists(value: CLValue): string {
  const parsedValue = parseDeployArgValue(value);
  if (Array.isArray(parsedValue)) {
    const parsedType = (value as CLList<CLValue>).vectorType;
    return `<${parsedType}>[...]`;
  }
  return parsedValue;
}

function getDeployArgsForTransfer(
  transferDeploy: DeployUtil.Transfer
): ArgDict {
  const args: ArgDict = {};
  const targetFromDeploy = transferDeploy.getArgByName('target');

  if (targetFromDeploy == null) {
    throw new Error("Couldn't find 'target' in transfer data");
  }

  switch (targetFromDeploy.clType().tag) {
    case CLTypeTag.ByteArray:
      args.recipientHash = encodeBase16(targetFromDeploy.value());
      break;
    // If deploy is created using version of SDK gte than 2.7.0
    // In fact this logic can be removed in future as well as pkHex param
    case CLTypeTag.PublicKey:
      args.recipientKey = (targetFromDeploy as CLPublicKey).toHex();
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

  args.amount = amountString.value().toString();
  args.transferId = idString.value().unwrap().value().toString();

  return args;
}

function getStoredContractObjFromSession(
  session: DeployUtil.ExecutableDeployItem
):
  | DeployUtil.StoredContractByHash
  | DeployUtil.StoredContractByName
  | DeployUtil.StoredVersionedContractByHash
  | DeployUtil.StoredVersionedContractByName
  | undefined {
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

  return undefined;
}

function getDeployArgsFromArgsDict(args: Map<string, CLValue>) {
  const deployArgs: ArgDict = {};

  args.forEach((value, key) => {
    deployArgs[key] = value;
  });

  return deployArgs;
}

export function isDeployArgValueHash(value: CLValue): boolean {
  const tag = value.clType().tag;
  switch (tag) {
    case CLTypeTag.Key:
    case CLTypeTag.URef:
    case CLTypeTag.PublicKey:
      return true;

    default:
      return false;
  }
}

export function isDeployArgValueNumber(value: CLValue): boolean {
  const tag = value.clType().tag;
  switch (tag) {
    case CLTypeTag.U8:
    case CLTypeTag.U32:
    case CLTypeTag.U64:
    case CLTypeTag.U128:
    case CLTypeTag.U256:
    case CLTypeTag.U512:
      return true;

    default:
      return false;
  }
}

export function parseDeployArgValue(value: CLValue): string | string[] {
  const tag = value.clType().tag;

  switch (tag) {
    case CLTypeTag.Unit:
      return String('CLValue Unit');

    case CLTypeTag.Key:
      const key = value as CLKey;
      if (key.isAccount()) {
        return parseDeployArgValue(key.value() as CLAccountHash);
      }

      if (key.isURef()) {
        return parseDeployArgValue(key.value() as CLURef);
      }

      if (key.isHash()) {
        return parseDeployArgValue(key.value() as CLByteArray);
      }

      throw new Error('Failed to parse key argument');

    case CLTypeTag.URef:
      return (value as CLURef).toFormattedStr();

    case CLTypeTag.Option:
      const option = value as CLOption<CLValue>;
      if (option.isSome()) {
        return parseDeployArgValue(option.value().unwrap());
      }
      // This will be None due to the above logic
      const optionValue = option.value().toString();
      // This will be the inner CLType of the CLOption e.g. '(bool)'
      const optionCLType = option.clType().toString().split(' ')[1];
      // The format ends up looking like `None (bool)`
      return `${optionValue} ${optionCLType}`;

    case CLTypeTag.List:
      const list = (value as CLList<CLValue>).value();
      return list.map(member => unwrapNestedLists(member));

    case CLTypeTag.ByteArray:
      const bytes = (value as CLByteArray).value();
      return encodeBase16(bytes);

    case CLTypeTag.Result:
      const result = value as CLResult<CLType, CLType>;
      const status = result.isOk() ? 'OK:' : 'ERR:';
      const parsed = parseDeployArgValue(result.value().val);
      return `${status} ${parsed}`;

    case CLTypeTag.Map:
      const map = value as CLMap<CLValue, CLValue>;
      return map.value().toString();

    case CLTypeTag.Tuple1:
      const tupleOne = value as CLTuple1;
      return parseDeployArgValue(tupleOne.value()[0]);

    case CLTypeTag.Tuple2:
      const tupleTwo = value as CLTuple2;
      return tupleTwo.value().map(member => unwrapNestedLists(member));

    case CLTypeTag.Tuple3:
      const tupleThree = value as CLTuple3;
      return tupleThree.value().map(member => unwrapNestedLists(member));

    case CLTypeTag.PublicKey:
      return (value as CLPublicKey).toHex();

    default:
      // Special handling as there is no CLTypeTag for CLAccountHash
      if (value instanceof CLAccountHash) {
        return encodeBase16(value.value());
      }
      return value.value().toString();
  }
}
