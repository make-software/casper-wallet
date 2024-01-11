import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import {
  usePaymentAmountRule,
  useRecipientPublicKeyRule
} from '@libs/ui/forms/form-validation-rules';

export type TransferNftAmountFormValues = {
  paymentAmount: string;
};

export type TransferNftRecipientFormValues = {
  recipientPublicKey: string;
};

export const useTransferNftForm = (
  amountMotes: string | null,
  paymentAmount: string
) => {
  const recipientFormSchema = Yup.object().shape({
    recipientPublicKey: useRecipientPublicKeyRule()
  });

  const recipientFormOptions: UseFormProps<TransferNftRecipientFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(recipientFormSchema)
  };

  const amountFormSchema = Yup.object().shape({
    paymentAmount: usePaymentAmountRule(amountMotes)
  });

  const amountFormOptions: UseFormProps<TransferNftAmountFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(amountFormSchema),
    defaultValues: {
      paymentAmount
    }
  };

  return {
    recipientForm:
      useForm<TransferNftRecipientFormValues>(recipientFormOptions),
    amountForm: useForm<TransferNftAmountFormValues>(amountFormOptions)
  };
};
