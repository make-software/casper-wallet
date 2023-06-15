export enum TransactionSteps {
  Recipient = 'recipient',
  Amount = 'amount',
  Confirm = 'confirm',
  Success = 'success'
}

export const getIsErc20Transfer = (tokenContractHash: string | undefined) => {
  return tokenContractHash != null && tokenContractHash !== 'Casper';
};
