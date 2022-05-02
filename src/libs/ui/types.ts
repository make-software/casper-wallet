import React from 'react';

export type ContentVariation =
  | 'inherit'
  | 'contentPrimary'
  | 'contentSecondary'
  | 'contentTertiary'
  | 'contentOnFill'
  | 'contentBlue'
  | 'contentRed'
  | 'contentGreen'
  | 'contentGreenOnFill';

export type BaseProps = {
  id?: string;
  className?: string;
  children?: any;
  style?: React.CSSProperties;
  onClick?: (ev: any) => void;
};
