import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

import { TimeoutDurationSetting } from '@src/app/constants';
import { Routes } from '@src/app/routes';

import {
  List,
  ListItemElementContainer,
  SvgIcon,
  Typography
} from '@src/libs/ui';
import { ContentContainer } from '@src/layout/containers';

import { selectVaultTimeoutDurationSetting } from '@src/redux/vault/selectors';

export function MenuPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const timeoutDuration = useSelector(selectVaultTimeoutDurationSetting);

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
            )
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
                <Typography
                  type="body"
                  weight="semiBold"
                  variation="contentBlue"
                >
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
                <Typography
                  type="body"
                  weight="semiBold"
                  variation="contentBlue"
                >
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
              navigate(Routes.Timeout);
            }
          }
        ]}
      />
    </ContentContainer>
  );
}
