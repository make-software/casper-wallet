import React from 'react';
import { Typography } from '@libs/ui';
import { PageContainer, ContentContainer } from '@libs/layout';

export function AccountListPage() {
  return (
    <PageContainer>
      <ContentContainer>
        <Typography type="header" weight="bold">
          Account List
        </Typography>
      </ContentContainer>
    </PageContainer>
  );
}
