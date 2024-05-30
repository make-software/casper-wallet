import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import { useBuyCSPRKeyRule } from '@libs/ui/forms/form-validation-rules';

export type BuyCSPRFormValues = {
  fiatAmount: string;
  casperAmount: string;
};

export const useBuyCSPR = (defaultAmount: string) => {
  const buyCSPRSchema = Yup.object().shape({
    fiatAmount: useBuyCSPRKeyRule(),
    casperAmount: Yup.string()
  });

  const buyFromOptions: UseFormProps<BuyCSPRFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(buyCSPRSchema),
    defaultValues: {
      fiatAmount: defaultAmount
    }
  };

  return useForm<BuyCSPRFormValues>(buyFromOptions);
};
