import React, { ReactElement } from 'react';
import styled from 'styled-components';

interface Props {
  Header: ReactElement<any, any>;
  Content: ReactElement<any, any>;
  Footer?: ReactElement<any, any>;
}

// TODO: Implement Header component
const PageHeader = styled.header``;

const PageContent = styled.div`
  padding: 0 ${({ theme }) => theme.padding[1.6]};
  min-width: 360px;
  height: 100%;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const PageFooter = styled.div``;

export function Layout({ Header, Content, Footer }: Props) {
  return (
    <>
      <PageHeader>{Header}</PageHeader>
      <PageContent>{Content}</PageContent>
      {Footer && <PageFooter>{Footer}</PageFooter>}
    </>
  );
}

export * from './header';
