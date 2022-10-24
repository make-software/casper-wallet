import React from 'react';
import styled from 'styled-components';

import {
  PageContainer,
  ContentContainer,
  TextContainer
} from '@src/libs/layout';
import { SvgIcon, Typography } from '@src/libs/ui';

import { ErrorContent } from './types';

const IllustrationContainer = styled.div`
  margin: 35px 16px;
`;

interface ErrorPageContentProps extends ErrorContent {
  // TODO: I guess will be better pass it through location state. It require extending of location state type
  illustrationType: 'onboarding' | 'general';
}

export function ErrorPageContent({
  errorContentText,
  errorHeaderText,
  illustrationType
}: ErrorPageContentProps) {
  if (errorContentText == null || errorHeaderText == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  return (
    <PageContainer>
      <ContentContainer>
        <IllustrationContainer>
          <SvgIcon
            src={
              illustrationType === 'onboarding'
                ? 'assets/illustrations/error.svg'
                : 'assets/illustrations/process-error.svg'
            }
            size={140}
          />
        </IllustrationContainer>
        <TextContainer>
          <Typography type="header">{errorHeaderText}</Typography>
        </TextContainer>

        <TextContainer>
          <Typography type="body" color="contentSecondary">
            {errorContentText}
          </Typography>
        </TextContainer>
      </ContentContainer>
    </PageContainer>
  );
}
