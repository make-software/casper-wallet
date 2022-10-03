import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { usePhraseRule } from '@libs/ui/forms/form-validation-rules';

export function useRecoverWalletFromSecretPhrase(originalPhrase: string) {
  const formSchema = Yup.object().shape({
    phrase: usePhraseRule(originalPhrase)
  });

  const formOptions: UseFormProps = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  return useForm(formOptions);
}
