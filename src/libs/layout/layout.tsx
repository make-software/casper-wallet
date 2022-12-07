import React from 'react';
import styled from 'styled-components';

import { useContentHeight } from '@libs/ui/hooks/use-content-height';

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
  overflow-y: auto;
`;

const PageFooter = styled.footer``;

export function Layout({ renderHeader, renderContent, renderFooter }: Props) {
  const { headerRef, footerRef, headerHeight, footerHeight } =
    useContentHeight();

  return (
    <Container>
      <PageHeader ref={headerRef}>{renderHeader()}</PageHeader>
      <PageContent
        style={{
          height: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`
        }}
      >
        {renderContent()}
      </PageContent>
      {renderFooter && (
        <PageFooter ref={footerRef}>{renderFooter()}</PageFooter>
      )}
    </Container>
  );
}
