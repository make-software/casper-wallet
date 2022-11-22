import React from 'react';
import { FieldValues, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { FieldErrors } from 'react-hook-form/dist/types/errors';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  InputsContainer,
  TextContainer
} from '@src/libs/layout';
import { Input, SvgIcon, Typography } from '@src/libs/ui';

interface ImportAccountWithFilePageContentProps {
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors;
  setValue: UseFormSetValue<FieldValues>;
  isFileLoaded: boolean;
}

export function ImportAccountWithFileUploadPageContent({
  register,
  errors,
  setValue,
  isFileLoaded
}: ImportAccountWithFilePageContentProps) {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon src="assets/illustrations/secret-key.svg" size={120} />
      </IllustrationContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Import account from secret key file</Trans>
        </Typography>
      </TextContainer>
      <InputsContainer>
        <Input
          type="file"
          accept=".pem"
          prefixIcon={<SvgIcon src="assets/icons/file.svg" />}
          suffixIcon={
            isFileLoaded && (
              <SvgIcon
                onClick={() =>
                  setValue('secretKeyFile', null, { shouldValidate: true })
                }
                src="assets/icons/close-filter.svg"
              />
            )
          }
          {...register('secretKeyFile')}
          error={!!errors.secretKeyFile}
          validationText={errors.secretKeyFile?.message}
        />
        <Input
          type="text"
          placeholder={t('Account name')}
          {...register('name')}
          error={!!errors.name}
          validationText={errors.name?.message}
        />
      </InputsContainer>
    </ContentContainer>
  );
}
