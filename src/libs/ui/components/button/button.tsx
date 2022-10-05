import React from 'react';
import styled from 'styled-components';

import { BaseProps, Link } from '@src/libs/ui';

type ButtonVariant = 'inline' | 'fullWidth';

interface BaseButtonProps extends BaseProps {
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  height?: '24' | '36' | '40';
  width?: '100' | '120' | '176' | '100%';
  variant?: ButtonVariant;
}

const BaseButton = styled.button<BaseButtonProps>(
  ({ theme, loading, disabled, height = '40', variant, width = '100%' }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius:
      variant === 'inline'
        ? theme.borderRadius.hundred
        : theme.borderRadius.base,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight:
      variant === 'inline'
        ? theme.typography.fontWeight.medium
        : theme.typography.fontWeight.semiBold,
    fontSize: variant === 'inline' ? '1.4rem' : '1.5rem',
    minHeight: variant === 'inline' ? '3.2rem' : '4rem',
    lineHeight: '2.4rem',
    padding: variant === 'inline' ? '4px 12px' : 'unset',
    width,

    ':focus': {
      outline: 'none'
    },

    ...((disabled || loading) && {
      pointerEvents: 'none'
    })
  })
);

const PrimaryBlueButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, loading, disabled }) => ({
    color: theme.color.backgroundPrimary,
    background: theme.color.fillBlue,

    ': hover': {
      background: theme.color.fillBlueHover
    },
    ': active': {
      background: theme.color.fillBlueClick
    },

    ...((disabled || loading) && {
      color: theme.color.backgroundPrimary,
      background: theme.color.fillTertiary
    })
  })
);

const PrimaryRedButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, loading, disabled }) => ({
    color: theme.color.backgroundPrimary,
    background: theme.color.fillRed,

    ': hover': {
      background: theme.color.fillRedHover
    },
    ': active': {
      background: theme.color.fillRedClick
    },

    ...((disabled || loading) && {
      color: theme.color.backgroundPrimary,
      background: theme.color.fillTertiary
    })
  })
);

const SecondaryBlueButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, loading, disabled }) => ({
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

    ...((disabled || loading) && {
      color: theme.color.contentSecondary,
      background: `linear-gradient(
        ${theme.color.fillGradientOut.from},
        ${theme.color.fillGradientOut.to}
      )`
    })
  })
);

const SecondaryRedButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, loading, disabled }) => ({
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

    ...((disabled || loading) && {
      color: theme.color.contentSecondary,
      background: `linear-gradient(
        ${theme.color.fillGradientOut.from},
        ${theme.color.fillGradientOut.to}
      )`
    })
  })
);

const UtilityButton = styled(BaseButton)<BaseButtonProps>(
  ({ theme, loading, disabled }) => ({
    color: theme.color.backgroundPrimary,
    background: theme.color.fillBlue,

    ': hover': {
      background: theme.color.fillBlueHover
    },
    ': active': {
      background: theme.color.fillBlueClick
    },

    ...((disabled || loading) && {
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
  displayAsLinkTo?: string;
  onClick?: (ev: any) => void;
}

type Ref = HTMLButtonElement;

export const Button = React.forwardRef<Ref, ButtonProps>(function Button(
  {
    color = 'primaryBlue',
    variant = 'fullWidth',
    displayAsLinkTo,
    ...props
  }: ButtonProps,
  ref
) {
  if (displayAsLinkTo) {
    return (
      <Link
        href={displayAsLinkTo}
        color="fillRed"
        onClick={ev => {
          ev.preventDefault();
          props.onClick && props.onClick(ev);
        }}
      >
        <UtilityButton>{props.children}</UtilityButton>
      </Link>
    );
  }

  const ButtonComponent =
    BUTTON_COMPONENT_BY_COLOR_DICT[color] || PrimaryBlueButton;
  return <ButtonComponent ref={ref} variant={variant} {...props} />;
});

export default Button;
