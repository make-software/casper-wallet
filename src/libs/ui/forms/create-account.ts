import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import { useAccountNameRule } from './form-validation-rules';

export type CreateAccountFormValues = {
  name: string;
};

export function useCreateAccountForm(
  existingAccountNames: string[],
  defaultName: string
) {
  const formSchema = Yup.object().shape({
    name: useAccountNameRule(value => {
      return value != null && !existingAccountNames.includes(value);
    })
  });

  const formOptions: UseFormProps<CreateAccountFormValues> = {
    mode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: {
      name: defaultName
    }
  };

  return useForm<CreateAccountFormValues>(formOptions);
}
