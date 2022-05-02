import React, { Dispatch, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import styled from 'styled-components';

import { Timeout } from '@src/app/types';
import { Routes } from '@src/app/routes';

import {
  List,
  ListItemElementContainer,
  SvgIcon,
  Typography
} from '@src/libs/ui';
import { ContentContainer } from '@src/layout/containers';

import { selectTimeoutDuration } from '@src/redux/vault/selectors';

const MenuContainer = styled(ContentContainer)`
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: ${({ theme }) => theme.zIndex.modal};
  background-color: ${({ theme }) => theme.color.backgroundSecondary};
`;

interface MenuProps {
  setIsMenuShow: Dispatch<SetStateAction<boolean>>;
}

export function Menu({ setIsMenuShow }: MenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutDuration = useSelector(selectTimeoutDuration);

  const iconSize = 24;

  return (
    <MenuContainer>
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
                  {Timeout[timeoutDuration]}
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
              if (location.pathname === Routes.Timeout) {
                // Helps to avoid to stack the same routes in history
                setIsMenuShow(false);
              } else {
                navigate(Routes.Timeout);
              }
            }
          }
        ]}
      />
    </MenuContainer>
  );
}
