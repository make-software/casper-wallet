import React from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

import { Link, Typography, SvgIcon } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { closeActiveWindow } from '@background/close-window';

const LinkWithIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

export type LinkType =
  | 'back'
  | 'close'
  | 'cancel'
  | 'done'
  | 'switchAccount'
  | 'cancelWindow';

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
        <NavLink label={t('Close')} onClick={() => navigate(RouterPath.Home)} />
      );

    case 'cancel':
      return (
        <NavLink
          label={t('Cancel')}
          onClick={() => navigate(RouterPath.Home)}
        />
      );

    case 'back':
      return (
        <NavLink
          label={t('Back')}
          onClick={() => navigate(-1)}
          withLeftChevronIcon
        />
      );

    case 'done':
      return (
        <NavLink label={t('Done')} onClick={() => navigate(RouterPath.Home)} />
      );

    case 'switchAccount':
      return (
        <NavLink
          label={t('Switch account')}
          onClick={() => navigate(RouterPath.AccountList)}
        />
      );

    case 'cancelWindow':
      return (
        <NavLink label={t('Cancel')} onClick={() => closeActiveWindow()} />
      );

    default:
      throw new Error('Unknown Link type');
  }
}

interface NavLinkProps {
  label: string;
  onClick: () => void;
  withLeftChevronIcon?: boolean;
}

function NavLink({ label, onClick, withLeftChevronIcon }: NavLinkProps) {
  const LinkComponent = (
    <Link color="fillBlue" onClick={onClick}>
      {label}
    </Link>
  );

  return (
    <Typography type="bodySemiBold">
      {withLeftChevronIcon ? (
        <LinkWithIconContainer>
          <SvgIcon
            onClick={onClick}
            src="assets/icons/chevron.svg"
            color="contentBlue"
            flipByAxis="Y"
            size={24}
          />
          {LinkComponent}
        </LinkWithIconContainer>
      ) : (
        LinkComponent
      )}
    </Typography>
  );
}
