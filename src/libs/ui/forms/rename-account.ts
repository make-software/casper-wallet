import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useAccountNameIsTakenRule } from './form-validation-rules';

export function useRenameAccount(
  accountName: string | undefined,
  existingAccountNames: string[]
) {
  const formSchema = Yup.object().shape({
    name: useAccountNameIsTakenRule(value => {
      return !existingAccountNames.includes(value as string);
    })
  });

  const formOptions: UseFormProps = {
    mode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: {
      name: accountName
    }
  };

  return useForm(formOptions);
}
