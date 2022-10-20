import { NavigateFunction } from 'react-router/lib/hooks';

export interface ErrorContent {
  errorHeaderText?: string;
  errorContentText?: string;
}

export interface ErrorLocationState extends ErrorContent {
  errorPrimaryButtonLabel?: string;
  errorRedirectPath?: string | null;
}

export type LayoutType = 'window' | 'tab';

interface LayoutTypeProp {
  layoutType: LayoutType;
}

export interface ErrorPageContentProps extends ErrorContent, LayoutTypeProp {}

export interface ErrorPageProps extends LayoutTypeProp {
  createTypedNavigate: () => NavigateFunction;
  createTypedLocation: () => Location & any;
}
