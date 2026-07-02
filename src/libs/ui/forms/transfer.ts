import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Resolver, UseFormProps, useForm } from 'react-hook-form';

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
    mode: 'onTouched',
    resolver: yupResolver(recipientFormSchema),
    delayError: 500
  };

  return useForm<TransferRecipientFormValues>(recipientFormOptions);
};

export const useTransferAmountForm = (
  erc20Balance: string | null,
  isErc20: boolean,
  amountMotes: string | undefined,
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
    // paymentAmount is ERC-20-only in the domain model (custom transaction
    // payment/gas); it's unvalidated here purely so both branches of the
    // amountFormSchema union share the same key set (mirrors buy-cspr.ts's
    // casperAmount treatment) — do not add validation for CSPR transfers.
    paymentAmount: Yup.string(),
    transferIdMemo: useTransferIdMemoRule()
  });

  const amountFormSchema = isErc20
    ? erc20AmountFormSchema
    : csprAmountFormSchema;

  const amountFormOptions: UseFormProps<TransferAmountFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onTouched',
    // amountFormSchema is a union of two ObjectSchema branches (erc20 vs cspr) whose
    // paymentAmount/transferIdMemo keys are inferred as optional (Input/Output asymmetry,
    // same cause as buy-cspr.ts's casperAmount) — cast to bridge that gap.
    resolver: yupResolver(
      amountFormSchema
    ) as Resolver<TransferAmountFormValues>,
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
