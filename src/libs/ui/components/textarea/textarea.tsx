import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { BaseProps } from '@libs/ui';

type Ref = HTMLTextAreaElement;

const StyledTextArea = styled.textarea<{
  resize?: boolean;
  isDisabled?: boolean;
}>(({ theme, resize, isDisabled }) => ({
  border: 'none',
  borderRadius: theme.borderRadius.base + 'px',
  resize: resize ? 'horizontal' : 'none',
  width: '100%',
  padding: '12px 16px',

  ...(isDisabled && {
    color: theme.color.contentSecondary
  })
}));

interface TextAreaProps extends BaseProps {
  value?: string;
  name?: string;
  cols?: number;
  rows?: number;
  resize?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export const TextArea = forwardRef<Ref, TextAreaProps>(function TextArea(
  { children, disabled, ...restProps },
  ref
) {
  return (
    <StyledTextArea ref={ref} isDisabled={disabled} {...restProps}>
      {children}
    </StyledTextArea>
  );
});
