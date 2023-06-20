import * as Yup from 'yup';
import { useForm } from 'react-hook-form';

import {
  useCsprAmountRule,
  useErc20AmountRule,
  useRecipientPublicKeyRule,
  useTransferIdMemoRule
} from '@libs/ui/forms/form-validation-rules';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

export type TransferFormValues = {
  recipientPublicKey: string;
  amount: string;
  paymentAmount: string;
  transferIdMemo: string;
};

export function useTransferForm(
  balance: string | null,
  decimals: number | null,
  isErc20: boolean
) {
  const recipientFormSchema = Yup.object().shape({
    recipientPublicKey: useRecipientPublicKeyRule()
  });

  const recipientFormOptions: UseFormProps<TransferFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(recipientFormSchema)
  };

  const amountValidation = isErc20 ? useErc20AmountRule : useCsprAmountRule;

  const amountFormSchema = Yup.object().shape({
    amount: amountValidation(balance, decimals),
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
