import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface TagProps {
  children: ReactNode;
  margin?: string;
}

interface StyleTagContainerProps {
  margin?: string;
}

const StyledTag = styled.span`
  color: ${({ theme }) => theme.color.contentOnFill};
  background-color: ${({ theme }) => theme.color.contentTertiary};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  font-size: 0.8rem;
  line-height: 1.6rem;
  padding: 0 4px;
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
  text-transform: uppercase;
`;

const StyleTagContainer = styled.div<StyleTagContainerProps>`
  display: inline-flex;
  margin: ${({ margin }) => margin || '0'};
`;

export function Tag({ children, margin }: TagProps) {
  return (
    <StyleTagContainer margin={margin}>
      <StyledTag>{children}</StyledTag>
    </StyleTagContainer>
  );
}
