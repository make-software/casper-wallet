import React from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  InputsContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import {
  FormField,
  FormFieldStatus,
  Input,
  TextArea,
  Typography
} from '@libs/ui/components';
import { ImportAccountFromTorusFromValues } from '@libs/ui/forms/import-account-from-torus';

interface ImportTorusFormProps {
  register: UseFormRegister<ImportAccountFromTorusFromValues>;
  errors: FieldErrors<ImportAccountFromTorusFromValues>;
}

export const ImportTorusForm = ({ register, errors }: ImportTorusFormProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Account details</Trans>
        </Typography>
      </ParagraphContainer>
      <InputsContainer>
        <FormField
          statusText={errors.secretKey?.message}
          status={!!errors.secretKey ? FormFieldStatus.Error : undefined}
        >
          <TextArea
            {...register('secretKey')}
            placeholder={t('Secret key')}
            type="bodyHash"
          />
        </FormField>
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
};
