import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { TabPageContainer, TabTextContainer, FlexRow } from '@libs/layout';
import { CopyToClipboard, SvgIcon, Typography } from '@libs/ui';

import { SecretPhraseWordsView } from '@src/apps/onboarding/components/secret-phrase-words-view';
import { mockedMnemonicPhrase } from '@src/apps/onboarding/mockedData';

const CopySecretPhraseContainer = styled(FlexRow)`
  gap: 4px;
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
            renderContent={({ isClicked }) => (
              <CopySecretPhraseContainer>
                <SvgIcon
                  src={
                    isClicked
                      ? 'assets/icons/checkbox-checked.svg'
                      : 'assets/icons/copy.svg'
                  }
                  color={isClicked ? 'contentGreen' : 'contentBlue'}
                />
                <Typography
                  type="captionMedium"
                  color={isClicked ? 'contentGreen' : 'contentBlue'}
                >
                  {isClicked
                    ? t('Copied to clipboard for 1 min')
                    : t('Copy secret phrase')}
                </Typography>
              </CopySecretPhraseContainer>
            )}
            valueToCopy={secretPhraseForCopy}
            cleanupTimeout={1000 * 60} // 1 minute
          />
        )}
      />
    </TabPageContainer>
  );
}
