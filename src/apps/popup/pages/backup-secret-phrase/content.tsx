import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  ContentContainer,
  TextContainer,
  VerticalSpaceContainer
} from '@src/libs/layout';
import {
  Typography,
  SecretPhraseWordsView,
  CopySecretPhraseBar,
  TextList
} from '@src/libs/ui';
import { selectSessionSecretPhrase } from '@src/background/redux/session/selectors';

export function BackupSecretPhrasePageContent() {
  const { t } = useTranslation();

  const phrase = useSelector(selectSessionSecretPhrase);

  if (phrase == null) {
    throw new Error("Secret phrase wasn't found");
  }

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
    <ContentContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Back up your secret phrase</Trans>
        </Typography>
      </TextContainer>
      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Your secret recovery phrase controls all of your accounts. Your
            money will depend on it.
          </Trans>
        </Typography>
      </TextContainer>

      <SecretPhraseWordsView
        phrase={phrase}
        renderFooter={({ secretPhraseForCopy }) => (
          <CopySecretPhraseBar secretPhraseForCopy={secretPhraseForCopy} />
        )}
      />

      <TextContainer gap="big">
        <Typography type="bodySemiBold">
          <Trans t={t}>Tips on storing it safely</Trans>
        </Typography>
        <VerticalSpaceContainer gap="small">
          <TextList items={items} />
        </VerticalSpaceContainer>
      </TextContainer>
    </ContentContainer>
  );
}
