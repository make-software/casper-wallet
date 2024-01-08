import { ErrorLocationState } from '@libs/layout';

export const ErrorPath = '/error';

export function createErrorLocationState({
  errorHeaderText,
  errorContentText,
  errorPrimaryButtonLabel,
  errorRedirectPath
}: Required<ErrorLocationState>) {
  return {
    state: {
      errorHeaderText,
      errorContentText,
      errorPrimaryButtonLabel,
      errorRedirectPath
    }
  };
}

export * from './error-boundary';
export * from './tab-page';
export * from './types';
export * from './window-page';
