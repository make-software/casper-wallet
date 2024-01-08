import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { TransferSuccessScreen } from '@libs/ui';
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
  const [recipientName, setRecipientName] = useState('');

  const isCSPR = symbol === 'CSPR';

  switch (transferStep) {
    case TransactionSteps.Recipient: {
      return (
        <RecipientStep
          recipientForm={recipientForm}
          symbol={symbol}
          balance={balance}
          setRecipientName={setRecipientName}
          recipientName={recipientName}
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
          recipientName={recipientName}
        />
      );
    }

    case TransactionSteps.Success: {
      return <TransferSuccessScreen headerText="You submitted a transaction" />;
    }

    default: {
      throw Error('Out of bound: TransactionSteps');
    }
  }
};
