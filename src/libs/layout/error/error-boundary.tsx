import React, { Component, ReactNode } from 'react';

import { ErrorMessages } from '@src/constants';
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
      // Webpack's message is developer-facing ("Loading chunk 12 failed.
      // (missing: ...)"), and since the routes became chunks this is a failure
      // real users hit. Give it wording they can act on.
      const isChunkLoadError = this.state.error?.name === 'ChunkLoadError';

      // TODO: Add localizations below
      return (
        <WindowErrorPage
          error={this.state.error}
          overrideState={createErrorLocationState({
            errorHeaderText: isChunkLoadError
              ? ErrorMessages.common.CHUNK_LOAD_ERROR.message
              : ErrorMessages.common.UNKNOWN_ERROR.message,
            errorContentText: isChunkLoadError
              ? ErrorMessages.common.CHUNK_LOAD_ERROR.description
              : this.state.error?.message ||
                ErrorMessages.common.UNKNOWN_ERROR.description,
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
