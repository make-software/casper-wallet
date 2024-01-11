import React, { forwardRef } from 'react';

import FlexBox, { FlexBoxProps } from '../flex-box/flex-box';

export interface FlexRowProps extends FlexBoxProps {}

export const FlexRow = forwardRef<HTMLDivElement, FlexRowProps>(
  (props, ref) => <FlexBox ref={ref} direction="row" {...props} />
);

export default FlexRow;
