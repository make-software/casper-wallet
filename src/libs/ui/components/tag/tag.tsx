import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface StyledTagProps {
  enabled?: boolean;
}

interface TagProps extends StyledTagProps {
  children: ReactNode;
}

const StyledTag = styled.span<StyledTagProps>`
  color: ${({ theme, enabled }) =>
    enabled ? theme.color.contentOnFill : theme.color.contentPrimary};
  background-color: ${({ theme, enabled }) =>
    enabled ? theme.color.fillGreen : theme.color.fillGreySecondary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  font-size: 1.2rem;
  line-height: 2rem;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
`;

export function Tag({ children, enabled }: TagProps) {
  return <StyledTag enabled={enabled}>{children}</StyledTag>;
}
