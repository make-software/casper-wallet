import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Typography } from '@libs/ui';

import { PhraseBoard } from '@src/apps/onboarding/components/phrase-board';
import { mockedMnemonicPhrase } from '@src/apps/onboarding/mockedData';

export function WriteDownSecretPhrasePageContent() {
  const { t } = useTranslation();
  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>Write down your secret phrase</Trans>
      </Typography>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Never disclose your secret phrase. Anyone with this phrase can take
            your Casper forever.
          </Trans>
        </Typography>
      </TabTextContainer>

      <PhraseBoard
        phrase={mockedMnemonicPhrase}
        withHiddenContentOnStart
        withCopyToClipboardControls
      />
    </TabPageContainer>
  );
}
