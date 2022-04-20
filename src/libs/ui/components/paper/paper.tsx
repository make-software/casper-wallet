import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface StyledPaperProps {
  withPadding?: boolean;
}

interface PaperProps extends StyledPaperProps {
  children: ReactNode;
}

const StyledPaper = styled.div<StyledPaperProps>`
  width: 100%;
  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  padding: ${({ theme, withPadding }) =>
    withPadding ? theme.padding[1.6] : 0};
  border-radius: 1.2rem;
`;

export function Paper({ withPadding, children }: PaperProps) {
  return <StyledPaper withPadding={withPadding}>{children}</StyledPaper>;
}
