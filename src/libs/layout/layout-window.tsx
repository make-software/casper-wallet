import { MacScrollbar } from 'mac-scrollbar';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import React, { PropsWithChildren } from 'react';
import styled from 'styled-components';

import { FlexColumn } from './containers';

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
      <MacScrollbar>
        <PageContent>{renderContent()}</PageContent>
      </MacScrollbar>
      {renderFooter && <PageFooter>{renderFooter()}</PageFooter>}
    </Container>
  );
}
