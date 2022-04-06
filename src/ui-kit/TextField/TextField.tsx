import React from 'react';

import { TextFieldBase } from './styled';

interface Props {
  placeholder?: string;
  fullWidth?: boolean;
  value?: string;
  type?: string;
}

export function TextField({ fullWidth = false, ...props }: Props) {
  return <TextFieldBase fullWidth={fullWidth} {...props} />;
}
