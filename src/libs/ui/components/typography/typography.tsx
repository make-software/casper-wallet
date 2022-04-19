import React, { forwardRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import styled, { CSSObject, DefaultTheme } from 'styled-components';

import { BaseProps } from '@src/libs/ui';

type Ref = HTMLSpanElement | HTMLHeadingElement;

export type TypographyType = 'header' | 'body' | 'caption' | 'label' | 'hash';
export type TypographyWeight = 'regular' | 'medium' | 'semiBold';

export type TextVariation =
  | 'inherit'
  | 'contentBlue'
  | 'contentPrimary'
  | 'contentSecondary'
  | 'contentOnFill';

export interface BodyStylesProps extends BaseProps {
  variation?: TextVariation;
  uppercase?: boolean;
  capitalize?: boolean;
  noWrap?: boolean;
  loading?: boolean;
}

interface TypographyProps extends BodyStylesProps {
  type: TypographyType;
  weight: TypographyWeight;
}

function getBodyStyles(
  theme: DefaultTheme,
  {
    loading,
    variation = 'inherit',
    uppercase = false,
    capitalize = false,
    noWrap = false
  }: BodyStylesProps
): CSSObject {
  return {
    fontFamily: theme.typography.fontFamily.primary,
    color: {
      inherit: 'inherit',
      contentSecondary: theme.color.contentSecondary,
      contentPrimary: theme.color.contentPrimary,
      contentOnFill: theme.color.contentOnFill,
      contentBlue: theme.color.contentBlue
    }[variation],
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
})<TypographyProps>(({ theme, type, weight, ...restProps }): CSSObject => {
  const body = getBodyStyles(theme, restProps);

  switch (type) {
    case 'caption':
      return {
        ...body,
        fontSize: '1.4rem',
        lineHeight: '2.4rem',
        fontWeight:
          weight !== 'regular'
            ? theme.typography.fontWeight.medium
            : theme.typography.fontWeight.regular
      };
    case 'label':
      return {
        ...body,
        fontSize: '1.2rem',
        lineHeight: '1.6rem',
        fontWeight: theme.typography.fontWeight.medium,
        textTransform: 'uppercase'
      };
    case 'hash':
      return {
        ...body,
        fontSize: '1.4rem',
        lineHeight: '1.6rem',
        fontFamily: theme.typography.fontFamily.mono,
        fontWeight: theme.typography.fontWeight.regular
      };
    case 'body':
      return {
        ...body,
        fontSize: '1.5rem',
        lineHeight: '2.4rem',
        fontWeight:
          weight !== 'regular'
            ? theme.typography.fontWeight.semiBold
            : theme.typography.fontWeight.regular
      };
    default:
      throw new Error('Unknown type of Typography');
  }
});

const StyledHeader = styled('h1').withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !['loading'].includes(prop) && defaultValidatorFn(prop)
})<TypographyProps>(({ theme, ...props }) => {
  const body = getBodyStyles(theme, props);
  return {
    ...body,
    fontWeight: theme.typography.fontWeight.semiBold,
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
