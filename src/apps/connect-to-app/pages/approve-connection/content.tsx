import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { HeaderTextContainer } from '@src/libs/layout';

import { PageContainer, ContentContainer } from '@src/libs/layout/containers';

import { SiteFaviconBadge, List, SvgIcon, Typography } from '@libs/ui';

const HeaderTextContent = styled.div`
  margin-top: 16px;
`;

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
        <HeaderTextContainer>
          <SiteFaviconBadge origin={origin} />
          <HeaderTextContent>
            <Typography type="header">
              <Trans t={t}>{title}</Trans>
            </Typography>
          </HeaderTextContent>
        </HeaderTextContainer>
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
