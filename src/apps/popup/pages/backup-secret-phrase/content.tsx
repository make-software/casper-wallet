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
import { selectSecretPhrase } from '@src/background/redux/vault/selectors';

export function BackupSecretPhrasePageContent() {
  const { t } = useTranslation();

  const secretPhrase = useSelector(selectSecretPhrase);

  if (secretPhrase == null) {
    throw Error("Secret Phrase doesn't exist");
  }

  const items = [
    { key: 1, value: t('Save a backup in multiple secure locations.') },
    { key: 2, value: t('Never share the phrase with anyone.') },
    {
      key: 3,
      value: t(
        'Be careful of phishing! Casper Wallet will never spontaneously ask you for your secret recovery phrase.'
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
    <ContentContainer>
      <TextContainer gap="big">
        <Typography type="header">
          <Trans t={t}>Back up your secret recovery phrase</Trans>
        </Typography>
      </TextContainer>
      <TextContainer gap="medium">
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Use your secret recovery phrase to recover access to your accounts.
          </Trans>
        </Typography>
      </TextContainer>

      <SecretPhraseWordsView
        phrase={secretPhrase}
        renderFooter={({ secretPhraseForCopy }) => (
          <CopySecretPhraseBar secretPhraseForCopy={secretPhraseForCopy} />
        )}
      />

      <TextContainer gap="big">
        <Typography type="bodySemiBold">
          <Trans t={t}>Safety tips:</Trans>
        </Typography>
        <VerticalSpaceContainer gap="small">
          <TextList items={items} />
        </VerticalSpaceContainer>
      </TextContainer>
    </ContentContainer>
  );
}
