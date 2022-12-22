import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

import { FlexColumn } from '@layout/containers';

interface BaseLayoutWindowProps {
  renderHeader?: () => JSX.Element;
  renderContent: () => JSX.Element;
  renderFooter?: () => JSX.Element;
}

interface LayoutWindowFormProps extends BaseLayoutWindowProps {
  variant: 'form';
  onSubmit: () => void;
}

interface LayoutWindowDefaultProps extends BaseLayoutWindowProps {
  variant?: undefined;
}

type LayoutWindowProps = LayoutWindowFormProps | LayoutWindowDefaultProps;

const PageHeader = styled.header``;

const PageContent = styled.div`
  height: 100%;
  overflow-y: auto;
`;

const PageFooter = styled.footer``;

const Container = styled(FlexColumn)`
  height: 100%;
`;

export function LayoutWindow({
  renderHeader,
  renderContent,
  renderFooter,
  ...restProps
}: PropsWithChildren<LayoutWindowProps>) {
  const formProps: any =
    restProps.variant === 'form'
      ? {
          as: 'form',
          onSubmit: restProps.onSubmit
        }
      : undefined;

  return (
    <Container {...formProps}>
      {renderHeader && <PageHeader>{renderHeader()}</PageHeader>}
      <PageContent>{renderContent()}</PageContent>
      {renderFooter && <PageFooter>{renderFooter()}</PageFooter>}
    </Container>
  );
}
