import { ErrorLocationState } from '@layout/error/types';

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

export * from './types';
export * from './page';
