import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { useTranslation, Trans } from 'react-i18next';

import { Link, Typography, SvgIcon } from '@libs/ui';

import { useTypedNavigate } from '@connect-to-app/router';
import { closeWindow } from '@connect-to-app/utils/closeWindow';

const SubmenuBarContainer = styled.div`
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
  actionType: 'back' | 'cancel';
  ActionGroup?: ReactElement;
}

export function SubmenuBar({ actionType, ActionGroup }: SubmenuBarProps) {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  let NavLink;

  switch (actionType) {
    case 'cancel':
      NavLink = (
        <Typography type="body" weight="semiBold">
          <Link onClick={() => closeWindow()} color="fillBlue">
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
