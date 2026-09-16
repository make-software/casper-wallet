import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { Resolver, UseFormProps, useForm } from 'react-hook-form';

import { useBuyCSPRKeyRule } from '@libs/ui/forms/form-validation-rules';

export type BuyCSPRFormValues = {
  fiatAmount: string;
  casperAmount: string | undefined;
};

export const useBuyCSPR = (defaultAmount: string) => {
  const buyCSPRSchema = Yup.object().shape({
    fiatAmount: useBuyCSPRKeyRule(),
    casperAmount: Yup.string()
  });

  const buyFromOptions: UseFormProps<BuyCSPRFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    // casperAmount is a derived display field with no yup rule, so its inferred
    // Input/Output types differ — one FormValues type can't span both, hence the cast.
    resolver: yupResolver(buyCSPRSchema) as Resolver<BuyCSPRFormValues>,
    defaultValues: {
      fiatAmount: defaultAmount
    }
  };

  return useForm<BuyCSPRFormValues>(buyFromOptions);
};
