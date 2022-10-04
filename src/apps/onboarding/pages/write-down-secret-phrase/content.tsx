import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { TabPageContainer, TabTextContainer, FlexRow } from '@libs/layout';
import { CopyToClipboard, SvgIcon, Typography } from '@libs/ui';

import { SecretPhraseWordsView } from '@src/apps/onboarding/components/secret-phrase-words-view';
import { mockedMnemonicPhrase } from '@src/apps/onboarding/mockedData';

const CopySecretPhraseStatusContainer = styled(FlexRow)`
  gap: 4px;
`;

const CopySecretPhraseClickableContainer = styled(
  CopySecretPhraseStatusContainer
)`
  cursor: pointer;
`;

export function WriteDownSecretPhrasePageContent() {
  const { t } = useTranslation();

  const secretPhraseForCopy = mockedMnemonicPhrase.map(word => word).join(' ');

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

      <SecretPhraseWordsView
        phrase={mockedMnemonicPhrase}
        withHiddenContentOnStart
        renderFooter={() => (
          <CopyToClipboard
            renderClickableComponent={() => (
              <CopySecretPhraseClickableContainer>
                <SvgIcon
                  src="assets/icons/copy.svg"
                  size={24}
                  color="contentBlue"
                />
                <Typography type="captionMedium" color="contentBlue">
                  <Trans t={t}>Copy secret phrase</Trans>
                </Typography>
              </CopySecretPhraseClickableContainer>
            )}
            renderStatusComponent={() => (
              <CopySecretPhraseStatusContainer>
                <SvgIcon
                  src="assets/icons/checkbox-checked.svg"
                  size={24}
                  color="contentGreen"
                />
                <Typography type="captionMedium" color="contentGreen">
                  <Trans t={t}>Copied to clipboard for 1 min</Trans>
                </Typography>
              </CopySecretPhraseStatusContainer>
            )}
            valueToCopy={secretPhraseForCopy}
            cleanupTimeout={1000 * 60} // 1 minute
          />
        )}
      />
    </TabPageContainer>
  );
}
