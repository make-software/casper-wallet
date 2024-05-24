import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  InputsContainer,
  SpacingSize,
  TabPageContainer,
  TabTextContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  FormField,
  FormFieldStatus,
  TextArea,
  Typography
} from '@libs/ui/components';
import { RecoverSecretPhraseFormValues } from '@libs/ui/forms/recover-from-secret-phrase';

interface RecoverFromSecretPhrasePageContentProps {
  register: UseFormRegister<RecoverSecretPhraseFormValues>;
  errorMessage?: string;
}

export function RecoverFromSecretPhrasePageContent({
  register,
  errorMessage
}: RecoverFromSecretPhrasePageContentProps) {
  const { t } = useTranslation();
  return (
    <TabPageContainer>
      <Typography type="captionMedium" color="contentActionCritical" uppercase>
        <Trans t={t}>Step 3</Trans>
      </Typography>
      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Typography type="headerBig">
          <Trans t={t}>Please enter your secret recovery phrase</Trans>
        </Typography>
      </VerticalSpaceContainer>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Recover your wallet by entering each word of your 12-word or 24-word
            secret recovery phrase, separated by spaces.
          </Trans>
        </Typography>
      </TabTextContainer>
      <InputsContainer>
        <FormField
          status={errorMessage ? FormFieldStatus.Error : undefined}
          statusText={errorMessage}
        >
          <TextArea
            rows={6}
            {...register('phrase')}
            placeholder={t('e.g. Bobcat Lemon Blanket…')}
          />
        </FormField>
      </InputsContainer>
    </TabPageContainer>
  );
}
