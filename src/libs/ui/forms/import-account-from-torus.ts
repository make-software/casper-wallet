import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { UseFormProps, useForm } from 'react-hook-form';

import {
  useAccountNameRule,
  useTorusSecretKEyRule
} from './form-validation-rules';

export type ImportAccountFromTorusFromValues = {
  name: string;
  secretKey: string;
};

export const useImportAccountFromTorus = (existingAccountNames: string[]) => {
  const formSchema = Yup.object().shape({
    name: useAccountNameRule(value => {
      return value != null && !existingAccountNames.includes(value);
    }),
    secretKey: useTorusSecretKEyRule()
  });

  const formOptions: UseFormProps<ImportAccountFromTorusFromValues> = {
    mode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  return useForm<ImportAccountFromTorusFromValues>(formOptions);
};
