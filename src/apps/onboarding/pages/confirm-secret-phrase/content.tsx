import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Typography } from '@libs/ui';

import { WordPicker } from '@src/apps/onboarding/components/word-picker';
import { SecretPhraseWordsView } from '@src/apps/onboarding/components/secret-phrase-words-view';

import {
  mockedMnemonicPhraseConfirmation,
  mockedRemovedWordsFromMnemonicPhrase
} from '@src/apps/onboarding/mockedData';

export function ConfirmSecretPhrasePageContent() {
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
        phrase={mockedMnemonicPhraseConfirmation}
        confirmationMode
        renderHeader={() => (
          <WordPicker words={mockedRemovedWordsFromMnemonicPhrase} />
        )}
      />
    </TabPageContainer>
  );
}
