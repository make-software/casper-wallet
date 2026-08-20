import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import { useAccountNameRule } from './form-validation-rules';
import { useTorusSecretKeyRule } from './torus-secret-key-rule';

export type ImportAccountFromTorusFromValues = {
  name: string;
  secretKey: string;
};

export const useImportAccountFromTorus = (existingAccountNames: string[]) => {
  const formSchema = Yup.object().shape({
    name: useAccountNameRule(value => {
      return value != null && !existingAccountNames.includes(value);
    }),
    secretKey: useTorusSecretKeyRule()
  });

  const formOptions: UseFormProps<ImportAccountFromTorusFromValues> = {
    mode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  return useForm<ImportAccountFromTorusFromValues>(formOptions);
};
