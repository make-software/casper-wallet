import {
  CLPublicKey,
  CasperServiceByJsonRPC,
  StoredValue
} from 'casper-js-sdk';

export enum TransactionSteps {
  Recipient = 'recipient',
  Amount = 'amount',
  Confirm = 'confirm',
  Success = 'success'
}

export const getIsErc20Transfer = (tokenContractHash: string | undefined) => {
  return tokenContractHash != null && tokenContractHash !== 'Casper';
};

type Account = StoredValue['Account'];

export const getAccountInfo = async (
  nodeAddress: string,
  publicKey: CLPublicKey
): Promise<Account> => {
  const client = new CasperServiceByJsonRPC(nodeAddress);
  const stateRootHash = await client.getStateRootHash();
  const accountHash = publicKey.toAccountHashStr();
  const blockState = await client.getBlockState(stateRootHash, accountHash, []);
  const account = blockState.Account;
  if (!account) throw Error('Not found account');
  return account;
};

export const findKeyFromAccountNamedKeys = (
  account: Account,
  name: string
): string => {
  const key = account!.namedKeys.find(namedKey => namedKey.name === name)?.key;

  if (!key) throw Error(`Not found key: ${name}`);

  return key;
};
