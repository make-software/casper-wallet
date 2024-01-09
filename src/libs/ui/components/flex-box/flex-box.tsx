import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { BaseProps } from '@libs/ui/types';

/* eslint-disable-next-line */
export interface FlexBoxProps extends BaseProps {
  /* @description will add spacing between children, work depending on row/column layout */
  itemsSpacing?: number;
  innerRef?: React.Ref<HTMLDivElement>;
  gap?: React.CSSProperties['gap'];
  direction?: React.CSSProperties['flexDirection'];
  wrap?: React.CSSProperties['flexWrap'];
  justify?: React.CSSProperties['justifyContent'];
  align?: React.CSSProperties['alignItems'];
  grow?: React.CSSProperties['flexGrow'];
  shrink?: React.CSSProperties['flexShrink'];
  basis?: React.CSSProperties['flexBasis'];
}

const StyledFlexBox = styled('div')<FlexBoxProps>(
  ({
    itemsSpacing,
    direction: flexDirection,
    justify: justifyContent,
    wrap: flexWrap,
    align: alignItems,
    grow: flexGrow,
    shrink: flexShrink,
    basis: flexBasis = 'auto',
    gap,
    onClick
  }) => ({
    display: 'flex',
    gap,
    flexDirection,
    flexWrap,
    justifyContent,
    alignItems,
    flexGrow,
    flexShrink,
    flexBasis,
    ...(itemsSpacing != null && {
      '> * + *': {
        [flexDirection === 'row' ? 'marginLeft' : 'marginTop']: itemsSpacing
      }
    }),
    ...(onClick && {
      cursor: 'pointer'
    })
  })
);

export const FlexBox = forwardRef<HTMLDivElement, FlexBoxProps>(
  (props, ref) => <StyledFlexBox ref={ref} {...props} />
);

export default FlexBox;
