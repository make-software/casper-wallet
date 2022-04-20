import React, { HTMLInputTypeAttribute, ReactNode } from 'react';
import styled from 'styled-components';
import { BaseProps, FormField, FormFieldStatus, SvgIcon } from '@src/libs/ui';

const getThemeColorByError = (error?: boolean) => {
  if (error == null || !error) {
    return 'contentSecondary';
  }

  return 'fillRed';
};

const InputContainer = styled('div')<InputProps>(
  ({ theme, disabled, error, monotype }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 16px',
    borderRadius: theme.borderRadius.base,
    color: theme.color.contentPrimary,
    background: theme.color.backgroundPrimary,
    caretColor: theme.color.fillRed,
    fontFamily: monotype
      ? theme.typography.fontFamily.mono
      : theme.typography.fontFamily.primary,
    lineHeight: '2.4rem',
    height: '4rem',

    path: {
      fill: theme.color[getThemeColorByError(error)]
    },

    ...(disabled && {
      opacity: 0.5,
      color: theme.color.contentSecondary
    })
  })
);

const StyledInput = styled('input')<InputProps>(({ theme }) => ({
  background: 'inherit',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: '1.5rem',
  border: 'none',
  width: '100%',
  padding: 0,
  '&[type=number]': {
    '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
      margin: 0,
      '-webkit-appearance': 'none',
      'pointer-events': 'none'
    }
  },
  '::placeholder': {
    color: theme.color.contentSecondary
  }
}));

const PrefixContainer = styled('div')(({ theme }) => ({
  marginRight: 16
}));

const SuffixContainer = styled('div')(({ theme }) => ({
  marginLeft: 16
}));

const SuffixTextContainer = styled(SuffixContainer)(({ theme }) => ({
  color: theme.color.contentSecondary
}));

export enum InputValidationType {
  PositiveInteger = 'positive_int',
  CSPR = 'cspr'
}

export interface InputProps extends BaseProps {
  disabled?: boolean;
  monotype?: boolean;
  placeholder?: string;
  value?: string | number;
  onChange?: (ev: any) => void;
  onFocus?: (ev: any) => void;
  onBlur?: (ev: any) => void;
  onKeyDown?: (ev: any) => void;
  height?: '36' | '40';
  min?: string;
  max?: string;
  step?: string;
  label?: string;
  rightLabel?: string;
  prefixIcon?: ReactNode | null;
  suffixIcon?: ReactNode | null;
  suffixText?: string | null;

  type?: HTMLInputTypeAttribute;
  required?: boolean;
  error?: boolean;
  validationType?: InputValidationType;
  validationText?: string | null;
}

export function Input({
  id,
  className,
  style,
  disabled,
  monotype,
  height,
  label,
  rightLabel,
  prefixIcon,
  suffixIcon,
  suffixText,
  required,
  error,
  validationType,
  validationText,
  onFocus,
  ...restProps
}: InputProps) {
  const validationProps =
    validationType == null
      ? undefined
      : {
          [InputValidationType.CSPR]: {
            type: 'number',
            min: '0',
            max: '0',
            step: '0'
          },
          [InputValidationType.PositiveInteger]: {
            type: 'number',
            min: '1',
            max: '1',
            step: '0'
          }
        }[validationType];

  const handleFocus = (event: any) => {
    event.target.select();
    onFocus && onFocus(event);
  };

  if (error) {
    suffixIcon = <SvgIcon src="assets/icons/ic-error.svg" />;
  }

  return (
    <FormField
      id={id}
      className={className}
      style={style}
      label={label}
      rightLabel={rightLabel}
      status={error ? FormFieldStatus.Error : undefined}
      statusText={validationText}
    >
      <InputContainer
        disabled={disabled}
        monotype={monotype}
        error={error}
        height={height}
      >
        {prefixIcon && <PrefixContainer>{prefixIcon}</PrefixContainer>}

        <StyledInput
          title=""
          disabled={disabled}
          onFocus={handleFocus}
          {...validationProps}
          {...restProps}
        />

        {suffixIcon && <SuffixContainer>{suffixIcon}</SuffixContainer>}

        {suffixText && <SuffixTextContainer>{suffixText}</SuffixTextContainer>}
      </InputContainer>
    </FormField>
  );
}

export default Input;
