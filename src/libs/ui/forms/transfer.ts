import * as Yup from 'yup';
import { useForm } from 'react-hook-form';

import {
  useCsprAmountRule,
  useErc20AmountRule,
  usePaymentAmountRule,
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
  erc20Balance: string | null,
  isErc20: boolean,
  amountMotes: string | null,
  paymentAmount: string
) {
  const recipientFormSchema = Yup.object().shape({
    recipientPublicKey: useRecipientPublicKeyRule()
  });

  const recipientFormOptions: UseFormProps<TransferFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(recipientFormSchema)
  };

  const erc20AmountFormSchema = Yup.object().shape({
    amount: useErc20AmountRule(erc20Balance),
    paymentAmount: usePaymentAmountRule(amountMotes),
    transferIdMemo: useTransferIdMemoRule()
  });

  const csprAmountFormSchema = Yup.object().shape({
    amount: useCsprAmountRule(amountMotes),
    transferIdMemo: useTransferIdMemoRule()
  });

  const amountFormSchema = isErc20
    ? erc20AmountFormSchema
    : csprAmountFormSchema;

  const amountFormOptions: UseFormProps<TransferFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(amountFormSchema),
    defaultValues: isErc20
      ? {
          paymentAmount
        }
      : {}
  };

  return {
    recipientForm: useForm<TransferFormValues>(recipientFormOptions),
    amountForm: useForm<TransferFormValues>(amountFormOptions)
  };
}
