import React, { useEffect, useRef } from 'react';
import {
  FieldErrors,
  UseFormRegister,
  UseFormResetField
} from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  InputsContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Input, SvgIcon, Typography } from '@libs/ui/components';

import { RouterPath, useTypedNavigate } from '../../router';
import { ImportAccountFormValues } from './types';

interface ImportAccountWithFilePageContentProps {
  register: UseFormRegister<ImportAccountFormValues>;
  errors: FieldErrors<ImportAccountFormValues>;
  resetField: UseFormResetField<ImportAccountFormValues>;
  isFileLoaded: boolean;
}

export function ImportAccountWithFileUploadPageContent({
  register,
  errors,
  resetField,
  isFileLoaded
}: ImportAccountWithFilePageContentProps) {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const { ref, ...rest } = register('secretKeyFile');

  // Here we open the upload file input after the component is mounted.
  useEffect(() => {
    inputRef.current?.click();
  }, []);

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/import-secret-key.svg"
          width={200}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Import account from secret key file</Trans>
        </Typography>
      </ParagraphContainer>
      <InputsContainer>
        <Input
          type="file"
          accept=".pem"
          prefixIcon={<SvgIcon src="assets/icons/file.svg" />}
          suffixIcon={
            isFileLoaded && (
              <SvgIcon
                onClick={() => {
                  resetField('secretKeyFile');
                  navigate(RouterPath.ImportAccountWithFile);
                }}
                src="assets/icons/close-filter.svg"
              />
            )
          }
          {...rest}
          ref={e => {
            // https://react-hook-form.com/faqs#Howtosharerefusage
            ref(e);
            inputRef.current = e;
          }}
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
