import React from 'react';
import styled from 'styled-components';

import {
  PageContainer,
  ContentContainer,
  TextContainer
} from '@src/libs/layout';
import { SvgIcon, Typography } from '@src/libs/ui';

import { ErrorPageContentProps } from './types';

const IllustrationContainer = styled.div`
  margin: 35px 16px;
`;

export function ErrorPageContent({
  errorContentText,
  errorHeaderText,
  layoutType
}: ErrorPageContentProps) {
  if (errorContentText == null || errorHeaderText == null) {
    throw new Error('Cannot render ErrorPage: not enough props');
  }

  if (layoutType !== 'tab' && layoutType !== 'window') {
    throw new Error('Unknown layout type');
  }

  return (
    <PageContainer>
      <ContentContainer>
        <IllustrationContainer>
          <SvgIcon
            src={
              layoutType === 'tab'
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
