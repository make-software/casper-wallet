import React, { forwardRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import styled, { CSSObject, DefaultTheme } from 'styled-components';

import { BaseProps, ContentColor, getColorFromTheme } from '@src/libs/ui';

type Ref = HTMLSpanElement | HTMLHeadingElement;

export type TypographyType =
  | 'header'
  | 'body'
  | 'caption'
  | 'label'
  | 'CSPR'
  | 'form-field-status'; // TODO: Temporary name. Make a better name
export type TypographyWeight =
  | 'regular'
  | 'light'
  | 'medium'
  | 'semiBold'
  | 'bold';

export interface BodyStylesProps extends BaseProps {
  color?: ContentColor;
  uppercase?: boolean;
  capitalize?: boolean;
  monospace?: boolean;
  noWrap?: boolean;
  loading?: boolean;
}

interface TypographyProps extends BodyStylesProps {
  type: TypographyType;
  weight: TypographyWeight;
  asHash?: boolean;
}

function getBodyStyles(
  theme: DefaultTheme,
  {
    loading,
    color = 'inherit',
    uppercase = false,
    capitalize = false,
    noWrap = false
  }: BodyStylesProps
): CSSObject {
  return {
    fontFamily: theme.typography.fontFamily.primary,
    color: getColorFromTheme(theme, color),
    whiteSpace: noWrap ? 'nowrap' : 'initial',
    ...(loading && {
      display: 'inline-block',
      width: '100%'
    }),
    ...(uppercase && {
      textTransform: 'uppercase'
    }),
    ...(capitalize && {
      textTransform: 'capitalize'
    }),
    '-webkit-text-size-adjust': '100%'
  };
}

const StyledTypography = styled('span').withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !['loading'].includes(prop) && defaultValidatorFn(prop)
})<TypographyProps>(
  ({ theme, type, monospace, weight, asHash, ...restProps }): CSSObject => {
    const body = getBodyStyles(theme, restProps);

    switch (type) {
      case 'caption':
        return {
          ...body,
          fontSize: '1.4rem',
          lineHeight: asHash ? '1.6rem' : '2.4rem',
          fontFamily: asHash
            ? theme.typography.fontFamily.mono
            : theme.typography.fontFamily.primary,
          fontWeight:
            weight === 'regular' || asHash
              ? theme.typography.fontWeight.regular
              : theme.typography.fontWeight.medium
        };
      case 'label':
        return {
          ...body,
          fontSize: '1.2rem',
          lineHeight: '1.6rem',
          fontWeight: theme.typography.fontWeight.medium,
          textTransform: 'uppercase'
        };
      case 'body':
        return {
          ...body,
          fontFamily:
            monospace || asHash
              ? theme.typography.fontFamily.mono
              : theme.typography.fontFamily.primary,
          fontSize: '1.5rem',
          lineHeight: '2.4rem',
          fontWeight:
            monospace || asHash
              ? theme.typography.fontWeight.regular
              : weight === 'regular'
              ? theme.typography.fontWeight.regular
              : theme.typography.fontWeight.semiBold
        };
      case 'CSPR':
        return {
          ...body,
          fontFamily: theme.typography.fontFamily.mono,
          fontSize: '2.8rem',
          lineHeight: '4rem',
          fontWeight:
            weight === 'light'
              ? theme.typography.fontWeight.light
              : theme.typography.fontWeight.bold
        };
      case 'form-field-status':
        return {
          ...body,
          fontSize: '1rem',
          lineHeight: '1.2rem'
        };
      default:
        throw new Error('Unknown type of Typography');
    }
  }
);

const StyledHeader = styled('h1').withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !['loading'].includes(prop) && defaultValidatorFn(prop)
})<TypographyProps>(({ theme, ...props }) => {
  const body = getBodyStyles(theme, props);
  return {
    ...body,
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: '2.4rem',
    lineHeight: '2.8rem'
  };
});

export const Typography = forwardRef<Ref, TypographyProps>(function Typography(
  { ...props },
  ref
) {
  const Component = props.type !== 'header' ? StyledTypography : StyledHeader;

  if (props.loading) {
    return (
      <Component ref={ref as any} {...props}>
        <Skeleton />
      </Component>
    );
  }

  return <Component ref={ref as any} {...props} />;
});
