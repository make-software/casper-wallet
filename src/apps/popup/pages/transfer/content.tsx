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
}

export const TransferPageContent = ({
  transferStep,
  recipientPublicKey,
  recipientForm,
  amountForm,
  amount,
  balance,
  symbol
}: TransferPageContentProps) => {
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
      return <AmountStep amountForm={amountForm} />;
    }
    case TransactionSteps.Confirm: {
      return (
        <ConfirmStep
          recipientPublicKey={recipientPublicKey}
          amountInCSPR={amount}
          balance={balance}
          symbol={symbol}
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
