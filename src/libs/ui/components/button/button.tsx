import React from 'react';
import styled from 'styled-components';

import { BaseProps } from '@src/libs/ui';

interface BaseButtonProps extends BaseProps {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  height?: '24' | '36' | '40';
  minWidth?: '86' | '100';
  inline?: boolean;
  title?: string;
  flexWidth?: boolean;
}

const BaseButton = styled.button<BaseButtonProps>(
  ({
    theme,
    disabled,
    height = '40',
    inline = false,
    minWidth,
    flexWidth = false
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
    color: theme.color.backgroundPrimary,
    background: theme.color.fillBlue,

    ': hover': {
      background: theme.color.fillBlueHover
    },
    ': active': {
      background: theme.color.fillBlueClick
    },

    ...(disabled && {
      color: theme.color.backgroundPrimary,
      background: theme.color.fillTertiary
    })
  })
);

const PrimaryRedButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.backgroundPrimary,
    background: theme.color.fillRed,

    ': hover': {
      background: theme.color.fillRedHover
    },
    ': active': {
      background: theme.color.fillRedClick
    },

    ...(disabled && {
      color: theme.color.backgroundPrimary,
      background: theme.color.fillTertiary
    })
  })
);

const SecondaryBlueButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.contentBlue,
    background: `linear-gradient(
      ${theme.color.fillGradientOut.from},
      ${theme.color.fillGradientOut.to}
    )`,

    ': hover': {
      background: `linear-gradient(
        ${theme.color.fillGradientIn.from},
        ${theme.color.fillGradientIn.to}
      )`
    },
    ': active': {
      background: theme.color.fillSecondary
    },

    ...(disabled && {
      color: theme.color.contentSecondary,
      background: `linear-gradient(
        ${theme.color.fillGradientOut.from},
        ${theme.color.fillGradientOut.to}
      )`
    })
  })
);

const SecondaryRedButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.fillRed,
    background: `linear-gradient(
      ${theme.color.fillGradientOut.from},
      ${theme.color.fillGradientOut.to}
    )`,

    ': hover': {
      background: `linear-gradient(
        ${theme.color.fillGradientIn.from},
        ${theme.color.fillGradientIn.to}
      )`
    },
    ': active': {
      background: theme.color.fillSecondary
    },

    ...(disabled && {
      color: theme.color.contentSecondary,
      background: `linear-gradient(
        ${theme.color.fillGradientOut.from},
        ${theme.color.fillGradientOut.to}
      )`
    })
  })
);

const UtilityButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.backgroundPrimary,
    background: theme.color.fillBlue,

    ': hover': {
      background: theme.color.fillBlueHover
    },
    ': active': {
      background: theme.color.fillBlueClick
    },

    ...(disabled && {
      color: theme.color.backgroundPrimary,
      background: theme.color.fillTertiary
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
}

type Ref = HTMLButtonElement;

export const Button = React.forwardRef<Ref, ButtonProps>(function Button(
  {
    color = 'primaryBlue',
    inline = false,
    as,
    dataTestId,
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
      as={as}
      {...props}
    />
  );
});

export default Button;
