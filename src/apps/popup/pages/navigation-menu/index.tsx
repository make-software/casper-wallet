import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { TimeoutDurationSetting } from '@popup/constants';
import { RouterPath, useNavigationMenu } from '@popup/router';
import { ContentContainer } from '@layout/containers';
import { List, ListItemElementContainer, SvgIcon, Typography } from '@libs/ui';
import { selectVaultTimeoutDurationSetting } from '@libs/redux/vault/selectors';

export function NavigationMenuPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const timeoutDuration = useSelector(selectVaultTimeoutDurationSetting);

  const { closeNavigationMenu } = useNavigationMenu();

  const iconSize = 24;

  return (
    <ContentContainer>
      <List
        listItems={[
          {
            id: 1,
            Content: (
              <ListItemElementContainer>
                <Typography type="body" weight="regular">
                  <Trans t={t}>Create account</Trans>
                </Typography>
              </ListItemElementContainer>
            ),
            Left: (
              <ListItemElementContainer>
                <SvgIcon
                  color="contentBlue"
                  size={iconSize}
                  src="assets/icons/plus.svg"
                />
              </ListItemElementContainer>
            )
          },
          {
            id: 2,
            Content: (
              <ListItemElementContainer>
                <Typography type="body" weight="regular">
                  <Trans t={t}>Import account</Trans>
                </Typography>
              </ListItemElementContainer>
            ),
            Left: (
              <ListItemElementContainer>
                <SvgIcon
                  color="contentBlue"
                  size={iconSize}
                  src="assets/icons/upload.svg"
                />
              </ListItemElementContainer>
            ),
            onClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.ImportAccount);
            }
          },
          {
            id: 3,
            Content: (
              <ListItemElementContainer>
                <Typography type="body" weight="regular">
                  <Trans t={t}>Connected sites</Trans>
                </Typography>
              </ListItemElementContainer>
            ),
            Left: (
              <ListItemElementContainer>
                <SvgIcon
                  color="contentBlue"
                  size={iconSize}
                  src="assets/icons/link.svg"
                />
              </ListItemElementContainer>
            ),
            Right: (
              <ListItemElementContainer>
                <Typography type="body" weight="semiBold" color="contentBlue">
                  3
                </Typography>
              </ListItemElementContainer>
            )
          },
          {
            id: 4,
            Content: (
              <ListItemElementContainer>
                <Typography type="body" weight="regular">
                  <Trans t={t}>Timeout</Trans>
                </Typography>
              </ListItemElementContainer>
            ),
            Right: (
              <ListItemElementContainer>
                <Typography type="body" weight="semiBold" color="contentBlue">
                  {TimeoutDurationSetting[timeoutDuration]}
                </Typography>
              </ListItemElementContainer>
            ),
            Left: (
              <ListItemElementContainer>
                <SvgIcon
                  size={iconSize}
                  color="contentBlue"
                  src="assets/icons/lock.svg"
                />
              </ListItemElementContainer>
            ),
            onClick: () => {
              closeNavigationMenu();
              navigate(RouterPath.Timeout);
            }
          }
        ]}
      />
    </ContentContainer>
  );
}
