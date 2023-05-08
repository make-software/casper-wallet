import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@src/libs/layout';
import {
  Typography,
  SecretPhraseWordsView,
  CopySecretPhraseBar
} from '@src/libs/ui';
import { SecretPhrase } from '@src/libs/crypto';

interface WriteDownSecretPhrasePageContentProps {
  phrase: SecretPhrase;
}

export function WriteDownSecretPhrasePageContent({
  phrase
}: WriteDownSecretPhrasePageContentProps) {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>Write down your secret recovery phrase</Trans>
      </Typography>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Never disclose your secret recovery phrase. Anyone with this phrase
            can take your funds forever.
          </Trans>
        </Typography>
      </TabTextContainer>

      <SecretPhraseWordsView
        phrase={phrase}
        renderFooter={({ secretPhraseForCopy }) => (
          <CopySecretPhraseBar secretPhraseForCopy={secretPhraseForCopy} />
        )}
      />
    </TabPageContainer>
  );
}
