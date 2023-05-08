import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useValidSecretPhraseRule } from '@libs/ui/forms/form-validation-rules';

export type RecoverSecretPhraseFormValues = {
  phrase: string;
};

export function useRecoverFromSecretPhraseForm() {
  const formSchema = Yup.object().shape({
    phrase: useValidSecretPhraseRule()
  });

  const formOptions: UseFormProps<RecoverSecretPhraseFormValues> = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  return useForm<RecoverSecretPhraseFormValues>(formOptions);
}
