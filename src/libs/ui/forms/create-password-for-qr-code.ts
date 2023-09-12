import * as Yup from 'yup';
import { useForm } from 'react-hook-form';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';

import { useCreatePasswordForQrCodeRule } from '@libs/ui/forms/form-validation-rules';

export type CreatePasswordForQRCodeFormValues = {
  password: string;
};

export const useCreatePasswordForQRCodeForm = () => {
  const formSchema = Yup.object().shape({
    password: useCreatePasswordForQrCodeRule()
  });

  const formOptions: UseFormProps<CreatePasswordForQRCodeFormValues> = {
    reValidateMode: 'onChange',
    mode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  return useForm<CreatePasswordForQRCodeFormValues>(formOptions);
};
