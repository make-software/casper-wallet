import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  SpacingSize,
  TabPageContainer,
  VerticalSpaceContainer
} from '@src/libs/layout';
import { Typography, TextList } from '@src/libs/ui';
import { Underline } from '@libs/ui/components/underline/underline';

export function CreateSecretPhraseConfirmationPageContent() {
  const { t } = useTranslation();

  const items = [
    { key: 1, value: t('Save a backup in multiple secure locations.') },
    { key: 2, value: t('Never share the phrase with anyone.') },
    {
      key: 3,
      value: (
        <Trans>
          Be careful of phishing! Casper Wallet will{' '}
          <Underline>never</Underline> spontaneously ask you for your secret
          recovery phrase.
        </Trans>
      )
    },
    {
      key: 4,
      value: t(
        'If you need to back up your secret recovery phrase again, you can find it in Settings.'
      )
    },
    {
      key: 5,
      value: t(
        'Casper Wallet cannot recover your secret recovery phrase! If you lose it, you may not be able to recover your funds.'
      )
    }
  ];

  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>
          Before we generate your secret recovery phrase, please remember
        </Trans>
      </Typography>

      <VerticalSpaceContainer top={SpacingSize.ExtraLarge}>
        <TextList items={items} />
      </VerticalSpaceContainer>
    </TabPageContainer>
  );
}
