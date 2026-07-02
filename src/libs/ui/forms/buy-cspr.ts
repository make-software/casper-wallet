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
    // casperAmount has no yup validation (it's a derived/display field), so yup infers
    // it as an optional output key while keeping it a required-but-undefinable input key;
    // that Input/Output asymmetry can't be expressed by a single FormValues type, hence the cast.
    resolver: yupResolver(buyCSPRSchema) as Resolver<BuyCSPRFormValues>,
    defaultValues: {
      fiatAmount: defaultAmount
    }
  };

  return useForm<BuyCSPRFormValues>(buyFromOptions);
};
