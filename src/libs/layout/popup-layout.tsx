import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

import { FlexColumn } from './containers';

interface LayoutProps {
  renderHeader: () => JSX.Element;
  renderContent: () => JSX.Element;
  renderFooter?: () => JSX.Element;
}

interface LayoutFormProps {
  variant: 'form';
  onSubmit: () => void;
}

interface LayoutDefaultProps {
  variant?: undefined;
}

type Props = LayoutProps & (LayoutDefaultProps | LayoutFormProps);

const Container = styled(FlexColumn)`
  height: 100%;
  height: -webkit-fill-available;
  min-height: 600px;
  width: 360px;
`;

const PageHeader = styled.header``;

const PageContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
`;

const PageFooter = styled.footer``;

export function PopupLayout({
  renderHeader,
  renderContent,
  renderFooter,
  ...restProps
}: PropsWithChildren<Props>) {
  const asFormProps: any =
    (restProps.variant === 'form' && {
      as: 'form',
      onSubmit: restProps.onSubmit
    }) ||
    undefined;

  return (
    <Container {...asFormProps}>
      {renderHeader && <PageHeader>{renderHeader()}</PageHeader>}
      <PageContent>{renderContent()}</PageContent>
      {renderFooter && <PageFooter>{renderFooter()}</PageFooter>}
    </Container>
  );
}
