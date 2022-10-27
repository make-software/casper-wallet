import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useExpectPasswordRule } from './form-validation-rules';

export function useDownloadSecretKeysForm(expectedPassword: string) {
  const formSchema = Yup.object().shape({
    password: useExpectPasswordRule(expectedPassword)
  });

  const formOptions: UseFormProps = {
    reValidateMode: 'onSubmit',
    resolver: yupResolver(formSchema)
  };

  return useForm(formOptions);
}
