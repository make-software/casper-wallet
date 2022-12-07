import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

import { FlexColumn } from '@layout/containers';
import { useContentHeight } from '@libs/ui/hooks/use-content-height';

interface BaseLayoutWindowProps {
  variant: 'form' | 'default';
  renderHeader?: () => JSX.Element;
  renderContent: () => JSX.Element;
  renderFooter?: () => JSX.Element;
}

interface LayoutWindowFormProps extends BaseLayoutWindowProps {
  variant: 'form';
  onSubmit: () => void;
}

interface LayoutWindowDefaultProps extends BaseLayoutWindowProps {
  variant: 'default';
}

type LayoutWindowProps = LayoutWindowFormProps | LayoutWindowDefaultProps;

const PageHeader = styled.header``;

const PageContent = styled.div`
  overflow-y: auto;
`;

const PageFooter = styled.footer``;

export function LayoutWindow({
  renderHeader,
  renderContent,
  renderFooter,
  ...layoutContainerProps
}: LayoutWindowProps) {
  const { headerRef, footerRef, headerHeight, footerHeight } =
    useContentHeight();

  return (
    <LayoutContainer {...layoutContainerProps}>
      {renderHeader && (
        <PageHeader ref={headerRef}>{renderHeader()}</PageHeader>
      )}
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
    </LayoutContainer>
  );
}

const Container = styled(FlexColumn)`
  height: 100%;
`;

interface LayoutFormProps {
  variant: 'form';
  onSubmit: () => void;
}

interface LayoutDefaultProps {
  variant: 'default';
}

type LayoutContainerProps = LayoutDefaultProps | LayoutFormProps;

function LayoutContainer({
  children,
  ...props
}: PropsWithChildren<LayoutContainerProps>) {
  switch (props.variant) {
    case 'form':
      return (
        <Container as="form" onSubmit={props.onSubmit}>
          {children}
        </Container>
      );
    case 'default':
      return <Container>{children}</Container>;
    default:
      throw new Error('Unknown layout variant');
  }
}
