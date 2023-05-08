import React from 'react';
import { FormState, UseFormRegister } from 'react-hook-form';

import { TransferFormValues } from '@libs/ui/forms/transfer';
import { TransactionSteps } from './utils';
import { RecipientStep } from '@popup/pages/transfer/recipient-step';
import { AmountStep } from '@popup/pages/transfer/amount-step';
import { ConfirmStep } from '@popup/pages/transfer/confirm-step';

interface TransferPageContentProps {
  transferStep: TransactionSteps;
  amountFormRegister: UseFormRegister<TransferFormValues>;
  amountFormState: FormState<TransferFormValues>;
  recipientFormRegister: UseFormRegister<TransferFormValues>;
  recipientFormState: FormState<TransferFormValues>;
  recipientPublicKey: string;
  amountInCSPR: string;
}

export const TransferPageContent = ({
  transferStep,
  amountFormRegister,
  amountFormState,
  recipientFormRegister,
  recipientFormState,
  recipientPublicKey,
  amountInCSPR
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

    default: {
      throw Error('Out of bound: TransactionSteps');
    }
  }
};
