import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { BaseProps } from '@libs/ui';

type Ref = HTMLTextAreaElement;

const StyledTextArea = styled.textarea<TextAreaProps>`
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.base}px;
  resize: ${({ resize }) => (resize ? 'auto' : 'none')};

  width: 100%;

  padding: 12px 16px;
`;

interface TextAreaProps extends BaseProps {
  name?: string;
  cols?: number;
  rows?: number;
  resize?: boolean;
  placeholder?: string;
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
