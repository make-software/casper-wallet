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
  selectVaultHasImportedAccount,
  selectVaultTimeoutDurationSetting
} from '@src/background/redux/vault/selectors';

interface ListItemClickableContainerProps {
  disabled: boolean;
}

const ListItemClickableContainer = styled(
  AlignedFlexRow
)<ListItemClickableContainerProps>`
  width: 100%;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

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
  description?: string;
  iconPath: string;
  disabled: boolean;
  currentValue?: string | number;
  handleOnClick?: () => void;
}

interface MenuGroup {
  headerLabel: string;
  items: MenuItem[];
}

export function NavigationMenuPageContent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const timeoutDurationSetting = useSelector(selectVaultTimeoutDurationSetting);
  const countOfConnectedSites = useSelector(selectCountOfConnectedSites);
  const vaultHasImportedAccount = useSelector(selectVaultHasImportedAccount);

  const { openWindow } = useWindowManager();
  const { closeNavigationMenu } = useNavigationMenu();

  const menuGroups: MenuGroup[] = useMemo(
    () => [
      {
        headerLabel: t('Account'),
        items: [
          {
            id: 1,
            title: t('Create account'),
            iconPath: 'assets/icons/plus.svg',
            disabled: false,
            handleOnClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.CreateAccount);
            }
          },
          {
            id: 2,
            title: t('Import account'),
            iconPath: 'assets/icons/upload.svg',
            disabled: false,
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
            disabled: false,
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
            disabled: false,
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
            iconPath: 'assets/icons/secure.svg',
            disabled: false,
            handleOnClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.BackupSecretPhrase);
            }
          },
          {
            id: 2,
            title: t('Download account keys'),
            description: t('For all accounts imported with a file'),
            iconPath: 'assets/icons/download.svg',
            disabled: !vaultHasImportedAccount,
            handleOnClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.DownloadSecretKeys);
            }
          }
        ]
      },
      {
        headerLabel: t('More'),
        items: [
          {
            id: 1,
            title: t('Share feedback'),
            iconPath: 'assets/icons/chat.svg',
            disabled: false
          },
          {
            id: 2,
            title: t('About us'),
            iconPath: 'assets/icons/team.svg',
            disabled: false
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
      timeoutDurationSetting,
      vaultHasImportedAccount
    ]
  );

  return (
    <ContentContainer>
      {menuGroups.map(({ headerLabel: groupLabel, items: groupItems }) => (
        <List
          key={groupLabel}
          headerLabel={groupLabel}
          rows={groupItems}
          marginLeftForItemSeparatorLine={60}
          renderRow={groupItem => (
            <ListItemClickableContainer
              disabled={groupItem.disabled}
              key={groupLabel + groupItem.id}
              onClick={groupItem.disabled ? undefined : groupItem.handleOnClick}
            >
              <SvgIcon
                src={groupItem.iconPath}
                color={groupItem.disabled ? 'contentSecondary' : 'contentBlue'}
              />
              <SpaceBetweenContainer>
                {groupItem.description ? (
                  <FlexColumn>
                    <Typography
                      type="body"
                      color={
                        groupItem.disabled
                          ? 'contentSecondary'
                          : 'contentPrimary'
                      }
                    >
                      {groupItem.title}
                    </Typography>
                    <Typography type="listSubtext" color="contentSecondary">
                      {groupItem.description}
                    </Typography>
                  </FlexColumn>
                ) : (
                  <Typography type="body">{groupItem.title}</Typography>
                )}
                {groupItem.currentValue != null && (
                  <Typography type="bodySemiBold" color="contentBlue">
                    {groupItem.currentValue}
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
