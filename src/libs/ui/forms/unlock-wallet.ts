import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

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
