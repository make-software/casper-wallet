import React, { Dispatch, SetStateAction } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Typography } from '@libs/ui';

import { WordPicker } from '@src/apps/onboarding/components/word-picker';
import { SecretPhraseWordsView } from '@src/apps/onboarding/components/secret-phrase-words-view';

interface ConfirmSecretPhrasePageContentProps {
  phrase: string[];
  setIsFormValid: Dispatch<SetStateAction<boolean>>;
  setIsConfirmationSuccess: Dispatch<SetStateAction<boolean>>;
}

export function ConfirmSecretPhrasePageContent({
  phrase,
  setIsFormValid,
  setIsConfirmationSuccess
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
        setIsConfirmationSuccess={setIsConfirmationSuccess}
        setIsFormValid={setIsFormValid}
        renderHeader={({
          phrase,
          hiddenWordIndexes,
          selectedHiddenWordIndexes,
          onHiddenWordClick
        }) => (
          <WordPicker
            phrase={phrase}
            hiddenWordIndexes={hiddenWordIndexes}
            selectedHiddenWordIndexes={selectedHiddenWordIndexes}
            onHiddenWordClick={onHiddenWordClick}
          />
        )}
      />
    </TabPageContainer>
  );
}
