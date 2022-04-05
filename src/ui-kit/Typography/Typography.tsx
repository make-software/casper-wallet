import React, { ReactNode } from 'react';

import { Paragraph } from './styled';
import { TypographyAlign, TypographyColor } from './types';

interface Props {
  align?: TypographyAlign;
  color?: TypographyColor;
  fontSize?: number;
  children: ReactNode;
}

export function Typography({
  align = TypographyAlign.left,
  color = TypographyColor.main,
  fontSize = 15,
  children
}: Props) {
  return (
    <Paragraph align={align} color={color} fontSize={fontSize}>
      {children}
    </Paragraph>
  );
}
