import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import { AuctionManagerEntryPoint } from '@src/constants';

import {
  useCSPRStakeAmountRule,
  useNewValidatorPublicKeyRule,
  useValidatorPublicKeyRule
} from '@libs/ui/forms/form-validation-rules';

export type StakeValidatorFormValues = {
  validatorPublicKey: string;
};

export type StakeNewValidatorFormValues = {
  newValidatorPublicKey: string;
};

export type StakeAmountFormValues = {
  amount: string;
};

export const useStakesForm = (
  amountMotes: string | null,
  stakesType: AuctionManagerEntryPoint,
  stakeAmountMotes: string,
  delegatorsNumber?: number,
  delegatorsNumberForNewValidator?: number
) => {
  const validatorFormSchema = Yup.object().shape({
    validatorPublicKey: useValidatorPublicKeyRule(stakesType, delegatorsNumber)
  });

  const validatorFormOptions: UseFormProps<StakeValidatorFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(validatorFormSchema)
  };

  const newValidatorFromSchema = Yup.object().shape({
    newValidatorPublicKey: useNewValidatorPublicKeyRule(
      delegatorsNumberForNewValidator
    )
  });

  const newValidatorFormOptions: UseFormProps<StakeNewValidatorFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(newValidatorFromSchema)
  };

  const amountFormSchema = Yup.object().shape({
    amount: useCSPRStakeAmountRule(amountMotes, stakesType, stakeAmountMotes)
  });

  const amountFormOptions: UseFormProps<StakeAmountFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(amountFormSchema)
  };

  return {
    validatorForm: useForm<StakeValidatorFormValues>(validatorFormOptions),
    amountForm: useForm<StakeAmountFormValues>(amountFormOptions),
    newValidatorForm: useForm<StakeNewValidatorFormValues>(
      newValidatorFormOptions
    )
  };
};
