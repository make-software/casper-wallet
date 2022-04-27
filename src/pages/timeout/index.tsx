import React from 'react';

import {
  ContentContainer,
  HeaderTextContainer,
  TextContainer
} from '@src/layout/containers';

import { Typography, List } from '@src/libs/ui';

export function TimeoutPageContent() {
  const times = ['1 min', '5 min', '15 min', '30 min', '1 hour', '24 hours'];

  return (
    <ContentContainer>
      <HeaderTextContainer>
        <Typography type="header" weight="bold">
          Timeout
        </Typography>
      </HeaderTextContainer>
      <TextContainer>
        <Typography type="body" weight="regular" variation="contentSecondary">
          Your vault will be automatically locked after some period of
          inactivity.
        </Typography>

        <List items={times} />
      </TextContainer>
    </ContentContainer>
  );
}
