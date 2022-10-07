import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useLoginRule } from './form-validation-rules';

export function useLoginForm() {
  const formSchema = Yup.object().shape({
    password: useLoginRule()
  });

  const formOptions: UseFormProps = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  return useForm(formOptions);
}
