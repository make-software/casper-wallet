import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { selectSecretPhrase } from '@background/redux/vault/selectors';

import {
  ContentContainer,
  ParagraphContainer,
  SpacingSize,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  CopySecretPhraseBar,
  SecretPhraseWordsView,
  TextList,
  Typography
} from '@libs/ui';

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
      value: (
        <Trans>
          Be careful of phishing! Casper Wallet will never spontaneously ask you
          for your secret recovery phrase.
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
    <ContentContainer>
      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="header">
          <Trans t={t}>Back up your secret recovery phrase</Trans>
        </Typography>
      </ParagraphContainer>
      <ParagraphContainer top={SpacingSize.Medium}>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Use your secret recovery phrase to recover access to your accounts.
          </Trans>
        </Typography>
      </ParagraphContainer>

      <SecretPhraseWordsView
        phrase={secretPhrase}
        renderFooter={({ secretPhraseForCopy }) => (
          <CopySecretPhraseBar secretPhraseForCopy={secretPhraseForCopy} />
        )}
      />

      <ParagraphContainer top={SpacingSize.XL}>
        <Typography type="bodySemiBold">
          <Trans t={t}>Safety tips:</Trans>
        </Typography>
        <VerticalSpaceContainer top={SpacingSize.Small}>
          <TextList items={items} />
        </VerticalSpaceContainer>
      </ParagraphContainer>
    </ContentContainer>
  );
}
