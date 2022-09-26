import React, { forwardRef } from 'react';
import Skeleton from 'react-loading-skeleton';
import styled, { CSSObject, DefaultTheme } from 'styled-components';

import { BaseProps, ContentColor, getColorFromTheme } from '@src/libs/ui';

type Ref = HTMLSpanElement | HTMLHeadingElement;

export type TypographyType =
  | 'header'
  | 'body'
  | 'bodySemiBold'
  | 'bodyHash'
  | 'captionRegular'
  | 'captionMedium'
  | 'captionHash'
  | 'labelMedium'
  | 'CSPRLight'
  | 'CSPRBold'
  | 'listSubtext'
  | 'formFieldStatus'; // TODO: Temporary name. Make a better name

export interface BodyStylesProps extends BaseProps {
  color?: ContentColor;
  uppercase?: boolean;
  capitalize?: boolean;
  noWrap?: boolean;
  loading?: boolean;
}

interface TypographyProps extends BodyStylesProps {
  type: TypographyType;
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
})<TypographyProps>(({ theme, type, ...restProps }): CSSObject => {
  const base = getBodyStyles(theme, restProps);

  const bodyBase = {
    ...base,
    fontSize: '1.5rem',
    lineHeight: '2.4rem',
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.regular
  };

  const captionBase = {
    ...base,
    fontSize: '1.4rem',
    lineHeight: '2.4rem',
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.regular
  };

  const CSPRBase = {
    ...base,
    fontFamily: theme.typography.fontFamily.mono,
    fontSize: '2.8rem',
    lineHeight: '4rem'
  };

  switch (type) {
    case 'captionRegular':
      return captionBase;

    case 'captionMedium':
      return {
        ...captionBase,
        fontWeight: theme.typography.fontWeight.medium
      };

    case 'captionHash':
      return {
        ...captionBase,
        lineHeight: '1.6rem',
        fontFamily: theme.typography.fontFamily.mono
      };

    case 'labelMedium':
      return {
        ...base,
        fontSize: '1.2rem',
        lineHeight: '1.6rem',
        fontWeight: theme.typography.fontWeight.medium,
        textTransform: 'uppercase'
      };
    case 'body':
      return bodyBase;

    case 'bodySemiBold':
      return {
        ...bodyBase,
        fontWeight: theme.typography.fontWeight.semiBold
      };

    case 'bodyHash':
      return {
        ...bodyBase,
        fontFamily: theme.typography.fontFamily.mono
      };

    case 'CSPRLight':
      return {
        ...CSPRBase,
        fontWeight: theme.typography.fontWeight.light
      };

    case 'CSPRBold':
      return {
        ...CSPRBase,
        fontWeight: theme.typography.fontWeight.bold
      };

    case 'listSubtext':
      return {
        ...base,
        fontSize: '1.2rem',
        lineHeight: '1.6rem'
      };

    case 'formFieldStatus':
      return {
        ...base,
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
