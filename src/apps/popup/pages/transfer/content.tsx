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
  amountInCSPR: string;
  amountForm: UseFormReturn<TransferFormValues>;
  recipientForm: UseFormReturn<TransferFormValues>;
}

export const TransferPageContent = ({
  transferStep,
  recipientPublicKey,
  amountInCSPR,
  recipientForm,
  amountForm
}: TransferPageContentProps) => {
  switch (transferStep) {
    case TransactionSteps.Recipient: {
      return <RecipientStep recipientForm={recipientForm} />;
    }
    case TransactionSteps.Amount: {
      return <AmountStep amountForm={amountForm} />;
    }
    case TransactionSteps.Confirm: {
      return (
        <ConfirmStep
          recipientPublicKey={recipientPublicKey}
          amountInCSPR={amountInCSPR}
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
