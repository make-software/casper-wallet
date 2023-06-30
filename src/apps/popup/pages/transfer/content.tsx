import React from 'react';
import { Control, FormState, UseFormRegister } from 'react-hook-form';

import { TransferFormValues } from '@libs/ui/forms/transfer';

import { TransactionSteps } from './utils';
import { RecipientStep } from './recipient-step';
import { AmountStep } from './amount-step';
import { ConfirmStep } from './confirm-step';
import { SuccessStep } from './success-step';

interface TransferPageContentProps {
  transferStep: TransactionSteps;
  amountFormRegister: UseFormRegister<TransferFormValues>;
  amountFormState: FormState<TransferFormValues>;
  recipientFormRegister: UseFormRegister<TransferFormValues>;
  recipientFormState: FormState<TransferFormValues>;
  recipientPublicKey: string;
  amountInCSPR: string;
  controlAmountForm: Control<TransferFormValues>;
}

export const TransferPageContent = ({
  transferStep,
  amountFormRegister,
  amountFormState,
  recipientFormRegister,
  recipientFormState,
  recipientPublicKey,
  amountInCSPR,
  controlAmountForm
}: TransferPageContentProps) => {
  switch (transferStep) {
    case TransactionSteps.Recipient: {
      return (
        <RecipientStep
          register={recipientFormRegister}
          formState={recipientFormState}
        />
      );
    }
    case TransactionSteps.Amount: {
      return (
        <AmountStep
          amountFormRegister={amountFormRegister}
          amountFormState={amountFormState}
          controlAmountForm={controlAmountForm}
        />
      );
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
