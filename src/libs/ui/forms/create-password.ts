import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import {
  useCreatePasswordRule,
  useRepeatPasswordRule
} from '@libs/ui/forms/form-validation-rules';

export type CreatePasswordFormValues = {
  password: string;
  confirmPassword: string;
};

export function useCreatePasswordForm() {
  const formSchema = Yup.object().shape({
    password: useCreatePasswordRule(),
    confirmPassword: useRepeatPasswordRule('password')
  });

  const formOptions: UseFormProps<CreatePasswordFormValues> = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  return useForm<CreatePasswordFormValues>(formOptions);
}
