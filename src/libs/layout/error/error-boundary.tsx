import React, { Component, ReactNode } from 'react';

import { PasswordDoesNotExistError } from '@src/errors';

import { WindowErrorPage, createErrorLocationState } from '@libs/layout';

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
      // TODO: Add localizations below
      return (
        <WindowErrorPage
          error={this.state.error}
          overrideState={createErrorLocationState({
            errorHeaderText: 'Something went wrong',
            errorContentText:
              this.state.error?.message ||
              'Please check browser console for error details, this will be a valuable for our team to fix the issue.',
            errorPrimaryButtonLabel:
              this.state.error instanceof PasswordDoesNotExistError
                ? 'Reset Wallet'
                : 'Close',
            errorRedirectPath: null
          })}
        />
      );
    }

    return this.props.children;
  }
}
