import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { WindowApp, useWindowManager } from '@src/hooks';

import { RouterPath, useNavigationMenu } from '@src/apps/popup/router';

import {
  ContentContainer,
  ListItemClickableContainer as BaseListItemClickableContainer,
  FlexColumn,
  SpaceBetweenFlexRow,
  SpacingSize
} from '@src/libs/layout';
import { SvgIcon, Typography, List, Link } from '@src/libs/ui';

import {
  selectCountOfConnectedSites,
  selectVaultHasImportedAccount
} from '@src/background/redux/vault/selectors';
import { selectTimeoutDurationSetting } from '@src/background/redux/settings/selectors';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { lockVault } from '@src/background/redux/sagas/actions';
import { TimeoutDurationSetting } from '@popup/constants';
import { isSafariBuild } from '@src/utils';

interface ListItemClickableContainerProps {
  disabled: boolean;
  hide?: boolean;
}

const ListItemClickableContainer = styled(
  BaseListItemClickableContainer
)<ListItemClickableContainerProps>`
  display: ${({ hide }) => hide && 'none'};
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  &:hover svg {
    color: ${({ theme }) => theme.color.contentBlue};
  }
`;

export const SpaceBetweenContainer = styled(SpaceBetweenFlexRow)`
  align-items: center;
`;

interface MenuItem {
  id: number;
  title: string;
  description?: string;
  iconPath: string;
  href?: string;
  disabled: boolean;
  currentValue?: string | number;
  handleOnClick?: () => void;
  hide?: boolean;
}

interface MenuGroup {
  headerLabel: string;
  items: MenuItem[];
}

export function NavigationMenuPageContent() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const timeoutDurationSetting = useSelector(selectTimeoutDurationSetting);
  const countOfConnectedSites = useSelector(selectCountOfConnectedSites);
  const vaultHasImportedAccount = useSelector(selectVaultHasImportedAccount);

  const { openWindow } = useWindowManager();
  const { closeNavigationMenu } = useNavigationMenu();

  const menuGroups: MenuGroup[] = useMemo(
    () => [
      {
        headerLabel: '',
        items: [
          {
            id: 1,
            title: t('Lock wallet'),
            iconPath: 'assets/icons/lock.svg',
            disabled: false,
            handleOnClick: () => {
              dispatchToMainStore(lockVault());
            }
          }
        ]
      },
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
            description: t('From Signer secret key file'),
            iconPath: 'assets/icons/upload.svg',
            disabled: false,
            handleOnClick: () => {
              closeNavigationMenu();
              openWindow({
                windowApp: WindowApp.ImportAccount
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
            title: t('Back up your secret recovery phrase'),
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
            description: t('For all accounts imported via file'),
            iconPath: 'assets/icons/download.svg',
            disabled: !vaultHasImportedAccount,
            // https://github.com/make-software/casper-wallet/issues/611
            hide: isSafariBuild,
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
            href: 'https://casper-wallet.canny.io/feature-requests',
            disabled: false
          },
          {
            id: 2,
            title: t('About us'),
            iconPath: 'assets/icons/team.svg',
            href: 'https://make.services/',
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
      {menuGroups.map(
        ({ headerLabel: groupLabel, items: groupItems }, index) => (
          <List
            key={groupLabel}
            headerLabel={groupLabel}
            rows={groupItems}
            marginLeftForItemSeparatorLine={60}
            headerLabelTop={SpacingSize.Large}
            contentTop={index === 0 ? SpacingSize.Medium : SpacingSize.Small}
            renderRow={groupItem => (
              <ListItemClickableContainer
                disabled={groupItem.disabled}
                key={groupLabel + groupItem.id}
                as={groupItem.href ? Link : 'div'}
                href={groupItem.href ? groupItem.href : undefined}
                target={groupItem.href ? '_blank' : undefined}
                onClick={
                  groupItem.disabled ? undefined : groupItem.handleOnClick
                }
                hide={groupItem.hide}
              >
                <SvgIcon
                  src={groupItem.iconPath}
                  color={
                    groupItem.disabled ? 'contentSecondary' : 'contentBlue'
                  }
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
        )
      )}
    </ContentContainer>
  );
}
