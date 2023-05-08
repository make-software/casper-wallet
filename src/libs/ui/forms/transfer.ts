import * as Yup from 'yup';
import { useForm } from 'react-hook-form';

import {
  useCsprAmountRule,
  useRecipientPublicKeyRule,
  useTransferIdMemoRule
} from '@libs/ui/forms/form-validation-rules';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

export type TransferFormValues = {
  recipientPublicKey: string;
  csprAmount: string;
  transferIdMemo: string;
};

export function useTransferForm(amountMotes: string | null) {
  const recipientFormSchema = Yup.object().shape({
    recipientPublicKey: useRecipientPublicKeyRule()
  });

  const recipientFormOptions: UseFormProps<TransferFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(recipientFormSchema)
  };

  const amountFormSchema = Yup.object().shape({
    csprAmount: useCsprAmountRule(amountMotes),
    transferIdMemo: useTransferIdMemoRule()
  });

  const amountFormOptions: UseFormProps<TransferFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(amountFormSchema)
  };

  return {
    recipientForm: useForm<TransferFormValues>(recipientFormOptions),
    amountForm: useForm<TransferFormValues>(amountFormOptions)
  };
}
