import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useAccountNameRule } from './form-validation-rules';

export function useCreateAccountForm(
  existingAccountNames: string[],
  defaultName: string
) {
  const formSchema = Yup.object().shape({
    name: useAccountNameRule(value => {
      return value != null && !existingAccountNames.includes(value);
    })
  });

  const formOptions: UseFormProps = {
    mode: 'onChange',
    resolver: yupResolver(formSchema),
    defaultValues: {
      name: defaultName
    }
  };

  return useForm(formOptions);
}

export function getDefaultName(
  derivedAccountsCount: number,
  existingAccountNames: string[]
) {
  const accountString = 'Account';

  let sequenceNumber = derivedAccountsCount + 1;
  let defaultName = `${accountString} ${sequenceNumber}`;

  while (existingAccountNames.includes(defaultName)) {
    sequenceNumber++;
    defaultName = `${accountString} ${sequenceNumber}`;
  }

  return defaultName;
}
