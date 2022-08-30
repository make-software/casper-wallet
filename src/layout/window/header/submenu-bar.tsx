import React, { ReactElement } from 'react';
import styled from 'styled-components';

import { SubmenuActionType } from './types';
import { SubmenuBarNavLink } from './submenu-bar-nav-link';

const SubmenuBarContainer = styled.div`
  height: 56px;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};

  display: flex;
  justify-content: space-between;

  padding: ${({ theme }) => theme.padding[1.6]};
  border-bottom: 0.5px solid ${({ theme }) => theme.color.borderPrimary};
`;

interface SubmenuBarProps {
  actionType: SubmenuActionType;
  ActionGroup?: ReactElement;
}

export function SubmenuBar({ actionType, ActionGroup }: SubmenuBarProps) {
  return (
    <SubmenuBarContainer>
      <SubmenuBarNavLink actionType={actionType} ActionGroup={ActionGroup} />
      {ActionGroup && ActionGroup}
    </SubmenuBarContainer>
  );
}
