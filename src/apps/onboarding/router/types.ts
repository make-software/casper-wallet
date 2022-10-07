import { RouterPath } from '@src/apps/onboarding/router/paths';

export type LocationState = {
  errorPrimaryButtonLabel?: string;
  errorHeaderText?: string;
  errorContentText?: string;
  errorRedirectPath?: RouterPath;
};
