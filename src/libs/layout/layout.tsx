import React from 'react';
import styled from 'styled-components';

import { FlexColumn } from './containers';

interface Props {
  renderHeader: () => JSX.Element;
  renderContent: () => JSX.Element;
  renderFooter?: () => JSX.Element;
}

const Container = styled(FlexColumn)`
  height: 600px;
`;

const PageHeader = styled.header``;

const PageContent = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const PageFooter = styled.footer``;

export function Layout({ renderHeader, renderContent, renderFooter }: Props) {
  return (
    <Container>
      {renderHeader && <PageHeader>{renderHeader()}</PageHeader>}
      <PageContent>{renderContent()}</PageContent>
      {renderFooter && <PageFooter>{renderFooter()}</PageFooter>}
    </Container>
  );
}
