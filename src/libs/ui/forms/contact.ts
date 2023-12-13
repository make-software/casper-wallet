import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';

import {
  useContactNameRule,
  useContactPublicKeyRule
} from '@libs/ui/forms/form-validation-rules';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

export type ContactFromValues = {
  name: string;
  publicKey: string;
};

export const useContactForm = (
  existingContactNames: string[],
  defaultPublicKey?: string,
  defaultName?: string
) => {
  const newContactFormSchema = Yup.object().shape({
    name: useContactNameRule(
      value => value != null && !existingContactNames.includes(value)
    ),
    publicKey: useContactPublicKeyRule()
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
