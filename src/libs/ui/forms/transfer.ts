import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';

import {
  useCSPRTransferAmountRule,
  useErc20AmountRule,
  usePaymentAmountRule,
  useRecipientPublicKeyRule,
  useTransferIdMemoRule
} from '@libs/ui/forms/form-validation-rules';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { motesToCSPR } from '@libs/ui/utils/formatters';
import { TRANSFER_MIN_AMOUNT_MOTES } from '@src/constants';

export type TransferRecipientFormValues = {
  recipientPublicKey: string;
};

export type TransferAmountFormValues = {
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

  const recipientFormOptions: UseFormProps<TransferRecipientFormValues> = {
    reValidateMode: 'onBlur',
    mode: 'onBlur',
    resolver: yupResolver(recipientFormSchema),
    delayError: 500
  };

  const erc20AmountFormSchema = Yup.object().shape({
    amount: useErc20AmountRule(erc20Balance),
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

  return {
    recipientForm: useForm<TransferRecipientFormValues>(recipientFormOptions),
    amountForm: useForm<TransferAmountFormValues>(amountFormOptions)
  };
}
