import React from 'react';
import styled from 'styled-components';

import {
  HeaderContainer,
  Logo,
  LogoContainer,
  AlignedSpaceBetweenFlexRow,
  LeftAlignedCenteredFlexRow
} from '@src/libs/layout';
import { SvgIcon } from '@libs/ui';

import { HeaderConnectionStatus } from './header-connection-status';
import { HeaderActions } from './header-actions';

const LogoAndConnectionStatusContainer = styled(LeftAlignedCenteredFlexRow)`
  gap: 18px;

  z-index: 1;
`;

const SubmenuBarContainer = styled(AlignedSpaceBetweenFlexRow)`
  height: 56px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-bottom: 0.5px solid ${({ theme }) => theme.color.borderPrimary};
  padding: 8px ${({ theme }) => theme.padding[1.6]};
`;

const SvgIconContainer = styled.div`
  position: absolute;
  left: 0;

  width: 53px;
  height: 72px;
`;

interface HeaderProps {
  withNetworkSwitcher?: boolean;
  withMenu?: boolean;
  withConnectionStatus?: boolean;
  renderSubmenuBarItems?: () => JSX.Element;
}

export function PopupHeader({
  withNetworkSwitcher,
  withMenu,
  withConnectionStatus,
  renderSubmenuBarItems
}: HeaderProps) {
  return (
    <>
      <HeaderContainer>
        <SvgIconContainer>
          <SvgIcon src="assets/icons/sign.svg" width={53} height={72} />
        </SvgIconContainer>
        <LogoAndConnectionStatusContainer>
          <LogoContainer>
            <Logo />
          </LogoContainer>
          {withConnectionStatus && <HeaderConnectionStatus />}
        </LogoAndConnectionStatusContainer>

        {(withMenu || withNetworkSwitcher) && (
          <HeaderActions
            withMenu={withMenu}
            withNetworkSwitcher={withNetworkSwitcher}
          />
        )}
      </HeaderContainer>
      {renderSubmenuBarItems && (
        <SubmenuBarContainer>{renderSubmenuBarItems()}</SubmenuBarContainer>
      )}
    </>
  );
}

export * from './header-submenu-bar-nav-link';
export * from './header-view-in-explorer';
