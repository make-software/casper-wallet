import {
  CLValue,
  Conversions,
  ExecutableDeployItem,
  ModuleBytes,
  StoredContractByHash,
  StoredContractByName,
  StoredVersionedContractByHash,
  StoredVersionedContractByName,
  TransferDeployItem,
  TypeID
} from 'casper-js-sdk';

import {
  ArgDict,
  CasperDeploy,
  DeployType,
  ParsedDeployArgValue,
  ParsedValueType,
  SignatureRequestKeys
} from './deploy-types';

export function getDeployType(deploy: CasperDeploy): DeployType {
  if (deploy?.session?.isModuleBytes()) {
    return DeployType.ModuleBytes;
  }

  if (deploy.isTransfer()) {
    return DeployType.TransferCall;
  }

  if (deploy.isStandardPayment()) {
    return DeployType.ContractCall;
  }

  return DeployType.Unknown;
}

export function getDeployPayment(deploy: CasperDeploy): string {
  const arg = deploy.payment.moduleBytes?.args.getByName('amount');
  if (arg) {
    return arg.toString();
  } else {
    return 'N/A';
  }
}

export function getEntryPoint(deploy: CasperDeploy): string | undefined {
  const storedContractObj = getStoredContractObjFromSession(deploy.session);

  return storedContractObj instanceof ModuleBytes
    ? undefined
    : storedContractObj?.entryPoint;
}

export const getContractHash = (deploy: CasperDeploy) => {
  const storedContractObj = getStoredContractObjFromSession(deploy.session);

  return storedContractObj instanceof StoredContractByHash ||
    storedContractObj instanceof StoredVersionedContractByHash
    ? storedContractObj.hash
    : undefined;
};

export const getContractName = (deploy: CasperDeploy) => {
  const storedContractObj = getStoredContractObjFromSession(deploy.session);

  return storedContractObj instanceof StoredContractByName ||
    storedContractObj instanceof StoredVersionedContractByName
    ? storedContractObj.name
    : undefined;
};

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

function unwrapNestedLists(value: CLValue): ParsedDeployArgValue {
  const parsedValue = parseDeployArgValue(value);

  if (Array.isArray(parsedValue)) {
    const parsedType = value.list?.type;

    return { parsedValue: `<${parsedType}>[...]` };
  }

  return parsedValue;
}

function getDeployArgsForTransfer(transferDeploy: TransferDeployItem): ArgDict {
  const args: ArgDict = {};
  const targetFromDeploy = transferDeploy.args.getByName('target');

  if (!targetFromDeploy) {
    throw new Error("Couldn't find 'target' in transfer data");
  }

  switch (targetFromDeploy.type.getTypeID()) {
    case TypeID.ByteArray:
      args.recipientHash = Conversions.encodeBase16(targetFromDeploy.bytes());
      break;
    // If deploy is created using version of SDK gte than 2.7.0
    // In fact this logic can be removed in future as well as pkHex param
    case TypeID.PublicKey:
      if (targetFromDeploy.publicKey) {
        args.recipientKey = targetFromDeploy.publicKey.toHex();
      }
      break;
    default: {
      throw new Error(
        'Target from deploy was neither AccountHash or PublicKey'
      );
    }
  }

  const amountString = transferDeploy.args.getByName('amount');

  if (!amountString) {
    throw new Error("Couldn't find 'amount' in transfer data");
  }

  const idString = transferDeploy.args.getByName('id');

  if (!idString) {
    throw new Error("Couldn't find 'id' in transfer data");
  }

  args.amount = amountString.toString();
  args.transferId = idString.toString();

  return args;
}

function getStoredContractObjFromSession(
  session: ExecutableDeployItem
):
  | StoredContractByHash
  | StoredContractByName
  | StoredVersionedContractByHash
  | StoredVersionedContractByName
  | ModuleBytes
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

  if (session.moduleBytes) {
    return session.moduleBytes;
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
  const tag = value.type.getTypeID();

  switch (tag) {
    case TypeID.Key:
    case TypeID.URef:
    case TypeID.PublicKey:
      return true;

    default:
      return false;
  }
}

export function isDeployArgValueNumber(value: CLValue): boolean {
  const tag = value.type.getTypeID();

  switch (tag) {
    case TypeID.U8:
    case TypeID.U32:
    case TypeID.U64:
    case TypeID.U128:
    case TypeID.U256:
    case TypeID.U512:
      return true;

    default:
      return false;
  }
}

