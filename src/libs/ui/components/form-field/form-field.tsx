import React from 'react';
import styled from 'styled-components';
import { Typography, BaseProps } from '@src/libs/ui';

const getThemeColor = (status?: FormFieldStatus | null) => {
  if (status == null) {
    return 'gray3';
  }

  return {
    [FormFieldStatus.Error]: 'red',
    [FormFieldStatus.Success]: 'green'
  }[status];
};

const StyledContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column'
}));

const LabelContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  '& > *': { marginBottom: 4 }
}));

const StatusTextContainer = styled('div')<FormFieldProps>(
  ({ theme, status: status }) => ({
    // @ts-ignore
    color: theme.color[getThemeColor(status)]
  })
);

export enum FormFieldStatus {
  Error = 'error',
  Success = 'success'
}

export interface FormFieldProps extends BaseProps {
  label?: string;
  rightLabel?: string;
  status?: FormFieldStatus;
  statusText?: string | null;
}

export function FormField({
  label,
  rightLabel,
  status,
  statusText,
  children,
  ...restProps
}: FormFieldProps) {
  return (
    <StyledContainer {...restProps}>
      <LabelContainer>
        {label && <Typography size={1}>{label}</Typography>}
        {rightLabel && <Typography size={1}>{rightLabel}</Typography>}
      </LabelContainer>

      {children}

      <StatusTextContainer status={status}>
        <Typography size={2}>{statusText}</Typography>
      </StatusTextContainer>
    </StyledContainer>
  );
}

export default FormField;
