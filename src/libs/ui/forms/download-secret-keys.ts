import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useVerifyPasswordAgainstHashRule } from './form-validation-rules';

export type DownloadSecretKeysFormValues = {
  password: string;
};

export function useDownloadSecretKeysForm(
  passwordHash: string,
  passwordSaltHash: string
) {
  const isItNeedToIncrementLoginRetryCount = false;
  const formSchema = Yup.object().shape({
    password: useVerifyPasswordAgainstHashRule(
      passwordHash,
      passwordSaltHash,
      isItNeedToIncrementLoginRetryCount
    )
  });

  const formOptions: UseFormProps<DownloadSecretKeysFormValues> = {
    reValidateMode: 'onSubmit',
    resolver: yupResolver(formSchema)
  };

  return useForm<DownloadSecretKeysFormValues>(formOptions);
}
