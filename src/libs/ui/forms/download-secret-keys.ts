import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useVerifyPasswordAgainstHashRule } from './form-validation-rules';

export function useDownloadSecretKeysForm(
  passwordHash: string,
  passwordSaltHash: string
) {
  const formSchema = Yup.object().shape({
    password: useVerifyPasswordAgainstHashRule(passwordHash, passwordSaltHash)
  });

  const formOptions: UseFormProps = {
    reValidateMode: 'onSubmit',
    resolver: yupResolver(formSchema)
  };

  return useForm(formOptions);
}
