import React from 'react';
import styled from 'styled-components';
import { useTranslation, Trans } from 'react-i18next';

import { Link, Typography, SvgIcon } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';

const LinkWithIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

export type LinkType = 'back' | 'close' | 'cancel' | 'done' | 'switchAccount';

interface HeaderSubmenuBarNavLinkProps {
  linkType: LinkType;
}

export function HeaderSubmenuBarNavLink({
  linkType
}: HeaderSubmenuBarNavLinkProps) {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  switch (linkType) {
    case 'close':
      return (
        <Typography type="bodySemiBold">
          <Link onClick={() => navigate(RouterPath.Home)} color="fillBlue">
            <Trans t={t}>Close</Trans>
          </Link>
        </Typography>
      );

    case 'cancel':
      return (
        <Typography type="bodySemiBold">
          <Link onClick={() => navigate(RouterPath.Home)} color="fillBlue">
            <Trans t={t}>Cancel</Trans>
          </Link>
        </Typography>
      );

    case 'back':
      return (
        <Typography type="bodySemiBold">
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

    case 'done':
      return (
        <Typography type="bodySemiBold">
          <Link color="fillBlue" onClick={() => navigate(RouterPath.Home)}>
            {t('Done')}
          </Link>
        </Typography>
      );

    case 'switchAccount':
      return (
        <Typography type="bodySemiBold">
          <Link
            color="fillBlue"
            onClick={() => navigate(RouterPath.AccountList)}
          >
            {t('Switch account')}
          </Link>
        </Typography>
      );

    default:
      throw new Error('Unknown Link type');
  }
}
