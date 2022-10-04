import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Typography } from '@libs/ui';

import { TextList } from '@src/apps/onboarding/components/text-list';
import { useSecurityNotes } from '@src/apps/onboarding/hooks/use-security-notes';

export function CreateSecretPhraseConfirmationPageContent() {
  const { t } = useTranslation();

  const textListItems = useSecurityNotes();

  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>
          Before we generate your secret phrase, please remember
        </Trans>
      </Typography>

      <TabTextContainer>
        <TextList textListItems={textListItems} />
      </TabTextContainer>
    </TabPageContainer>
  );
}
