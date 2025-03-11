import {
  Args,
  CLValue,
  Conversions,
  Transaction,
  TransactionEntryPointEnum,
  TypeID
} from 'casper-js-sdk';

import {
  ArgDict,
  DeployType,
  ParsedDeployArgValue,
  ParsedValueType,
  SignatureRequestKeys
} from './deploy-types';

const AUCTION_NATIVE_ENTRY_POINTS = [
  TransactionEntryPointEnum.Delegate,
  TransactionEntryPointEnum.Undelegate,
  TransactionEntryPointEnum.Redelegate,
  TransactionEntryPointEnum.ActivateBid,
  TransactionEntryPointEnum.AddBid,
  TransactionEntryPointEnum.AddReservations,
  TransactionEntryPointEnum.CancelReservations,
  TransactionEntryPointEnum.WithdrawBid,
  TransactionEntryPointEnum.ChangeBidPublicKey
];

export function getTxType(tx: Transaction): DeployType {
  if (tx?.entryPoint?.type === TransactionEntryPointEnum.Call) {
    return DeployType.ModuleBytes;
  } else if (tx?.entryPoint?.type === TransactionEntryPointEnum.Transfer) {
    return DeployType.TransferCall;
  } else if (AUCTION_NATIVE_ENTRY_POINTS.includes(tx.entryPoint.type)) {
    return DeployType.AuctionNative;
  }

  if (tx.target?.stored) {
    return DeployType.ContractCall;
  }

  return DeployType.Unknown;
}

export function getTxPayment(tx: Transaction): string {
  const arg = tx.pricingMode.paymentLimited?.paymentAmount;

  if (arg) {
    return arg.toString();
  } else {
    return 'N/A';
  }
}

export function getTxEntryPoint(tx: Transaction): string | undefined {
  return tx.entryPoint.customEntryPoint;
}

export const getTxContractHash = (tx: Transaction) => {
  return (
    tx.target.stored?.id.byHash?.toHex() ||
    tx.target.stored?.id.byPackageHash?.addr?.toHex()
  );
};

export const getTxContractName = (tx: Transaction) => {
  return (
    tx.target.stored?.id.byName?.toString() ||
    tx.target.stored?.id.byPackageName?.name
  );
};

export function getTxArgs(tx: Transaction): ArgDict {
  if (tx.target.native) {
    if (tx.entryPoint.type === TransactionEntryPointEnum.Transfer) {
      return getDeployArgsForTransfer(tx.args);
    } else if (AUCTION_NATIVE_ENTRY_POINTS.includes(tx.entryPoint.type)) {
      return getTxArgsForNativeAuction(tx);
    }
  }

  const txArgs: ArgDict =
    tx.target.stored || tx.target.session?.moduleBytes
      ? getDeployArgsFromArgsDict(tx.args.args)
      : {};

  return txArgs;
}

function unwrapNestedLists(value: CLValue): ParsedDeployArgValue {
  const parsedValue = parseDeployArgValue(value);

  if (Array.isArray(parsedValue)) {
    const parsedType = value.list?.type;

    return { parsedValue: `<${parsedType}>[...]` };
  }

  return parsedValue;
}

function getDeployArgsForTransfer(txArgs: Args): ArgDict {
  const args: ArgDict = {};
  const targetFromDeploy = txArgs.getByName('target');

  if (!targetFromDeploy) {
    throw new Error("Couldn't find 'target' in transfer data");
  }

  switch (targetFromDeploy.type.getTypeID()) {
    case TypeID.ByteArray:
      args.recipientHash = Conversions.encodeBase16(targetFromDeploy.bytes());
      break;
    // If tx is created using version of SDK gte than 2.7.0
    // In fact this logic can be removed in future as well as pkHex param
    case TypeID.PublicKey:
      if (targetFromDeploy.publicKey) {
        args.recipientKey = targetFromDeploy.publicKey.toHex();
      }
      break;
    default: {
      throw new Error('Target from tx was neither AccountHash or PublicKey');
    }
  }

  const amountString = txArgs.getByName('amount');

  if (!amountString) {
    throw new Error("Couldn't find 'amount' in transfer data");
  }

  const idString = txArgs.getByName('id');

  args.amount = amountString.toString();

  if (idString) {
    args.transferId = idString.toString();
  }

  return args;
}

function getDeployArgsFromArgsDict(args: Map<string, CLValue>) {
  const txArgs: ArgDict = {};

  args.forEach((value, key) => {
    txArgs[key] = value;
  });

  return txArgs;
}

function getTxArgsForNativeAuction(tx: Transaction) {
  const txArgs: ArgDict = { entryPoint: tx.entryPoint.type };

  tx.args.args.forEach((value, key) => {
    txArgs[key] = value;
  });

  return txArgs;
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
      return { parsedValue: value.toString() };
  }
}

export const getParsedArgValue = (value: CLValue): ParsedDeployArgValue => {
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

export function isArgValueHash(value: CLValue): boolean {
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

export function isArgValueNumber(value: CLValue): boolean {
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
