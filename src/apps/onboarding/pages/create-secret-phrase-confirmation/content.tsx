import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Typography } from '@libs/ui';

import { TextList } from '@src/apps/onboarding/components/text-list';

export function CreateSecretPhraseConfirmationPageContent() {
  const { t } = useTranslation();

  const textListItems = [
    { key: 1, value: t('Save a backup in multiple places.') },
    { key: 2, value: t('Never share the phrase with anyone.') },
    {
      key: 3,
      value: t(
        'Be careful of phishin! Casper Signer will never spontaneously ask for your secret phrase.'
      )
    },
    {
      key: 4,
      value: t(
        'If you need to back up your secret phrase again, you can find it in Settings.'
      )
    },
    { key: 5, value: t('Casper Signer cannot recover your secret phrase.') }
  ];

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