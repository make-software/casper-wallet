import React from 'react';
import styled from 'styled-components';

import { matchSize, BaseProps, Link } from '@src/libs/ui';

const BaseButton = styled.button<ButtonProps>(
  ({ theme, disabled, height = '24', width = '100%' }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: theme.borderRadius.base,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: matchSize(
      {
        '24': theme.typography.fontWeight.semiBold,
        '36': theme.typography.fontWeight.medium,
        '40': theme.typography.fontWeight.semiBold
      },
      height
    ),
    fontSize: matchSize(
      { '24': '1rem', '36': '1.2rem', '40': '1.4rem' },
      height
    ),
    minHeight: matchSize({ '24': 24, '36': 36, '40': 40 }, height),
    lineHeight: matchSize({ '24': '2rem', '36': '2rem', '40': '2rem' }, height),
    padding: matchSize(
      { '24': '2px 10px', '36': '8px 25px', '40': '10px 30px' },
      height
    ),
    width: matchSize(
      { '100': '100px', '120': '120px', '176': '176px', '100%': '100%' },
      width
    ),

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
      background: theme.color.fillGreyPrimary
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
      background: theme.color.fillGreyPrimary
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
      background: theme.color.fillGreySecondary
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
      background: theme.color.fillGreySecondary
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
      background: theme.color.fillGreyPrimary
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
