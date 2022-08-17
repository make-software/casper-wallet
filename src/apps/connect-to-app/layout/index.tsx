import React, { ReactElement } from 'react';
import styled from 'styled-components';

interface Props {
  Header: ReactElement;
  Content: ReactElement;
}

const Container = styled.div`
  height: 100%;
`;

const PageHeader = styled.header``;

const PageContent = styled.div`
  min-width: 360px;
  height: calc(100% - 128px); // 128px is headers height
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
export * from './containers';
