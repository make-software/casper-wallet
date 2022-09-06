import React, { ReactElement } from 'react';
import styled from 'styled-components';

import { SubmenuActionType } from '../types';
import { SubmenuBarNavLink_TO_BE_REMOVED } from './submenu-bar-nav-link';

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

// should be removed, it's the same as HeaderSubmenuBar, only difference is handlers
// which can be supplied using props e.g. onCancel, onClose etc.
export function SubmenuBar_TO_BE_REMOVED({
  actionType,
  ActionGroup
}: SubmenuBarProps) {
  return (
    <SubmenuBarContainer>
      <SubmenuBarNavLink_TO_BE_REMOVED
        actionType={actionType}
        ActionGroup={ActionGroup}
      />
      {ActionGroup && ActionGroup}
    </SubmenuBarContainer>
  );
}
