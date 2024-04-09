import React, { useState } from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { InputsContainer, ParagraphContainer, SpacingSize } from '@libs/layout';
import {
  Input,
  InputValidationType,
  PasswordInputType,
  PasswordVisibilityIcon,
  Typography
} from '@libs/ui/components';
import { CreatePasswordFormValues } from '@libs/ui/forms/create-password';
import { minPasswordLength } from '@libs/ui/forms/form-validation-rules';

interface PasswordInputsProps {
  register: UseFormRegister<CreatePasswordFormValues>;
  errors: FieldErrors<CreatePasswordFormValues>;
  passwordLength: number;
}
export const PasswordInputs = ({
  register,
  errors,
  passwordLength
}: PasswordInputsProps) => {
  const [passwordInputType, setPasswordInputType] =
    useState<PasswordInputType>('password');
  const [confirmPasswordInputType, setConfirmPasswordInputType] =
    useState<PasswordInputType>('password');

  const { t } = useTranslation();

  const needToAddMoreCharacters = minPasswordLength - passwordLength;

  return (
    <>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          {needToAddMoreCharacters <= 0 ? (
            <Trans
              defaults="Your password length is - <t>{{passwordLength}} characters.</t>"
              values={{ passwordLength }}
              components={{
                t: <Typography type="bodySemiBold" color="contentPrimary" />
              }}
            />
          ) : (
            <Trans
              t={t}
              defaults="You need to add at least <t>{{needToAddMoreCharacters}} characters</t> more"
              values={{ needToAddMoreCharacters }}
              components={{
                t: <Typography type="bodySemiBold" color="contentPrimary" />
              }}
            />
          )}
        </Typography>
      </ParagraphContainer>

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
    </>
  );
};
