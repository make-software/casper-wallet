import React from 'react';

import FlexBox, { FlexBoxProps } from '../flex-box/flex-box';

/* eslint-disable-next-line */
export interface FlexRowProps extends FlexBoxProps {}

export const FlexRow = React.forwardRef<HTMLDivElement, FlexRowProps>(
  (props, ref) => <FlexBox ref={ref} direction="row" {...props} />
);

export default FlexRow;
