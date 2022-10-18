import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PurposeForOpening, useWindowManager } from '@src/hooks';

import { TimeoutDurationSetting } from '@popup/constants';
import { RouterPath, useNavigationMenu } from '@popup/router';
import {
  AlignedFlexRow,
  AlignedSpaceBetweenFlexRow,
  ContentContainer,
  FlexColumn
} from '@src/libs/layout/containers';
import { SvgIcon, Typography, List } from '@libs/ui';

import {
  selectCountOfConnectedSites,
  selectVaultTimeoutDurationSetting
} from '@src/background/redux/vault/selectors';

const ListItemClickableContainer = styled(AlignedFlexRow)`
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

export const SpaceBetweenContainer = styled(AlignedSpaceBetweenFlexRow)`
  width: 100%;
`;

interface MenuItem {
  id: number;
  title: string;
  subTitle?: string;
  iconPath: string;
  currentValue?: string | number;
  handleOnClick?: () => void;
}

interface MenuItems {
  headerLabel: string;
  items: MenuItem[];
}

export function NavigationMenuPageContent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const timeoutDurationSetting = useSelector(selectVaultTimeoutDurationSetting);
  const countOfConnectedSites = useSelector(selectCountOfConnectedSites);

  const { openWindow } = useWindowManager();
  const { closeNavigationMenu } = useNavigationMenu();

  const menu: MenuItems[] = useMemo(
    () => [
      {
        headerLabel: t('Account'),
        items: [
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
          }
        ]
      },
      {
        headerLabel: t('Settings'),
        items: [
          {
            id: 1,
            title: t('Connected sites'),
            iconPath: 'assets/icons/link.svg',
            currentValue: countOfConnectedSites,
            handleOnClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.ConnectedSites);
            }
          },
          {
            id: 2,
            title: t('Timeout'),
            iconPath: 'assets/icons/lock.svg',
            currentValue: TimeoutDurationSetting[timeoutDurationSetting],
            handleOnClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.Timeout);
            }
          }
        ]
      },
      {
        headerLabel: t('Security'),
        items: [
          {
            id: 1,
            title: t('Back up your secret phrase'),
            iconPath: 'assets/icons/secure.svg'
          },
          {
            id: 2,
            title: t('Download account keys'),
            subTitle: t('For all accounts imported with a file'),
            iconPath: 'assets/icons/download.svg'
          }
        ]
      },
      {
        headerLabel: t('More'),
        items: [
          {
            id: 1,
            title: t('Share feedback'),
            iconPath: 'assets/icons/chat.svg'
          },
          {
            id: 2,
            title: t('About us'),
            iconPath: 'assets/icons/team.svg'
          }
        ]
      }
    ],
    [
      t,
      navigate,
      openWindow,
      closeNavigationMenu,
      countOfConnectedSites,
      timeoutDurationSetting
    ]
  );

  const iconSize = 24;

  return (
    <ContentContainer>
      {menu.map(({ headerLabel, items }) => (
        <List
          headerLabel={headerLabel}
          rows={items}
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
                {menuItem.subTitle ? (
                  <FlexColumn>
                    <Typography type="body">{menuItem.title}</Typography>
                    <Typography type="listSubtext" color="contentSecondary">
                      {menuItem.subTitle}
                    </Typography>
                  </FlexColumn>
                ) : (
                  <Typography type="body">{menuItem.title}</Typography>
                )}
                {menuItem.currentValue != null && (
                  <Typography type="bodySemiBold" color="contentBlue">
                    {menuItem.currentValue}
                  </Typography>
                )}
              </SpaceBetweenContainer>
            </ListItemClickableContainer>
          )}
        />
      ))}
    </ContentContainer>
  );
}
