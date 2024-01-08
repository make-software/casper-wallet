import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SecretPhrase } from '@libs/crypto';
import { TabPageContainer, TabTextContainer } from '@libs/layout';
import {
  CopySecretPhraseBar,
  SecretPhraseWordsView,
  Typography
} from '@libs/ui';

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
