import React from 'react';
import styled from 'styled-components';

import { BaseProps, Link } from '@src/libs/ui';

const BaseButton = styled.button<ButtonProps>(
  ({ theme, disabled, height = '40', width = '100%' }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: theme.borderRadius.base,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.semiBold,
    fontSize: '1.5rem',
    minHeight: '4rem',
    lineHeight: '2.4rem',
    width,

    ':focus': {
      outline: 'none'
    },

    ...(disabled && {
      pointerEvents: 'none'
    })
  })
);

const PrimaryBlueButton = styled(BaseButton)<ButtonProps>(
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

const PrimaryRedButton = styled(BaseButton)<ButtonProps>(
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

const SecondaryBlueButton = styled(BaseButton)<ButtonProps>(
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

const SecondaryRedButton = styled(BaseButton)<ButtonProps>(
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

const UtilityButton = styled(BaseButton)<ButtonProps>(
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

const COMPONENT_MAP_BY_COLOR = {
  primaryBlue: PrimaryBlueButton,
  primaryRed: PrimaryRedButton,
  secondaryBlue: SecondaryBlueButton,
  secondaryRed: SecondaryRedButton,
  utility: UtilityButton
};

export type ButtonSize = 'small' | 'normal' | 'big';

/* eslint-disable-next-line */
export interface ButtonProps extends BaseProps {
  type?: 'button' | 'submit' | 'reset';
  onClick?: (ev: any) => void;
  color?:
    | 'primaryBlue'
    | 'primaryRed'
    | 'secondaryBlue'
    | 'secondaryRed'
    | 'utility';
  disabled?: boolean;
  displayAsLinkTo?: string;
  height?: '24' | '36' | '40';
  width?: '100' | '120' | '176' | '100%';
}

type Ref = HTMLButtonElement;

export const Button = React.forwardRef<Ref, ButtonProps>(function Button(
  { color = 'primaryBlue', displayAsLinkTo, ...props }: ButtonProps,
  ref
) {
  if (displayAsLinkTo) {
    return (
      <Link
        href={displayAsLinkTo}
        color="primaryRed"
        onClick={ev => {
          ev.preventDefault();
          props.onClick && props.onClick(ev);
        }}
      >
        <UtilityButton>{props.children}</UtilityButton>
      </Link>
    );
  }

  const ButtonComponent = COMPONENT_MAP_BY_COLOR[color] || PrimaryBlueButton;
  return <ButtonComponent ref={ref} color={color} {...props} />;
});

export default Button;
