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
    color: theme.color.white,
    background: theme.color.blue0,

    ': hover': {
      background: theme.color.blue2
    },
    ': active': {
      background: theme.color.blue3
    },

    ...(disabled && {
      color: theme.color.gray4,
      background: theme.color.gray1
    })
  })
);

const PrimaryRedButton = styled(BaseButton)<ButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.white,
    background: theme.color.red0,

    ': hover': {
      background: theme.color.red1
    },
    ': active': {
      background: theme.color.red2
    },

    ...(disabled && {
      color: theme.color.gray4,
      background: theme.color.gray1
    })
  })
);

const SecondaryBlueButton = styled(BaseButton)<ButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.blue0,
    background: theme.color.gray1,
    border: `1px solid ${theme.color.gray3}`,

    ': hover': {
      background: theme.color.blue2,
      borderColor: 'transparent'
    },
    ': active': {
      background: theme.color.blue3,
      borderColor: 'transparent'
    },

    ...(disabled && {
      color: theme.color.gray4,
      background: theme.color.white
    })
  })
);

const SecondaryRedButton = styled(BaseButton)<ButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.red0,
    background: theme.color.gray1,
    border: `1px solid ${theme.color.gray3}`,

    ': hover': {
      background: theme.color.red1,
      border: '1px solid transparent'
    },
    ': active': {
      background: theme.color.red2,
      border: '1px solid transparent'
    },

    ...(disabled && {
      color: theme.color.gray4,
      background: theme.color.white
    })
  })
);

const UtilityButton = styled(BaseButton)<ButtonProps>(
  ({ theme, disabled }) => ({
    color: theme.color.red0,
    background: theme.color.gray1,

    ': hover': {
      background: theme.color.red1
    },
    ': active': {
      background: theme.color.red2
    },

    ...(disabled && {
      color: theme.color.gray4,
      background: theme.color.white
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
