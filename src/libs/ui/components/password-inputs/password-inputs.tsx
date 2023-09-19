import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

import {
  Input,
  InputValidationType,
  PasswordInputType,
  PasswordVisibilityIcon
} from '@libs/ui';
import { InputsContainer } from '@libs/layout';
import { CreatePasswordFormValues } from '@libs/ui/forms/create-password';

interface PasswordInputsProps {
  register: UseFormRegister<CreatePasswordFormValues>;
  errors: FieldErrors<CreatePasswordFormValues>;
}
export const PasswordInputs = ({ register, errors }: PasswordInputsProps) => {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');
  const [confirmPasswordInputType, setConfirmPasswordInputType] =
    useState<PasswordInputType>('password');

  const { t } = useTranslation();

  return (
    <InputsContainer>
      <Input
        validationType={InputValidationType.Password}
        type={passwordInputType}
        placeholder={t('Password')}
        oneColoredIcons
        suffixIcon={
          <PasswordVisibilityIcon
            passwordInputType={passwordInputType}
            setPasswordInputType={setPasswordInputType}
          />
        }
        {...register('password')}
        error={!!errors.password}
        validationText={errors.password?.message}
      />
      <Input
        type={confirmPasswordInputType}
        placeholder={t('Confirm password')}
        oneColoredIcons
        suffixIcon={
          <PasswordVisibilityIcon
            passwordInputType={confirmPasswordInputType}
            setPasswordInputType={setConfirmPasswordInputType}
          />
        }
        {...register('confirmPassword')}
        error={!!errors.confirmPassword}
        validationText={errors.confirmPassword?.message}
      />
    </InputsContainer>
  );
};
