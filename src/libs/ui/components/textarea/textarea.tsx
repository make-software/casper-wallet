import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { BaseProps } from '@libs/ui';

type Ref = HTMLTextAreaElement;

const StyledTextArea = styled.textarea<TextAreaProps>`
  border: none;
  border-radius: 6px;
  resize: ${({ resize }) => (resize ? 'auto' : 'none')};

  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
`;

interface TextAreaProps extends BaseProps {
  name?: string;
  cols?: number;
  rows?: number;
  spellcheck?: boolean;
  resize?: boolean;
  fullWidth?: boolean;
}

export const TextArea = forwardRef<Ref, TextAreaProps>(function TextArea(
  { children, ...restProps },
  ref
) {
  return (
    <StyledTextArea ref={ref} {...restProps}>
      {children}
    </StyledTextArea>
  );
});
