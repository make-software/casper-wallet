import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  ParagraphContainer,
  PageContainer,
  ContentContainer,
  BreakWordContainer,
  VerticalSpaceContainer,
  ListItemClickableContainer,
  SpacingSize
} from '@src/libs/layout';
import { SiteFaviconBadge, List, SvgIcon, Typography } from '@src/libs/ui';

const ListItemContainer = styled(ListItemClickableContainer)`
  cursor: unset;
  justify-content: unset;
`;

interface ApproveConnectionContentProps {
  origin: string;
  title: string;
}

export function ApproveConnectionContent({
  origin,
  title
}: ApproveConnectionContentProps) {
  const { t } = useTranslation();

  const listItems = [
    {
      id: 1,
      text: t('See address, balance, activity'),
      iconPath: 'assets/icons/show.svg'
    },
    {
      id: 2,
      text: t('Suggest transaction to approve'),
      iconPath: 'assets/icons/thumb-up.svg'
    }
  ];

  return (
    <PageContainer>
      <ContentContainer>
        <ParagraphContainer top={SpacingSize.XL}>
          <SiteFaviconBadge origin={origin} />
          <VerticalSpaceContainer top={SpacingSize.Medium}>
            <Typography type="header">
              <BreakWordContainer>{title}</BreakWordContainer>
            </Typography>
          </VerticalSpaceContainer>
        </ParagraphContainer>
        <List
          headerLabel={t('allow this site to')}
          rows={listItems}
          contentTop={SpacingSize.Small}
          renderRow={listItem => (
            <ListItemContainer key={listItem.id}>
              <SvgIcon src={listItem.iconPath} color="contentDisabled" />
              <Typography type="body">{listItem.text}</Typography>
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
    </PageContainer>
  );
}
