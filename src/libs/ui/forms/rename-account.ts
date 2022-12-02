import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useAccountNameRule } from './form-validation-rules';

export type RenameAccountFormValues = {
  name: string;
};

export function useRenameAccount(
  accountName: string | undefined,
  existingAccountNames: string[]
) {
  const formSchema = Yup.object().shape({
    name: useAccountNameRule(value => {
      return (
        value != null &&
        !existingAccountNames
          .filter(existingAccountName => existingAccountName !== accountName)
          .includes(value)
      );
    })
  });

  const formOptions: UseFormProps<RenameAccountFormValues> = {
    mode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: {
      name: accountName
    }
  };

  return useForm<RenameAccountFormValues>(formOptions);
}
