import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import { TRANSFER_MIN_AMOUNT_MOTES } from '@src/constants';

import {
  useCSPRTransferAmountRule,
  useErc20AmountRule,
  usePaymentAmountRule,
  useRecipientPublicKeyRule,
  useTransferIdMemoRule
} from '@libs/ui/forms/form-validation-rules';
import { motesToCSPR } from '@libs/ui/utils/formatters';

export type TransferRecipientFormValues = {
  recipientPublicKey: string;
};

export type TransferAmountFormValues = {
  amount: string;
  paymentAmount: string;
  transferIdMemo: string;
};

export const useTransferRecipientForm = () => {
  const recipientFormSchema = Yup.object().shape({
    recipientPublicKey: useRecipientPublicKeyRule()
  });

  const recipientFormOptions: UseFormProps<TransferRecipientFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(recipientFormSchema),
    delayError: 500
  };

  return useForm<TransferRecipientFormValues>(recipientFormOptions);
};

export const useTransferAmountForm = (
  erc20Balance: string | null,
  isErc20: boolean,
  amountMotes: string | null,
  paymentAmount: string,
  decimals: number | undefined
) => {
  const erc20AmountFormSchema = Yup.object().shape({
    amount: useErc20AmountRule(erc20Balance, decimals),
    paymentAmount: usePaymentAmountRule(amountMotes),
    transferIdMemo: useTransferIdMemoRule()
  });

  const csprAmountFormSchema = Yup.object().shape({
    amount: useCSPRTransferAmountRule(amountMotes),
    transferIdMemo: useTransferIdMemoRule()
  });

  const amountFormSchema = isErc20
    ? erc20AmountFormSchema
    : csprAmountFormSchema;

  const amountFormOptions: UseFormProps<TransferAmountFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(amountFormSchema),
    defaultValues: isErc20
      ? {
          paymentAmount
        }
      : {
          amount: motesToCSPR(TRANSFER_MIN_AMOUNT_MOTES)
        }
  };

  return useForm<TransferAmountFormValues>(amountFormOptions);
};
