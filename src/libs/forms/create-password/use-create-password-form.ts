import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { minPasswordLength } from '@libs/forms/create-password/constants';
import { UseFormProps } from 'react-hook-form/dist/types/form';
import { yupResolver } from '@hookform/resolvers/yup/dist/yup';
import { useForm } from 'react-hook-form';

export function useCreatePasswordForm() {
  const { t } = useTranslation();

  const passwordAmountCharactersMessage = t(
    `Should be at least ${minPasswordLength} characters`
  );
  const passwordsDoesntMatchMessage = t("Passwords don't match");

  const formSchema = Yup.object().shape({
    password: Yup.string().min(
      minPasswordLength,
      passwordAmountCharactersMessage
    ),
    confirmPassword: Yup.string().oneOf(
      [Yup.ref('password')],
      passwordsDoesntMatchMessage
    )
  });

  const formOptions: UseFormProps = {
    reValidateMode: 'onChange',
    resolver: yupResolver(formSchema)
  };

  return useForm(formOptions);
}
