import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useUnlockWalletRule } from './form-validation-rules';

export function useUnlockWalletForm(vaultPassword: string) {
  const formSchema = Yup.object().shape({
    password: useUnlockWalletRule(vaultPassword)
  });

  const formOptions: UseFormProps = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  return useForm(formOptions);
}
