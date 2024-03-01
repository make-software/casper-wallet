import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import {
  NoConnectedLedger,
  ReviewWithLedger,
  TransferSuccessScreen
} from '@libs/ui/components';
import {
  TransferAmountFormValues,
  TransferRecipientFormValues
} from '@libs/ui/forms/transfer';

import { AmountStep } from './amount-step';
import { ConfirmStep } from './confirm-step';
import { RecipientStep } from './recipient-step';
import { TransactionSteps } from './utils';

interface TransferPageContentProps {
  transferStep: TransactionSteps;
  recipientPublicKey: string;
  amountForm: UseFormReturn<TransferAmountFormValues>;
  recipientForm: UseFormReturn<TransferRecipientFormValues>;
  amount: string;
  balance: string | null;
  symbol: string | null;
  paymentAmount: string;
  isLedgerConnected: boolean;
}

export const TransferPageContent = ({
  transferStep,
  recipientPublicKey,
  recipientForm,
  amountForm,
  amount,
  balance,
  symbol,
  paymentAmount,
  isLedgerConnected
}: TransferPageContentProps) => {
  const [recipientName, setRecipientName] = useState('');

  const isCSPR = symbol === 'CSPR';

  const getContent = {
    [TransactionSteps.Recipient]: (
      <RecipientStep
        recipientForm={recipientForm}
        symbol={symbol}
        balance={balance}
        setRecipientName={setRecipientName}
        recipientName={recipientName}
      />
    ),
    [TransactionSteps.Amount]: (
      <AmountStep amountForm={amountForm} symbol={symbol} isCSPR={isCSPR} />
    ),
    [TransactionSteps.Confirm]: (
      <ConfirmStep
        recipientPublicKey={recipientPublicKey}
        amount={amount}
        balance={balance}
        symbol={symbol}
        isCSPR={isCSPR}
        paymentAmount={paymentAmount}
        recipientName={recipientName}
      />
    ),
    [TransactionSteps.ConfirmWithLedger]: isLedgerConnected ? (
      <ReviewWithLedger
        txnHash={
          '017666eff4fcc0fd656c58dfe2e8fc22b765c05dc8a1be524b1ae4d90634ba9ab5'
        }
      />
    ) : (
      <NoConnectedLedger />
    ),
    [TransactionSteps.Success]: (
      <TransferSuccessScreen headerText="You submitted a transaction" />
    )
  };

  return getContent[transferStep];
};
