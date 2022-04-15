import React from 'react';
import styled from 'styled-components';

type RenderFunction = () => JSX.Element;

interface Props {
  renderHeader: RenderFunction;
  renderContent: RenderFunction;
  renderFooter?: RenderFunction;
}

// TODO: Implement Header component
const PageHeader = styled.header`
  background: ${({ theme }) => theme.color.blue};
  height: 72px;
`;

const PageContent = styled.div`
  padding: 0 ${({ theme }) => theme.padding[1.333]};
  min-width: 360px;
  height: 100%;
  min-height: 450px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const PageFooter = styled.div``;

export function Layout({ renderHeader, renderContent, renderFooter }: Props) {
  return (
    <>
      <PageHeader>{renderHeader()}</PageHeader>
      <PageContent>{renderContent()}</PageContent>
      {renderFooter && <PageFooter>{renderFooter()}</PageFooter>}
    </>
  );
}
