import React from 'react';
import styled from 'styled-components';

import { BaseProps, getLinearGradientColor } from '@libs/ui';

interface BaseButtonProps extends BaseProps {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  height?: '24' | '36' | '40';
  minWidth?: '86' | '100';
  inline?: boolean;
  title?: string;
  flexWidth?: boolean;
  circle?: boolean;
}

const BaseButton = styled.button<BaseButtonProps>(
  ({
    theme,
    disabled,
    inline = false,
    minWidth,
    flexWidth = false,
    circle = false
  }) => ({
    display: 'flex',
    ...(flexWidth ? { flex: 1 } : {}),
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: inline ? theme.borderRadius.hundred : theme.borderRadius.base,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: inline
      ? theme.typography.fontWeight.medium
      : theme.typography.fontWeight.semiBold,
    fontSize: inline ? '1.4rem' : '1.5rem',
    minHeight: inline ? '3.2rem' : '4rem',
    lineHeight: '2.4rem',
    padding: inline ? '4px 12px' : 'unset',
    minWidth: minWidth ? `${minWidth}px` : undefined,

    ...(circle && {
      borderRadius: '24px',
      padding: '12px'
    }),

    ':focus': {
      outline: 'none'
    },

    ':hover': {
      cursor: 'pointer'
    },

    ...(disabled && {
      pointerEvents: 'none'
    })
  })
);

const PrimaryBlueButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.contentOnFill,
    background: theme.color.fillPrimary,

    ': hover': {
      background: theme.color.fillPrimaryHover
    },
    ': active': {
      background: theme.color.fillPrimaryClick
    },

    ...(disabled && {
      color: theme.color.contentDisabled,
      background: getLinearGradientColor(theme.color.fillSecondary)
    })
  })
);

const PrimaryRedButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.contentOnFill,
    background: theme.color.fillCritical,

    ': hover': {
      background: theme.color.fillCriticalHover
    },
    ': active': {
      background: theme.color.fillCriticalClick
    },

    ...(disabled && {
      color: theme.color.contentDisabled,
      background: getLinearGradientColor(theme.color.fillSecondary)
    })
  })
);

const SecondaryBlueButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.contentAction,
    background: getLinearGradientColor(theme.color.fillSecondary),

    ': hover': {
      background: getLinearGradientColor(theme.color.fillSecondaryHover)
    },
    ': active': {
      background: theme.color.fillNeutral
    },

    ...(disabled && {
      color: theme.color.contentSecondary,
      background: getLinearGradientColor(theme.color.fillSecondary)
    })
  })
);

const SecondaryRedButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.fillCritical,
    background: getLinearGradientColor(theme.color.fillSecondary),

    ': hover': {
      background: getLinearGradientColor(theme.color.fillSecondaryHover)
    },
    ': active': {
      background: theme.color.fillNeutral
    },

    ...(disabled && {
      color: theme.color.contentSecondary,
      background: getLinearGradientColor(theme.color.fillSecondary)
    })
  })
);

const UtilityButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.contentOnFill,
    background: theme.color.fillPrimary,

    ': hover': {
      background: theme.color.fillPrimaryHover
    },
    ': active': {
      background: theme.color.fillPrimaryClick
    },

    ...(disabled && {
      color: theme.color.contentDisabled,
      background: getLinearGradientColor(theme.color.fillSecondary)
    })
  })
);

const BUTTON_COMPONENT_BY_COLOR_DICT = {
  primaryBlue: PrimaryBlueButton,
  primaryRed: PrimaryRedButton,
  secondaryBlue: SecondaryBlueButton,
  secondaryRed: SecondaryRedButton,
  utility: UtilityButton
};

export interface ButtonProps extends BaseButtonProps {
  // TODO: change color to variant, and remove variant prop, using width is enough
  color?:
    | 'primaryBlue'
    | 'primaryRed'
    | 'secondaryBlue'
    | 'secondaryRed'
    | 'utility';
  as?: (props: any) => JSX.Element;
  onClick?: (ev: any) => void;
  circle?: boolean;
}

type Ref = HTMLButtonElement;

export const Button = React.forwardRef<Ref, ButtonProps>(function Button(
  {
    color = 'primaryBlue',
    inline = false,
    as,
    dataTestId,
    circle,
    ...props
  }: ButtonProps,
  ref
) {
  const ButtonComponent =
    BUTTON_COMPONENT_BY_COLOR_DICT[color] || PrimaryBlueButton;

  return (
    <ButtonComponent
      ref={ref}
      inline={inline}
      data-testid={dataTestId}
      circle={circle}
      as={as}
      {...props}
    />
  );
});
