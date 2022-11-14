import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useVerifyPasswordAgainstDigestRule } from './form-validation-rules';

export function useDownloadSecretKeysForm(passwordDigest: string) {
  const formSchema = Yup.object().shape({
    password: useVerifyPasswordAgainstDigestRule(passwordDigest)
  });

  const formOptions: UseFormProps = {
    reValidateMode: 'onSubmit',
    resolver: yupResolver(formSchema)
  };

  return useForm(formOptions);
}
