import React from 'react';
import styled from 'styled-components';

const ToggleLabel = styled.label`
  position: relative;
  display: inline-block;
  height: 24px;
  width: 42px;
`;

const ToggleSpan = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.color.fillNeutral};
  transition: 0.3s;
  border-radius: 30px;

  :before {
    position: absolute;
    content: '';
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: ${({ theme }) => theme.color.contentOnFill};
    border-radius: 50%;
    transition: 0.3s;
  }
`;

const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  :checked + ${ToggleSpan} {
    background-color: ${({ theme }) => theme.color.fillPrimary};
  }
  :checked + ${ToggleSpan}:before {
    transform: translateX(18px);
  }
`;

interface ToggleProps {
  toggled: boolean;
  onClick: () => void;
}

export const Toggle = ({ toggled, onClick }: ToggleProps) => {
  return (
    <ToggleLabel>
      <ToggleInput type="checkbox" defaultChecked={toggled} onClick={onClick} />
      <ToggleSpan />
    </ToggleLabel>
  );
};
