import React, { HTMLInputTypeAttribute, ReactNode } from 'react';
import styled from 'styled-components';

import { BaseProps, FormField, FormFieldStatus } from '@src/libs/ui';
import { truncateKey } from '@libs/ui/components/hash/utils';

type Ref = HTMLInputElement;

const getThemeColorByError = (error?: boolean) => {
  if (error == null || !error) {
    return 'contentTertiary';
  }

  return 'fillRed';
};

const InputContainer = styled('div')<InputProps>(
  ({ theme, oneColoredIcons, disabled, error, monotype, readOnly }) => ({
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
    fontSize: '1.4rem',
    lineHeight: '2.4rem',
    height: '4rem',

    path: {
      fill: oneColoredIcons
        ? theme.color.contentTertiary
        : theme.color[getThemeColorByError(error)]
    },

    ...((disabled || readOnly) && {
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
  outline: 'none',
  '&[type=number]': {
    '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
      margin: 0,
      '-webkit-appearance': 'none',
      'pointer-events': 'none'
    }
  },
  '&[type=file]': {
    display: 'flex',
    cursor: 'pointer',
    color: theme.color.contentSecondary,
    height: 'auto',
    lineHeight: '40px'
  },
  '&[type=file]::file-selector-button': {
    opacity: '0',
    width: '0',
    padding: '0',
    border: '0'
  },
  '::placeholder': {
    color: theme.color.contentSecondary
  },
  // Hiding the password reveal button in the MS Edge
  // https://github.com/make-software/casper-wallet/issues/547
  '::-ms-reveal': {
    display: 'none'
  },
  '::-webkit-calendar-picker-indicator': {
    // Important flag needed because of the specificity of the CSS selector
    display: 'none !important'
  }
}));

const PrefixContainer = styled('div')(({ theme }) => ({
  marginRight: 8
}));

const SuffixContainer = styled('div')(({ theme }) => ({
  marginLeft: 8
}));

const SuffixTextContainer = styled(SuffixContainer)(({ theme }) => ({
  color: theme.color.contentSecondary
}));

export enum InputValidationType {
  Password = 'password'
}

export interface InputProps extends BaseProps {
  accept?: string;
  disabled?: boolean;
  readOnly?: boolean;
  monotype?: boolean;
  placeholder?: string;
  value?: string | number;
  onChange?: (ev: any) => void;
  onFocus?: (ev: any) => void;
  onBlur?: (ev: any) => void;
  onKeyDown?: (ev: any) => void;
  height?: '36' | '40';
  min?: string | number;
  max?: string | number;
  maxLength?: number;
  pattern?: string;
  minLength?: number;
  name?: string;
  step?: string;
  label?: string;
  rightLabel?: string;
  prefixIcon?: ReactNode | null;
  suffixIcon?: ReactNode | null;
  // TODO: make a better name 🙈
  oneColoredIcons?: boolean;
  suffixText?: string | null | ReactNode;

  type?: HTMLInputTypeAttribute;
  required?: boolean;
  error?: boolean;
  validationType?: InputValidationType;
  validationText?: string | null;
  dataTestId?: string;
  listOptions?: string[];
  listId?: string;
}

export const Input = React.forwardRef<Ref, InputProps>(function Input(
  {
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
    oneColoredIcons,
    onFocus,
    dataTestId,
    readOnly,
    listOptions,
    listId,
    ...restProps
  }: InputProps,
  ref
) {
  const validationProps =
    validationType == null
      ? undefined
      : {
          [InputValidationType.Password]: {
            type: 'password',
            min: '12',
            max: '0',
            step: '0'
          }
        }[validationType];

  const handleFocus = (event: any) => {
    event.target.select();
    onFocus && onFocus(event);
  };

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
        readOnly={readOnly}
        monotype={monotype}
        error={error}
        height={height}
        oneColoredIcons={oneColoredIcons}
      >
        {prefixIcon && <PrefixContainer>{prefixIcon}</PrefixContainer>}

        <StyledInput
          {...validationProps}
          {...restProps}
          ref={ref}
          onFocus={handleFocus}
          data-testid={dataTestId}
          readOnly={readOnly}
          list={listId}
        />

        {listId && (
          <datalist id={listId}>
            {listOptions?.map(value => (
              <option value={value} key={value}>
                {truncateKey(value, { size: 'small' })}
              </option>
            ))}
          </datalist>
        )}

        {suffixIcon && <SuffixContainer>{suffixIcon}</SuffixContainer>}

        {suffixText && <SuffixTextContainer>{suffixText}</SuffixTextContainer>}
      </InputContainer>
    </FormField>
  );
});

export default Input;
