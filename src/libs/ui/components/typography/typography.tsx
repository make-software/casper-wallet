import React, { forwardRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import styled, { CSSObject, DefaultTheme } from 'styled-components';

import { BaseProps } from '@src/libs/ui';

type Ref = HTMLSpanElement | HTMLHeadingElement;

export type TypographyType =
  | 'header'
  | 'body'
  | 'caption'
  | 'label'
  | 'hash'
  | 'form-field-status'; // TODO: Temporary name. Make a better name
export type TypographyWeight = 'regular' | 'medium' | 'semiBold';

export type TextVariation =
  | 'inherit'
  | 'contentPrimary'
  | 'contentSecondary'
  | 'contentTertiary'
  | 'contentOnFill'
  | 'contentBlue'
  | 'contentRed'
  | 'contentGreen'
  | 'contentGreenOnFill';

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
      contentPrimary: theme.color.contentPrimary,
      contentSecondary: theme.color.contentSecondary,
      contentTertiary: theme.color.contentTertiary,
      contentOnFill: theme.color.contentOnFill,
      contentBlue: theme.color.contentBlue,
      contentRed: theme.color.contentRed,
      contentGreen: theme.color.contentGreen,
      contentGreenOnFill: theme.color.contentGreenOnFill
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
          weight === 'regular'
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
          weight === 'regular'
            ? theme.typography.fontWeight.regular
            : theme.typography.fontWeight.semiBold
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
