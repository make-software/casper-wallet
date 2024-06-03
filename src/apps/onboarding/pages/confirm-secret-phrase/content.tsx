import React, { Dispatch, SetStateAction } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SecretPhrase } from '@libs/crypto';
import {
  SpacingSize,
  TabPageContainer,
  TabTextContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  SecretPhraseWordsView,
  Typography,
  WordPicker
} from '@libs/ui/components';

interface ConfirmSecretPhrasePageContentProps {
  phrase: SecretPhrase;
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
      <Typography type="captionMedium" color="contentActionCritical" uppercase>
        <Trans t={t}>Step 5</Trans>
      </Typography>
      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Typography type="headerBig">
          <Trans t={t}>Confirm your secret recovery phrase</Trans>
        </Typography>
      </VerticalSpaceContainer>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Choose the six words one by one to complete the secret recovery
            phrase
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
          onHiddenWordClick,
          handleResetPhrase
        }) => (
          <WordPicker
            dataTestId="word-picker"
            phrase={phrase}
            hiddenWordIndexes={hiddenWordIndexes}
            selectedHiddenWordIndexes={selectedHiddenWordIndexes}
            onHiddenWordClick={onHiddenWordClick}
            handleResetPhrase={handleResetPhrase}
          />
        )}
      />
    </TabPageContainer>
  );
}
