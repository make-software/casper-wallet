import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { RouterPath } from '@popup/router/paths';
import { useTypedNavigate } from '@popup/router/use-typed-navigate';

import { closeCurrentWindow } from '@background/close-current-window';

import { AlignedFlexRow, SpacingSize } from '@libs/layout';
import { useFetchWalletBalance } from '@libs/services/balance-service';
import { Link, SvgIcon, Typography } from '@libs/ui/components';

const LinkWithIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

type LinkType =
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

  const { accountBalance } = useFetchWalletBalance();

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
          onClick={() =>
            onClick != null ? onClick() : navigate(RouterPath.Home)
          }
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
          {accountBalance.liquidFormattedDecimalBalance && (
            <AlignedFlexRow gap={SpacingSize.Small}>
              <Typography type="captionRegular" color="contentSecondary">
                <Trans t={t}>Balance:</Trans>
              </Typography>
              <Typography type="captionHash">
                {`${accountBalance.liquidFormattedDecimalBalance} CSPR`}
              </Typography>
            </AlignedFlexRow>
          )}
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
