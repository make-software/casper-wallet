import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { TabPageContainer, TabTextContainer } from '@libs/layout';
import { Typography } from '@libs/ui';

import { TextList } from '@src/apps/onboarding/components/text-list';
import { useSecurityNotes } from '@src/apps/onboarding/hooks/use-security-notes';

const TextListContainer = styled.div`
  margin-top: 16px;
`;

export function SecretPhraseConfirmedPageContent() {
  const { t } = useTranslation();

  const textListItems = useSecurityNotes();

  return (
    <TabPageContainer>
      <Typography type="header">
        <Trans t={t}>Awesome, your secret phrase is confirmed!</Trans>
      </Typography>

      <TabTextContainer>
        <Typography type="body" color="contentSecondary">
          <Trans t={t}>
            Please keep your secret phrase safe, it’s your responsibility.
          </Trans>
        </Typography>
      </TabTextContainer>
      <TabTextContainer>
        <Typography type="bodySemiBold">
          <Trans t={t}>Tips on storing it safely</Trans>
        </Typography>
      </TabTextContainer>

      <TextListContainer>
        <TextList textListItems={textListItems} />
      </TextListContainer>
    </TabPageContainer>
  );
}
