import React, { ReactNode } from 'react';

import { ButtonColor } from './types';
import { ButtonBase } from './styled';

interface Props {
  onClick: (...args: any) => void;
  fullWidth?: boolean;
  color?: ButtonColor;
  children: ReactNode;
}

export function Button({ fullWidth = false, children, ...props }: Props) {
  return (
    <ButtonBase fullWidth={fullWidth} {...props}>
      {children}
    </ButtonBase>
  );
}
