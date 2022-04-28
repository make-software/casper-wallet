import React, { Component, ReactNode } from 'react';
import { Typography } from '@src/libs/ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  componentDidCatch(error: Error) {
    this.setState({
      hasError: true,
      error
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <h1>{this.state.error?.message}</h1>
          <Typography type="body" weight="regular">
            {this.state.error?.stack}
          </Typography>
        </>
      );
    }

    return this.props.children;
  }
}
