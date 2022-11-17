import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface TagProps {
  children: ReactNode;
}

const StyledTag = styled.span`
  color: ${({ theme }) => theme.color.contentOnFill};
  background-color: ${({ theme }) => theme.color.contentTertiary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  font-size: 0.8rem;
  line-height: 1.6rem;
  padding: 6px;
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
  text-transform: uppercase;
`;

export function Tag({ children }: TagProps) {
  return <StyledTag>{children}</StyledTag>;
}
