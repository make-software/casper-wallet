import React from 'react';
import styled from 'styled-components';

// Deep path, not the '@libs/ui/components' barrel — see token-amount-card.tsx
// for why that barrel is unsafe to import in this file's node-jest tree.
import { SvgIcon } from '@libs/ui/components/svg-icon/svg-icon';

const Button = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 72px;
  height: 72px;

  padding: 0;
  border: 6px solid ${({ theme }) => theme.color.backgroundSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
  cursor: pointer;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
`;

export interface SwitchTokensButtonProps {
  onClick: () => void;
}

export const SwitchTokensButton = ({ onClick }: SwitchTokensButtonProps) => (
  <Button type="button" onClick={onClick}>
    <SvgIcon src="assets/icons/arrows.svg" size={32} color={'contentAction'} />
  </Button>
);
