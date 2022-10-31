import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import {
  TextContainer,
  PageContainer,
  ContentContainer,
  BreakWordContainer,
  VerticalSpaceContainer
} from '@src/libs/layout';
import { SiteFaviconBadge, List, SvgIcon, Typography } from '@src/libs/ui';

const ListItemContainer = styled.div`
  display: flex;

  width: 100%;
  padding: 14px 18px;

  & > * + * {
    padding-left: 18px;
  }

  & > span {
    white-space: nowrap;
  }
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
        <TextContainer gap="big">
          <SiteFaviconBadge origin={origin} />
          <VerticalSpaceContainer gap="medium">
            <Typography type="header">
              <BreakWordContainer>{title}</BreakWordContainer>
            </Typography>
          </VerticalSpaceContainer>
        </TextContainer>
        <List
          headerLabel={t('allow this site to')}
          rows={listItems}
          renderRow={listItem => (
            <ListItemContainer key={listItem.id}>
              <SvgIcon src={listItem.iconPath} color="contentTertiary" />
              <Typography type="body">{listItem.text}</Typography>
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
    </PageContainer>
  );
}
