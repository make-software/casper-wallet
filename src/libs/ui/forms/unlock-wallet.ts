import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import { useVerifyPasswordAgainstHashRule } from './form-validation-rules';

export type UnlockWalletFormValues = {
  password: string;
};

export function useUnlockWalletForm(
  passwordHash: string,
  passwordSaltHash: string
) {
  const formSchema = Yup.object().shape({
    password: useVerifyPasswordAgainstHashRule(passwordHash, passwordSaltHash)
  });

  const formOptions: UseFormProps<UnlockWalletFormValues> = {
    reValidateMode: 'onSubmit',
    resolver: yupResolver(formSchema)
  };

  return useForm<UnlockWalletFormValues>(formOptions);
}
