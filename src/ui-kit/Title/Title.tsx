import React, { ReactNode } from 'react';

import { TitleAlign, TitleLevel } from './types';

import { H1, H2, H3, H4, H5, H6 } from './styled';

interface Props {
  level?: TitleLevel;
  align?: TitleAlign;
  children: ReactNode;
}

export function Title({
  level = TitleLevel.h2,
  align = TitleAlign.left,
  children
}: Props) {
  switch (level) {
    case TitleLevel.h1:
      return <H1 align={align}>{children}</H1>;
    case TitleLevel.h2:
      return <H2 align={align}>{children}</H2>;
    case TitleLevel.h3:
      return <H3 align={align}>{children}</H3>;
    case TitleLevel.h4:
      return <H4 align={align}>{children}</H4>;
    case TitleLevel.h5:
      return <H5 align={align}>{children}</H5>;
    case TitleLevel.h6:
      return <H6 align={align}>{children}</H6>;
    default:
      throw new Error("Unknown header's level");
  }
}
