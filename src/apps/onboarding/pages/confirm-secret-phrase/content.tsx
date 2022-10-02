import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Typography } from '@libs/ui';

import { WordPicker } from '@src/apps/onboarding/components/word-picker';
import { PhraseBoard } from '@src/apps/onboarding/components/phrase-board';

import {
  mockedMnemonicPhrase,
  mockedWordCollection
} from '@src/apps/onboarding/mockedData';

export function ConfirmSecretPhrasePageContent() {
  const { t } = useTranslation();

  const mnemonicPhraseWithGaps = mockedMnemonicPhrase.map(word => {
    const isWordInCollection = mockedWordCollection.find(
      wordFromCollection =>
        word.order === wordFromCollection.order &&
        word.word === wordFromCollection.word
    );

    if (isWordInCollection) {
      return { ...word, word: null };
    }

    return word;
  });

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

      <WordPicker words={mockedWordCollection} />
      <PhraseBoard phrase={mnemonicPhraseWithGaps} />
    </TabPageContainer>
  );
}
