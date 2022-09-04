import React, { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Link, SvgIcon, Typography } from '@libs/ui';

import { useTypedNavigate } from '@connect-to-app/router';
import { closeActiveWindow } from '@src/background/close-window';

import { SubmenuActionType } from '../types';

const LinkWithIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

interface NavLinkProps {
  actionType: SubmenuActionType;
  ActionGroup?: ReactElement;
}

// should be removed, it's the same as HeaderSubmenuBar, only difference is handlers
// which can be supplied using props e.g. onCancel, onClose etc.
export function SubmenuBarNavLink_TO_BE_REMOVED({
  actionType,
  ActionGroup
}: NavLinkProps) {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  switch (actionType) {
    case 'cancel':
      return (
        <Typography type="body" weight="semiBold">
          <Link onClick={() => closeActiveWindow()} color="fillBlue">
            <Trans t={t}>Cancel</Trans>
          </Link>
        </Typography>
      );

    case 'back':
      return (
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

    default:
      throw new Error('Unknown Link type');
  }
}
