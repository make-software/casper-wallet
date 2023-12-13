import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { FieldErrors, UseFormRegister } from 'react-hook-form';

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
} from '@libs/ui';
import { ContactFromValues } from '@libs/ui/forms/contact';

interface EditingContactPageContentProps {
  register: UseFormRegister<ContactFromValues>;
  errors: FieldErrors<ContactFromValues>;
}

export const EditingContactPageContent = ({
  register,
  errors
}: EditingContactPageContentProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Edit contact</Trans>
        </Typography>
      </ParagraphContainer>
      <InputsContainer>
        <Input
          type="text"
          label={t('Name')}
          {...register('name')}
          placeholder={t('Name')}
          error={!!errors.name}
          validationText={errors.name?.message}
        />
        <FormField
          statusText={errors.publicKey?.message}
          status={!!errors.publicKey ? FormFieldStatus.Error : undefined}
          label={t('Public address')}
        >
          <TextArea
            {...register('publicKey')}
            placeholder={t('0x')}
            type="captionHash"
          />
        </FormField>
      </InputsContainer>
    </ContentContainer>
  );
};
