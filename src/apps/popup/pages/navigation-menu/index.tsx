import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PurposeForOpening, useWindowManager } from '@src/hooks';

import { TimeoutDurationSetting } from '@popup/constants';
import { RouterPath, useNavigationMenu } from '@popup/router';
import { ContentContainer } from '@src/libs/layout/containers';
import { SvgIcon, Typography, List } from '@libs/ui';

import {
  selectCountOfConnectedSites,
  selectVaultTimeoutDurationSetting
} from '@src/background/redux/vault/selectors';

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

export const SpaceBetweenContainer = styled.div`
  display: flex;
  justify-content: space-between;
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

  const timeoutDurationSetting = useSelector(selectVaultTimeoutDurationSetting);
  const countOfConnectedSites = useSelector(selectCountOfConnectedSites);

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
          openWindow({
            purposeForOpening: PurposeForOpening.ImportAccount
          }).catch(e => console.error(e));
        }
      },
      {
        id: 3,
        title: t('Connected sites'),
        iconPath: 'assets/icons/link.svg',
        currentValue: countOfConnectedSites,
        handleOnClick: () => {
          closeNavigationMenu();
          navigate(RouterPath.ConnectedSites);
        }
      },
      {
        id: 4,
        title: t('Timeout'),
        iconPath: 'assets/icons/lock.svg',
        currentValue: TimeoutDurationSetting[timeoutDurationSetting],
        handleOnClick: () => {
          closeNavigationMenu();
          navigate(RouterPath.Timeout);
        }
      }
    ],
    [
      navigate,
      t,
      timeoutDurationSetting,
      closeNavigationMenu,
      countOfConnectedSites,
      openWindow
    ]
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
            <SpaceBetweenContainer>
              <Typography type="body" weight="regular">
                {menuItem.title}
              </Typography>
              {menuItem.currentValue != null && (
                <Typography type="body" weight="semiBold" color="contentBlue">
                  {menuItem.currentValue}
                </Typography>
              )}
            </SpaceBetweenContainer>
          </ListItemClickableContainer>
        )}
      />
    </ContentContainer>
  );
}
