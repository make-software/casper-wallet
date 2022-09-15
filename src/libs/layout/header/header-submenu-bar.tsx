import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { useTranslation, Trans } from 'react-i18next';

import { Link, Typography, SvgIcon } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';

export const SubmenuBarContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  height: 56px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-bottom: 0.5px solid ${({ theme }) => theme.color.borderPrimary};
  padding: 8px ${({ theme }) => theme.padding[1.6]};
`;

const LinkWithIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

interface SubmenuBarProps {
  actionType: 'back' | 'close' | 'cancel';
  ActionGroup?: ReactElement;
}

export function HeaderSubmenuBar({ actionType, ActionGroup }: SubmenuBarProps) {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  let NavLink;

  switch (actionType) {
    case 'close':
      NavLink = (
        <Typography type="body" weight="semiBold">
          <Link onClick={() => navigate(RouterPath.Home)} color="fillBlue">
            <Trans t={t}>Close</Trans>
          </Link>
        </Typography>
      );

      break;
    case 'cancel':
      NavLink = (
        <Typography type="body" weight="semiBold">
          <Link onClick={() => navigate(RouterPath.Home)} color="fillBlue">
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
              onClick={() => navigate(-1)}
              src="assets/icons/chevron.svg"
              color="contentBlue"
              flipByAxis="Y"
              size={24}
            />
            <Link onClick={() => navigate(-1)} color="fillBlue">
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
    <SubmenuBarContainer>
      {NavLink}
      {ActionGroup && ActionGroup}
    </SubmenuBarContainer>
  );
}
