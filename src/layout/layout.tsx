import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface Props {
  children: ReactNode;
}

// TODO: Implement Header component
const Header = styled.header`
  background: ${({ theme }) => theme.color.blue};
  height: 72px;
`;

const Content = styled.div`
  min-width: 360px;
`;

export function Layout({ children }: Props) {
  return (
    <>
      <Header />
      <Content>{children}</Content>
    </>
  );
}
