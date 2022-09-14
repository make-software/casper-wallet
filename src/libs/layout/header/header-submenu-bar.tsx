import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { useTranslation, Trans } from 'react-i18next';

import { Link, Typography, SvgIcon } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';

const Container = styled.div`
  height: 56px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};

  display: flex;
  justify-content: space-between;

  padding: ${({ theme }) => theme.padding[1.6]};
  border-bottom: 0.5px solid ${({ theme }) => theme.color.borderPrimary};
`;

const LinkWithIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

interface SubmenuBarProps {
  actionType: 'back' | 'close' | 'cancel';
  ActionGroup?: ReactElement;
  onAction?: () => void;
}

export function HeaderSubmenuBar({
  actionType,
  ActionGroup,
  onAction
}: SubmenuBarProps) {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  let NavLink;

  switch (actionType) {
    case 'close':
      NavLink = (
        <Typography type="body" weight="semiBold">
          <Link
            onClick={
              typeof onAction === 'function'
                ? onAction
                : () => navigate(RouterPath.Home)
            }
            color="fillBlue"
          >
            <Trans t={t}>Close</Trans>
          </Link>
        </Typography>
      );

      break;
    case 'cancel':
      NavLink = (
        <Typography type="body" weight="semiBold">
          <Link
            onClick={
              typeof onAction === 'function'
                ? onAction
                : () => navigate(RouterPath.Home)
            }
            color="fillBlue"
          >
            <Trans t={t}>Cancel</Trans>
          </Link>
        </Typography>
      );

      break;
    case 'back':
      NavLink = (
        <Typography type="body" weight="semiBold">
          <LinkWithIconContainer>
            <SvgIcon
              onClick={
                typeof onAction === 'function' ? onAction : () => navigate(-1)
              }
              src="assets/icons/chevron.svg"
              color="contentBlue"
              flipByAxis="Y"
              size={24}
            />
            <Link
              onClick={
                typeof onAction === 'function' ? onAction : () => navigate(-1)
              }
              color="fillBlue"
            >
              <Trans t={t}>Back</Trans>
            </Link>
          </LinkWithIconContainer>
        </Typography>
      );

      break;
    default:
      throw new Error('Unknown Link type');
  }

  return (
    <Container>
      {NavLink}
      {ActionGroup && ActionGroup}
    </Container>
  );
}
