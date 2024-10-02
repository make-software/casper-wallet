import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import { SecretPhrase, deriveKeyPair } from '@libs/crypto';
import { Account } from '@libs/types/account';

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

export function getDefaultName(
  existingAccountNames: string[],
  derivedAccounts: Account[],
  secretPhrase: SecretPhrase | null
) {
  const accountString = 'Account';

  let isAccountAlreadyAdded = true;
  let i = 0;

  while (isAccountAlreadyAdded) {
    const keyPair = deriveKeyPair(secretPhrase, i);

    if (
      !derivedAccounts.some(account => account.publicKey === keyPair.publicKey)
    ) {
      isAccountAlreadyAdded = false;
      break;
    }
    i++;
  }

  let sequenceNumber = i + 1;
  let defaultName = `${accountString} ${sequenceNumber}`;

  while (existingAccountNames.includes(defaultName)) {
    sequenceNumber++;
    defaultName = `${accountString} ${sequenceNumber}`;
  }

  return defaultName;
}
