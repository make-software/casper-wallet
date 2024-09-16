import React from 'react';
import styled from 'styled-components';

import { useIsDarkMode } from '@hooks/use-is-dark-mode';

interface HeaderBackgroundContainerTypes {
  children: React.ReactNode;
  isOpen: boolean;
}

const Container = styled.div<{ isOpen: boolean; isDarkMode: boolean }>`
  padding: 8px;
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;
  background: ${({ isOpen, isDarkMode }) =>
    isOpen ? (isDarkMode ? '#930C16' : '#BA0F1C') : 'inherit'};
`;

export const HeaderBackgroundContainer = ({
  children,
  isOpen
}: HeaderBackgroundContainerTypes) => {
  const isDarkMode = useIsDarkMode();

  return (
    <Container isOpen={isOpen} isDarkMode={isDarkMode}>
      {children}
    </Container>
  );
};
