import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { SecretPhrase } from '@libs/crypto';
import {
  SpacingSize,
  TabPageContainer,
  TabTextContainer,
  VerticalSpaceContainer
} from '@libs/layout';
import {
  CopySecretPhraseBar,
  SecretPhraseWordsView,
  Typography
} from '@libs/ui/components';

interface WriteDownSecretPhrasePageContentProps {
  phrase: SecretPhrase;
}

export function WriteDownSecretPhrasePageContent({
  phrase
}: WriteDownSecretPhrasePageContentProps) {
  const { t } = useTranslation();

  return (
    <TabPageContainer>
      <Typography type="captionMedium" color="contentActionCritical" uppercase>
        <Trans t={t}>Step 4</Trans>
      </Typography>
      <VerticalSpaceContainer top={SpacingSize.Tiny}>
        <Typography type="headerBig">
          <Trans t={t}>Write down your secret recovery phrase</Trans>
        </Typography>
      </VerticalSpaceContainer>

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
