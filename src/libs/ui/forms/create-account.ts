import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useAccountNameRule } from './form-validation-rules';

export function useCreateAccountForm(existingAccountNames: string[]) {
  const formSchema = Yup.object().shape({
    name: useAccountNameRule(value => {
      return value != null && !existingAccountNames.includes(value);
    })
  });

  const formOptions: UseFormProps = {
    mode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: {
      name: ''
    }
  };

  return useForm(formOptions);
}
