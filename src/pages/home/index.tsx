import React from 'react';
import { Typography } from '@src/libs/ui';
import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';

export function HomePageContent() {
  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="semiBold">
          Home Page
        </Typography>
      </HeaderTextContainer>

      <TextContainer>
        <Typography type="body" weight="regular" color="contentSecondary">
          Not implemented yet
        </Typography>
      </TextContainer>
    </ContentContainer>
  );
}