export function parseDeployArgValue(
  value: CLValue
): ParsedDeployArgValue | ParsedDeployArgValue[] {
  const tag = value.type.getTypeID();

  switch (tag) {
    case TypeID.Unit:
      return { parsedValue: String('CLValue Unit') };

    case TypeID.Key:
      const key = value.key;

      if (key?.account) {
        return { parsedValue: key.account?.toHex() ?? '' };
      }

      if (key?.hash) {
        return { parsedValue: key.hash?.toHex() ?? '' };
      }

      if (key?.uRef) {
        return parseDeployArgValue(CLValue.newCLUref(key.uRef));
      }

      // if (key?.bytes()) {
      //   return parseDeployArgValue(key.value() as CLByteArray);
      // }

      throw new Error('Failed to parse key argument');

    case TypeID.URef:
      return { parsedValue: value.uref?.toPrefixedString() ?? '' };

    case TypeID.Option:
      const option = value.option;

      if (option && !option?.isEmpty()) {
        return parseDeployArgValue(CLValue.newCLOption(option.value()));
      }
      // This will be None due to the above logic
      const optionValue = option?.toString();
      // This will be the inner CLType of the CLOption e.g. '(bool)'
      const optionCLType = option?.type?.toString().split(' ')[1];
      // The format ends up looking like `None (bool)`
      return { parsedValue: `${optionValue} ${optionCLType}` };

    case TypeID.List:
      const list = value.list;

      return list?.elements?.map(member => unwrapNestedLists(member)) ?? [];

    case TypeID.ByteArray:
      const bytes = value.byteArray;
      return {
        parsedValue: Conversions.encodeBase16(
          bytes?.bytes() ?? new Uint8Array()
        )
      };

    case TypeID.Result:
      const result = value.result;
      const status = result?.isSuccess ? 'OK:' : 'ERR:';
      const parsed = result?.value()
        ? parseDeployArgValue(result?.value())
        : '';
      return { parsedValue: `${status} ${parsed}` };

    case TypeID.Map:
      const map = value.map;

      return {
        parsedValue: JSON.stringify(map?.getMap(), null, 4),
        type: ParsedValueType.Json
      };

    case TypeID.Tuple1:
      const tupleOne = value.tuple1;

      return tupleOne?.value() ? parseDeployArgValue(tupleOne?.value()) : [];

    case TypeID.Tuple2:
      const tupleTwo = value.tuple2;

      return tupleTwo?.value().map(member => unwrapNestedLists(member)) ?? [];

    case TypeID.Tuple3:
      const tupleThree = value.tuple3;

      return (
        tupleThree?.value()?.map(member => unwrapNestedLists(member)) ?? []
      );

    case TypeID.PublicKey:
      return { parsedValue: value.publicKey?.toHex() ?? '' };

    default:
      // Special handling as there is no CLTypeTag for CLAccountHash
      // if (value instanceof CLAccountHash) {
      //   return { parsedValue: encodeBase16(value.value()) };
      // }

      return { parsedValue: value.toString() };
  }
}

export const isKeyOfHashValue = (key: string) => {
  const keysOfHashValues: SignatureRequestKeys[] = [
    'signingKey',
    'account',
    'deployHash',
    'delegator',
    'validator',
    'new_validator',
    'recipient',
    'recipientKey',
    'recipientHash',
    'contractHash'
  ];
  return keysOfHashValues.includes(key as SignatureRequestKeys);
};

export const isKeyOfCurrencyValue = (key: string) => {
  const keysOfPriceValues: SignatureRequestKeys[] = [
    'amount',
    'transactionFee'
  ];

  return keysOfPriceValues.includes(key as SignatureRequestKeys);
};

export const isKeyOfTimestampValue = (key: string) => {
  const keysOfTimestampValues: SignatureRequestKeys[] = ['timestamp'];
  return keysOfTimestampValues.includes(key as SignatureRequestKeys);
};

export const getDeployParsedValue = (value: CLValue): ParsedDeployArgValue => {
  const parsedValue = parseDeployArgValue(value);
  let type: ParsedValueType.Json | undefined;
  let stringValue: string;

  if (Array.isArray(parsedValue)) {
    stringValue = parsedValue
      .reduce((acc: string[], cur) => {
        if (cur.type === ParsedValueType.Json) {
          type = cur.type;
        }
        acc.push(cur.parsedValue);

        return acc;
      }, [])
      .join(', ');
  } else if (parsedValue?.type === ParsedValueType.Json) {
    type = ParsedValueType.Json;
    stringValue = parsedValue.parsedValue;
  } else {
    stringValue = parsedValue.parsedValue;
  }

  return { parsedValue: stringValue, type };
};
