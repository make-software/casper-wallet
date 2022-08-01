import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { HeaderTextContainer } from '@src/layout';

import {
  ContentContainer,
  FooterButtonsContainer,
  PaddingContainer
} from '@connect-to-app/layout';

import {
  Button,
  CurrentSiteFavicon,
  List,
  SvgIcon,
  Typography
} from '@libs/ui';
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

interface ApproveConnectionPageContentProps {
  selectedAccountNames: string[];
  faviconUrl: string;
  originName: string;
  headerText: string;
}

export function ApproveConnectionPageContent({
  selectedAccountNames,
  faviconUrl,
  originName,
  headerText
}: ApproveConnectionPageContentProps) {
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
    <ContentContainer>
      <PaddingContainer>
        {faviconUrl ? (
          <HeaderTextContainer>
            <CurrentSiteFavicon faviconUrl={faviconUrl} hostName={originName} />
            <HeaderTextContent>
              <Typography type="header" weight="bold">
                <Trans t={t}>{headerText}</Trans>
              </Typography>
            </HeaderTextContent>
          </HeaderTextContainer>
        ) : (
          <HeaderTextContainer>
            <Typography type="header" weight="bold">
              <Trans t={t}>{headerText}</Trans>
            </Typography>
          </HeaderTextContainer>
        )}
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
      </PaddingContainer>
      <FooterButtonsContainer>
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
      </FooterButtonsContainer>
    </ContentContainer>
  );
}
