import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PurposeForOpening, useWindowManager } from '@src/hooks';

import { TimeoutDurationSetting } from '@popup/constants';
import { RouterPath, useNavigationMenu } from '@popup/router';
import { ContentContainer } from '@layout/containers';
import { SvgIcon, Typography, List } from '@libs/ui';

import { selectVaultTimeoutDurationSetting } from '@popup/redux/vault/selectors';

const ListItemClickableContainer = styled.div`
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

export const MenuItemTitleContainer = styled.div`
  display: flex;
  align-items: center;

  width: 100%;
`;

interface MenuItem {
  id: number;
  title: string;
  iconPath: string;
  currentValue?: string | number;
  handleOnClick?: () => void;
}

export function NavigationMenuPageContent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const timeoutDuration = useSelector(selectVaultTimeoutDurationSetting);

  const { openWindow } = useWindowManager();
  const { closeNavigationMenu } = useNavigationMenu();

  const menuItems: MenuItem[] = useMemo(
    () => [
      {
        id: 1,
        title: t('Create account'),
        iconPath: 'assets/icons/plus.svg'
      },
      {
        id: 2,
        title: t('Import account'),
        iconPath: 'assets/icons/upload.svg',
        handleOnClick: () => {
          closeNavigationMenu();
          openWindow(PurposeForOpening.ImportAccount).catch(e =>
            console.error(e)
          );
        }
      },
      {
        id: 3,
        title: t('Connected sites'),
        iconPath: 'assets/icons/link.svg',
        currentValue: 3
      },
      {
        id: 4,
        title: t('Timeout'),
        iconPath: 'assets/icons/lock.svg',
        currentValue: TimeoutDurationSetting[timeoutDuration],
        handleOnClick: () => {
          closeNavigationMenu();
          navigate(RouterPath.Timeout);
        }
      }
    ],
    [navigate, t, timeoutDuration, closeNavigationMenu, openWindow]
  );
  const iconSize = 24;

  return (
    <ContentContainer>
      <List
        rows={menuItems}
        marginLeftForItemSeparatorLine={60}
        renderRow={menuItem => (
          <ListItemClickableContainer
            key={menuItem.id}
            onClick={menuItem.handleOnClick}
          >
            <SvgIcon
              src={menuItem.iconPath}
              size={iconSize}
              color="contentBlue"
            />
            <MenuItemTitleContainer>
              <Typography type="body" weight="regular">
                {menuItem.title}
              </Typography>
            </MenuItemTitleContainer>
            {menuItem.currentValue && (
              <Typography type="body" weight="semiBold" color="contentBlue">
                {menuItem.currentValue}
              </Typography>
            )}
          </ListItemClickableContainer>
        )}
      />
    </ContentContainer>
  );
}
