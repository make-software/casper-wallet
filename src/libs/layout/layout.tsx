import React from 'react';
import styled from 'styled-components';

import { FlexColumn } from './containers';

interface Props {
  renderHeader: () => JSX.Element;
  renderContent: () => JSX.Element;
  renderFooter?: () => JSX.Element;
}

const Container = styled(FlexColumn)`
  height: 100%;
`;

const PageHeader = styled.header``;

const PageContent = styled.div`
  min-height: 472px;
  height: 100%;
  overflow-y: auto;
`;

const PageFooter = styled.footer``;

export function Layout({ renderHeader, renderContent, renderFooter }: Props) {
  return (
    <Container>
      <PageHeader>{renderHeader()}</PageHeader>
      <PageContent>{renderContent()}</PageContent>
      {renderFooter && <PageFooter>{renderFooter()}</PageFooter>}
    </Container>
  );
}
