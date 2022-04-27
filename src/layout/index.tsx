import React, { ReactElement } from 'react';
import styled from 'styled-components';

interface Props {
  Header: ReactElement<any, any>;
  Content: ReactElement<any, any>;
}

const Container = styled.div`
  min-height: 600px;
`;

// TODO: Implement Header component
const PageHeader = styled.header``;

const PageContent = styled.div`
  min-width: 360px;
  height: 100%;
`;

export function Layout({ Header, Content }: Props) {
  return (
    <Container>
      <PageHeader>{Header}</PageHeader>
      <PageContent>{Content}</PageContent>
    </Container>
  );
}

export * from './header';
export * from './buttons-container';
export * from './content-container';
