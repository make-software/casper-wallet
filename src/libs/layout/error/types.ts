export interface ErrorContent {
  errorHeaderText?: string;
  errorContentText?: string;
}

export interface ErrorLocationState extends ErrorContent {
  errorPrimaryButtonLabel?: string;
  errorRedirectPath?: string | null;
}

export type LayoutType = 'window' | 'tab';

export interface LayoutTypeProp {
  layoutType: LayoutType;
}
