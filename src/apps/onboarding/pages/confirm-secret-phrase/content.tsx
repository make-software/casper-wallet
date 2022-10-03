import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Typography } from '@libs/ui';

import { WordPicker } from '@src/apps/onboarding/components/word-picker';
import { SecretPhraseWordsView } from '@src/apps/onboarding/components/secret-phrase-words-view';

interface ConfirmSecretPhrasePageContentProps {
  phrase: string[];
}

export function ConfirmSecretPhrasePageContent({
  phrase
}: ConfirmSecretPhrasePageContentProps) {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>Confirm your secret phrase</Trans>
      </Typography>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Click one by one 6 words to complete the secret phrase below.
          </Trans>
        </Typography>
      </TabTextContainer>

      <SecretPhraseWordsView
        phrase={phrase}
        confirmationMode
        renderHeader={({ removedWords, selectedWords, onRemovedWordClick }) => (
          <WordPicker
            words={removedWords}
            selectedWords={selectedWords}
            onRemovedWordClick={onRemovedWordClick}
          />
        )}
      />
    </TabPageContainer>
  );
}
