import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { BaseProps, FormField, FormFieldStatus } from '@libs/ui';

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
  error?: boolean;
  validationText?: string | null;
}

export const TextArea = forwardRef<Ref, TextAreaProps>(function TextArea(
  { children, id, className, style, error, validationText, ...restProps },
  ref
) {
  return (
    <FormField
      id={id}
      className={className}
      style={style}
      status={error ? FormFieldStatus.Error : undefined}
      statusText={validationText}
    >
      <StyledTextArea ref={ref} {...restProps}>
        {children}
      </StyledTextArea>
    </FormField>
  );
});
