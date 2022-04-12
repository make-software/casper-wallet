import React from 'react';
import styled from 'styled-components';
import { BaseProps } from '../../types';
import { SubtitleText } from '../subtitle-text/subtitle-text';

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
        {label && <SubtitleText size={1}>{label}</SubtitleText>}
        {rightLabel && <SubtitleText size={1}>{rightLabel}</SubtitleText>}
      </LabelContainer>

      {children}

      <StatusTextContainer status={status}>
        <SubtitleText size={2}>{statusText}</SubtitleText>
      </StatusTextContainer>
    </StyledContainer>
  );
}

export default FormField;
