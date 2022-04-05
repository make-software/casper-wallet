import React, { ReactNode } from 'react';

import { HeaderAlign, HeaderLevel } from './types';

import { H1, H2, H3, H4, H5, H6 } from './styled';

interface Props {
  level?: HeaderLevel;
  align?: HeaderAlign;
  children: ReactNode;
}

export function Header({
  level = HeaderLevel.h2,
  align = HeaderAlign.left,
  children
}: Props) {
  switch (level) {
    case HeaderLevel.h1:
      return <H1 align={align}>{children}</H1>;
    case HeaderLevel.h2:
      return <H2 align={align}>{children}</H2>;
    case HeaderLevel.h3:
      return <H3 align={align}>{children}</H3>;
    case HeaderLevel.h4:
      return <H4 align={align}>{children}</H4>;
    case HeaderLevel.h5:
      return <H5 align={align}>{children}</H5>;
    case HeaderLevel.h6:
      return <H6 align={align}>{children}</H6>;
    default:
      throw new Error("Unknown header's level");
  }
}
