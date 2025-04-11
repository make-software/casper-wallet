import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import {
  useContactNameRule,
  useContactPublicKeyRule
} from '@libs/ui/forms/form-validation-rules';

export type ContactFromValues = {
  name: string;
  publicKey: string;
};

export const useContactForm = (
  existingContactNames: string[],
  existingContactPublicKeys: string[],
  defaultPublicKey?: string,
  defaultName?: string
) => {
  const newContactFormSchema = Yup.object().shape({
    name: useContactNameRule(
      value =>
        value?.trim() != null && !existingContactNames.includes(value?.trim())
    ),
    publicKey: useContactPublicKeyRule(
      value =>
        value?.trim() != null &&
        !existingContactPublicKeys.includes(value?.trim())
    )
  });

  const newContactFormOptions: UseFormProps<ContactFromValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(newContactFormSchema),
    defaultValues: {
      name: defaultName || '',
      publicKey: defaultPublicKey || ''
    }
  };

  return useForm<ContactFromValues>(newContactFormOptions);
};
