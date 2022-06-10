import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { PurposeForOpening, useWindowManager } from '@src/hooks';

import { TimeoutDurationSetting } from '@popup/constants';
import { RouterPath, useNavigationMenu } from '@popup/router';
import { ContentContainer } from '@layout/containers';
import {
  SvgIcon,
  Typography,
  List,
  ListItemValueContainer,
  ListItemContentContainer,
  ListItemContainer,
  ListItemIconContainer
} from '@libs/ui';

import { selectVaultTimeoutDurationSetting } from '@popup/redux/vault/selectors';

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
        renderRow={menuItems =>
          menuItems.map(menuItem => (
            <ListItemContainer
              key={menuItem.id}
              onClick={menuItem.handleOnClick}
            >
              <ListItemIconContainer>
                <SvgIcon
                  src={menuItem.iconPath}
                  size={iconSize}
                  color="contentBlue"
                />
              </ListItemIconContainer>
              <ListItemContentContainer withBottomBorder>
                <Typography type="body" weight="regular">
                  {menuItem.title}
                </Typography>
              </ListItemContentContainer>

              {menuItem.currentValue && (
                <ListItemValueContainer withBottomBorder>
                  <Typography type="body" weight="semiBold" color="contentBlue">
                    {menuItem.currentValue}
                  </Typography>
                </ListItemValueContainer>
              )}
            </ListItemContainer>
          ))
        }
      />
    </ContentContainer>
  );
}
