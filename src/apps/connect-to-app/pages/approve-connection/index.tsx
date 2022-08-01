import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { HeaderTextContainer } from '@src/layout';

import { Page, Content, FooterButtons } from '@connect-to-app/layout';

import { Button, SiteFaviconBudge, List, SvgIcon, Typography } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@connect-to-app/router';
import { closeWindow } from '@connect-to-app/utils/closeWindow';

const HeaderTextContent = styled.div`
  margin-top: 16px;
`;

const TextCentredContainer = styled.div`
  text-align: center;
`;

export const ListItemContainer = styled.div`
  display: flex;

  width: 100%;
  cursor: pointer;

  padding: 14px 18px;
  & > * + * {
    padding-left: 18px;
  }

  & > span {
    white-space: nowrap;
  }
`;

interface ApproveConnectionPageProps {
  selectedAccountNames: string[];
  origin: string;
  headerText: string;
}

export function ApproveConnectionPage({
  selectedAccountNames,
  origin,
  headerText
}: ApproveConnectionPageProps) {
  const navigate = useTypedNavigate();
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

  const selectedAccountNamesLength = selectedAccountNames.length;

  return (
    <Page>
      <Content>
        <HeaderTextContainer>
          <SiteFaviconBudge origin={origin} />
          <HeaderTextContent>
            <Typography type="header" weight="bold">
              <Trans t={t}>{headerText}</Trans>
            </Typography>
          </HeaderTextContent>
        </HeaderTextContainer>
        <List
          headerLabel={t('allow this site to')}
          rows={listItems}
          renderRow={listItem => (
            <ListItemContainer key={listItem.id}>
              <SvgIcon
                src={listItem.iconPath}
                size={24}
                color="contentTertiary"
              />
              <Typography type="body" weight="regular">
                {listItem.text}
              </Typography>
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </Content>
      <FooterButtons>
        <TextCentredContainer>
          <Typography type="caption" weight="regular">
            <Trans t={t}>Only connect with sites you trust</Trans>
          </Typography>
        </TextCentredContainer>
        <Button onClick={() => navigate(RouterPath.Connecting)}>
          {/* TODO: optimize text in Trans component below */}
          <Trans t={t}>
            Connect to {{ selectedAccountNamesLength }}{' '}
            {selectedAccountNames.length > 1 ? t('accounts') : t('account')}
          </Trans>
        </Button>
        <Button color="secondaryBlue" onClick={() => closeWindow()}>
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtons>
    </Page>
  );
}
