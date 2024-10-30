import React from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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
import { ContactFromValues } from '@libs/ui/forms/contact';

interface AddContactPageContentProps {
  register: UseFormRegister<ContactFromValues>;
  errors: FieldErrors<ContactFromValues>;
}

export const AddContactPageContent = ({
  register,
  errors
}: AddContactPageContentProps) => {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">New contact</Typography>
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
          status={errors.publicKey ? FormFieldStatus.Error : undefined}
          label={t('Public address')}
        >
          <TextArea
            {...register('publicKey')}
            placeholder={t('Public key')}
            type="captionHash"
          />
        </FormField>
      </InputsContainer>
    </ContentContainer>
  );
};
