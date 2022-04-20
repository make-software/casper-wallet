import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface StyledTagProps {
  isEnabled?: boolean;
}

interface TagProps extends StyledTagProps {
  children: ReactNode;
}

const StyledTag = styled.span<StyledTagProps>`
  color: ${({ theme, isEnabled }) =>
    isEnabled ? theme.color.contentOnFill : theme.color.contentPrimary};
  background-color: ${({ theme, isEnabled }) =>
    isEnabled ? theme.color.fillGreen : theme.color.fillGreySecondary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  font-size: 1.2rem;
  line-height: 2rem;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

export function Tag({ children, isEnabled }: TagProps) {
  return <StyledTag isEnabled={isEnabled}>{children}</StyledTag>;
}
