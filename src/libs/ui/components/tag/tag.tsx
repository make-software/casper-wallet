import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface TagProps {
  children: ReactNode;
  displayContext?: 'accountList';
}

interface StyleTagContainerProps {
  displayContext?: 'accountList';
}

const StyledTag = styled.span`
  color: ${({ theme }) => theme.color.contentOnFill};
  background-color: ${({ theme }) => theme.color.contentDisabled};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semiBold};
  font-size: 0.8rem;
  line-height: 1.6rem;
  padding: 0 4px;
  border-radius: ${({ theme }) => theme.borderRadius.hundred}px;
  text-transform: uppercase;
`;

const StyleTagContainer = styled.div<StyleTagContainerProps>`
  display: inline-flex;
  margin: ${({ displayContext }) =>
    displayContext === 'accountList' ? '0 0 0 4px' : '0'};
`;

export function Tag({ children, displayContext }: TagProps) {
  return (
    <StyleTagContainer displayContext={displayContext}>
      <StyledTag>{children}</StyledTag>
    </StyleTagContainer>
  );
}
