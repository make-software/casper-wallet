import React from 'react';
import styled from 'styled-components';
import { Size } from '../../types';

import { matchSize } from '../../utils/match-size';
import Text, { TextProps } from '../text/text';

/* eslint-disable-next-line */
export interface HeaderTextProps extends TextProps {
  size: Size;
}

const StyledText = styled(Text)<HeaderTextProps>(
  ({ theme, size = 2, monotype = false }) => ({
    fontWeight: monotype
      ? theme.typography.fontWeight.regular
      : matchSize(
          {
            0: theme.typography.fontWeight.extraBold,
            1: theme.typography.fontWeight.extraBold,
            2: theme.typography.fontWeight.bold,
            3: theme.typography.fontWeight.semiBold,
            4: theme.typography.fontWeight.semiBold,
            5: theme.typography.fontWeight.semiBold
          },
          size
        ),
    fontSize: matchSize(
      {
        0: '2rem',
        1: '1.8rem',
        2: '1.5rem',
        3: '1.3rem',
        4: '1rem',
        5: '0.6rem'
      },
      size
    ),
    lineHeight: matchSize(
      {
        0: '4.8rem',
        1: '4rem',
        2: '2.8rem',
        3: '2.8rem',
        4: '2rem',
        5: '2.4rem'
      },
      size
    )
  })
);

export function HeaderText(props: HeaderTextProps) {
  return <StyledText {...props} />;
}

export default HeaderText;
