import React, { useEffect, useMemo } from 'react';
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
import { SvgIcon, Typography, List, Link, Toggle } from '@src/libs/ui';

import {
  selectCountOfConnectedSites,
  selectVaultHasImportedAccount
} from '@src/background/redux/vault/selectors';
import {
  selectDarkModeSetting,
  selectTimeoutDurationSetting
} from '@src/background/redux/settings/selectors';
import { dispatchToMainStore } from '@src/background/redux/utils';
import { lockVault } from '@src/background/redux/sagas/actions';
import { TimeoutDurationSetting } from '@popup/constants';
import { isSafariBuild } from '@src/utils';
import { darkModeSettingChanged } from '@background/redux/settings/actions';
import { selectCountOfContacts } from '@background/redux/contacts/selectors';

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
    color: ${({ theme }) => theme.color.contentAction};
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
  toggleButton?: boolean;
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
  const isDarkMode = useSelector(selectDarkModeSetting);
  const countOfContacts = useSelector(selectCountOfContacts);

  const { openWindow } = useWindowManager();
  const { closeNavigationMenu } = useNavigationMenu();

  useEffect(() => {
    const container = document.querySelector('#ms-container');

    container?.scrollTo(0, 0);
  }, []);

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
            title: t('Contacts list'),
            iconPath: 'assets/icons/team.svg',
            currentValue: countOfContacts,
            disabled: false,
            handleOnClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.ContactList);
            }
          },
          {
            id: 2,
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
            id: 3,
            title: t('Timeout'),
            iconPath: 'assets/icons/lock.svg',
            currentValue: TimeoutDurationSetting[timeoutDurationSetting],
            disabled: false,
            handleOnClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.Timeout);
            }
          },
          {
            id: 4,
            title: t('Dark mode'),
            iconPath: isDarkMode
              ? 'assets/icons/sun.svg'
              : 'assets/icons/moon.svg',
            toggleButton: true,
            disabled: false
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
            title: t('Generate wallet QR code'),
            description: t('Scan to import your wallet on mobile'),
            iconPath: 'assets/icons/qr.svg',
            disabled: false,
            handleOnClick: () => {
              closeNavigationMenu();

              navigate(RouterPath.GenerateWalletQRCode);
            }
          },
          {
            id: 3,
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
          },
          {
            id: 4,
            title: t('Change Password'),
            iconPath: 'assets/icons/secure.svg',
            disabled: false,
            handleOnClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.ChangePassword);
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
      countOfContacts,
      countOfConnectedSites,
      timeoutDurationSetting,
      isDarkMode,
      vaultHasImportedAccount,
      closeNavigationMenu,
      navigate,
      openWindow
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
                    groupItem.disabled ? 'contentSecondary' : 'contentAction'
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
                    <Typography type="bodySemiBold" color="contentAction">
                      {groupItem.currentValue}
                    </Typography>
                  )}
                  {groupItem.toggleButton && (
                    <Toggle
                      toggled={isDarkMode}
                      onClick={() =>
                        dispatchToMainStore(darkModeSettingChanged())
                      }
                    />
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
