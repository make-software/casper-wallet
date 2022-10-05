import React from 'react';

export type BaseProps = {
  id?: string;
  className?: string;
  children?: any;
  style?: React.CSSProperties;
  onClick?: (ev: any) => void;
};

export interface KeyValueItem {
  key: number | string;
  value: string;
}
