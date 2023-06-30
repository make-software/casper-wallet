import React from 'react';
import styled from 'styled-components';
import { Typography, BaseProps } from '@src/libs/ui';

export enum FormFieldStatus {
  Error = 'error',
  Success = 'success'
}

const getThemeColor = (status?: FormFieldStatus | null) => {
  if (status == null) {
    return 'fillGreyPrimary';
  }

  return {
    [FormFieldStatus.Error]: 'fillRed',
    [FormFieldStatus.Success]: 'fillGreen'
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
  padding: `0 ${theme.padding[1.6]} 0`,
  '& > *': { marginBottom: 8 }
}));

const StatusTextContainer = styled('div')<FormFieldProps>(
  ({ theme, status }) => ({
    // @ts-ignore
    color: theme.color[getThemeColor(status)],
    margin: '4px 0 0 10px'
  })
);

export interface FormFieldProps extends BaseProps {
  label?: string;
  rightLabel?: string | null;
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
        {label && <Typography type="bodySemiBold">{label}</Typography>}
        {rightLabel && <Typography type="body">{rightLabel}</Typography>}
      </LabelContainer>

      {children}

      <StatusTextContainer status={status}>
        <Typography type="formFieldStatus">{statusText}</Typography>
      </StatusTextContainer>
    </StyledContainer>
  );
}
