import React from 'react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  ContentContainer,
  IllustrationContainer,
  InputsContainer,
  ParagraphContainer,
  SpacingSize
} from '@libs/layout';
import { Input, SvgIcon, Typography } from '@libs/ui/components';
import { RenameAccountFormValues } from '@libs/ui/forms/rename-account';

interface RenameAccountPageContentProps {
  register: UseFormRegister<RenameAccountFormValues>;
  errors: FieldErrors<RenameAccountFormValues>;
}

export function RenameAccountPageContent({
  register,
  errors
}: RenameAccountPageContentProps) {
  const { t } = useTranslation();

  return (
    <ContentContainer>
      <IllustrationContainer>
        <SvgIcon
          src="assets/illustrations/rename-account.svg"
          width={200}
          height={120}
        />
      </IllustrationContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Rename account</Trans>
        </Typography>
      </ParagraphContainer>
      <InputsContainer>
        <Input
          type="text"
          placeholder={t('New account name')}
          {...register('name')}
          error={!!errors.name}
          validationText={errors.name?.message}
        />
      </InputsContainer>
    </ContentContainer>
  );
}
