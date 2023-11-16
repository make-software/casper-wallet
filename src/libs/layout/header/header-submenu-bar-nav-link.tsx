import React from 'react';
import styled from 'styled-components';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { Link, SvgIcon, Typography } from '@libs/ui';
import { RouterPath, useTypedNavigate } from '@popup/router';

import { closeCurrentWindow } from '@src/background/close-current-window';
import { selectAccountBalance } from '@background/redux/account-info/selectors';
import { formatNumber, motesToCSPR } from '@libs/ui/utils/formatters';
import { AlignedFlexRow, SpacingSize } from '@libs/layout';

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
  onClick?: () => void;
  backTypeWithBalance?: boolean;
}

export function HeaderSubmenuBarNavLink({
  linkType,
  onClick,
  backTypeWithBalance
}: HeaderSubmenuBarNavLinkProps) {
  const { t } = useTranslation();
  const navigate = useTypedNavigate();

  const balance = useSelector(selectAccountBalance);

  const formattedBalance = formatNumber(
    (balance.amountMotes && motesToCSPR(balance.amountMotes)) || ''
  );

  switch (linkType) {
    case 'close':
      return (
        <NavLink
          label={t('Close')}
          onClick={() =>
            onClick != null ? onClick() : navigate(RouterPath.Home)
          }
        />
      );

    case 'cancel':
      return (
        <NavLink
          label={t('Cancel')}
          onClick={() => navigate(RouterPath.Home)}
        />
      );

    case 'back':
      return backTypeWithBalance ? (
        <>
          <NavLink
            label={t('Back')}
            onClick={() => {
              if (onClick) {
                onClick();
              } else {
                navigate(-1);
              }
            }}
            withLeftChevronIcon
          />
          <AlignedFlexRow gap={SpacingSize.Small}>
            <Typography type="captionRegular" color="contentSecondary">
              <Trans t={t}>Balance:</Trans>
            </Typography>
            <Typography type="captionHash">
              {`${formattedBalance} CSPR`}
            </Typography>
          </AlignedFlexRow>
        </>
      ) : (
        <NavLink
          label={t('Back')}
          onClick={() => {
            if (onClick) {
              onClick();
            } else {
              navigate(-1);
            }
          }}
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
        <NavLink
          label={t('Cancel')}
          onClick={() => {
            if (onClick) {
              onClick();
            } else {
              closeCurrentWindow();
            }
          }}
        />
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
    <Link color="contentAction" onClick={onClick}>
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
            color="contentAction"
            flipByAxis="Y"
          />
          {LinkComponent}
        </LinkWithIconContainer>
      ) : (
        LinkComponent
      )}
    </Typography>
  );
}
