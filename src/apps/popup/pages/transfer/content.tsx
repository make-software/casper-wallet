import React from 'react';
import { UseFormReturn } from 'react-hook-form';

import { TransferFormValues } from '@libs/ui/forms/transfer';

import { TransactionSteps } from './utils';
import { RecipientStep } from './recipient-step';
import { AmountStep } from './amount-step';
import { ConfirmStep } from './confirm-step';
import { SuccessStep } from './success-step';

interface TransferPageContentProps {
  transferStep: TransactionSteps;
  recipientPublicKey: string;
  amountForm: UseFormReturn<TransferFormValues>;
  recipientForm: UseFormReturn<TransferFormValues>;
  amount: string;
  balance: string | null;
  symbol: string | null;
  paymentAmount: string;
}

export const TransferPageContent = ({
  transferStep,
  recipientPublicKey,
  recipientForm,
  amountForm,
  amount,
  balance,
  symbol,
  paymentAmount
}: TransferPageContentProps) => {
  const isCSPR = symbol === 'CSPR';

  switch (transferStep) {
    case TransactionSteps.Recipient: {
      return (
        <RecipientStep
          recipientForm={recipientForm}
          symbol={symbol}
          balance={balance}
        />
      );
    }
    case TransactionSteps.Amount: {
      return (
        <AmountStep amountForm={amountForm} symbol={symbol} isCSPR={isCSPR} />
      );
    }
    case TransactionSteps.Confirm: {
      return (
        <ConfirmStep
          recipientPublicKey={recipientPublicKey}
          amount={amount}
          balance={balance}
          symbol={symbol}
          isCSPR={isCSPR}
          paymentAmount={paymentAmount}
        />
      );
    }

    case TransactionSteps.Success: {
      return <SuccessStep />;
    }

    default: {
      throw Error('Out of bound: TransactionSteps');
    }
  }
};
