import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import {
  TabPageContainer,
  TabTextContainer,
  VerticalSpaceContainer
} from '@src/libs/layout';
import { Typography, TextList } from '@src/libs/ui';

export function ConfirmSecretPhraseSuccessPageContent() {
  const { t } = useTranslation();

  const items = [
    { key: 1, value: t('Save a backup in multiple places.') },
    { key: 2, value: t('Never share the phrase with anyone.') },
    {
      key: 3,
      value: t(
        'Be careful of phishing! Casper Signer will never spontaneously ask for your secret phrase.'
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
        <Trans t={t}>Awesome, your secret phrase is confirmed!</Trans>
      </Typography>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Please keep your secret phrase safe, it’s your responsibility.
          </Trans>
        </Typography>
      </TabTextContainer>
      <TabTextContainer>
        <Typography type="bodySemiBold">
          <Trans t={t}>Tips on storing it safely</Trans>
        </Typography>
      </TabTextContainer>

      <VerticalSpaceContainer gap="medium">
        <TextList items={items} />
      </VerticalSpaceContainer>
    </TabPageContainer>
  );
}
