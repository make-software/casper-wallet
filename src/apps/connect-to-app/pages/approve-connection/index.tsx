import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { HeaderTextContainer } from '@src/libs/layout';

import {
  PageContainer,
  ContentContainer,
  FooterButtonsContainer
} from '@src/libs/layout/containers';

import { Button, SiteFaviconBadge, List, SvgIcon, Typography } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@connect-to-app/router';
import { closeActiveWindow } from '@src/background/close-window';
import { useAccountManager } from '@src/apps/popup/hooks/use-account-actions-with-events';

const HeaderTextContent = styled.div`
  margin-top: 16px;
`;

const TextCentredContainer = styled.div`
  text-align: center;
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

  const { connectAccountsWithEvent: connectAccounts } = useAccountManager();

  const handleApproveConnection = () => {
    connectAccounts(selectedAccountNames, origin);
    navigate(RouterPath.Connecting);
  };
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
    <PageContainer>
      <ContentContainer>
        <HeaderTextContainer>
          <SiteFaviconBadge origin={origin} />
          <HeaderTextContent>
            <Typography type="header">
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
              <Typography type="body">{listItem.text}</Typography>
            </ListItemContainer>
          )}
          marginLeftForItemSeparatorLine={60}
        />
      </ContentContainer>
      <FooterButtonsContainer>
        <TextCentredContainer>
          <Typography type="captionRegular">
            <Trans t={t}>Only connect with sites you trust</Trans>
          </Typography>
        </TextCentredContainer>
        <Button onClick={handleApproveConnection}>
          {/* TODO: optimize text in Trans component below */}
          <Trans t={t}>
            Connect to {{ selectedAccountNamesLength }}{' '}
            {selectedAccountNames.length > 1 ? t('accounts') : t('account')}
          </Trans>
        </Button>
        <Button color="secondaryBlue" onClick={() => closeActiveWindow()}>
          <Trans t={t}>Cancel</Trans>
        </Button>
      </FooterButtonsContainer>
    </PageContainer>
  );
}
