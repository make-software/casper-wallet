import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/libs/layout';
import {
  Typography,
  SecretPhraseWordsView,
  CopySecretPhraseBar,
  TextList
} from '@src/libs/ui';

import { selectVaultSecretPhrase } from '@background/redux/vault/selectors';

const WarningContainer = styled(TextContainer)`
  margin-top: unset;
`;

const ListSpacingContainer = styled.div`
  margin-top: 12px;
`;

const TipsContainer = styled(TextContainer)`
  margin-top: 24px;
`;

export function BackupSecretPhrasePageContent() {
  const { t } = useTranslation();

  const phrase = useSelector(selectVaultSecretPhrase);

  if (phrase == null) {
    throw new Error("Secret phrase wasn't found");
  }

  const items = [
    { key: 1, value: t('Save a backup in multiple places.') },
    { key: 2, value: t('Never share the phrase with anyone.') },
    {
      key: 3,
      value: t(
        'Be careful of phishing! Casper Signer will never spontaneously ask for your secret phrase.'
      )
    },
    {
      key: 4,
      value: t(
        'If you need to back up your secret phrase again, you can find it in Settings.'
      )
    },
    { key: 5, value: t('Casper Signer cannot recover your secret phrase.') }
  ];

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header">
          <Trans t={t}>Back up your secret phrase</Trans>
        </Typography>
      </HeaderTextContainer>
      <WarningContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Your secret recovery phrase controls all of your accounts. Your
            money will depend on it.
          </Trans>
        </Typography>
      </WarningContainer>

      <SecretPhraseWordsView
        phrase={phrase}
        renderFooter={({ secretPhraseForCopy }) => (
          <CopySecretPhraseBar secretPhraseForCopy={secretPhraseForCopy} />
        )}
      />

      <TipsContainer>
        <Typography type="bodySemiBold">
          <Trans t={t}>Tips on storing it safely</Trans>
        </Typography>
        <ListSpacingContainer>
          <TextList items={items} />
        </ListSpacingContainer>
      </TipsContainer>
    </ContentContainer>
  );
}
