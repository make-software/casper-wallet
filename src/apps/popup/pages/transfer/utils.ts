export enum TransactionSteps {
  Recipient = 'recipient',
  Amount = 'amount',
  Confirm = 'confirm',
  ConfirmWithLedger = 'confirm with ledger',
  Success = 'success'
}

export const getIsErc20Transfer = (
  tokenContractPackageHash: string | undefined
) => {
  return (
    tokenContractPackageHash != null && tokenContractPackageHash !== 'Casper'
  );
};
