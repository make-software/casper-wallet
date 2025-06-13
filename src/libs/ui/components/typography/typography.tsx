import React, { forwardRef } from 'react';
import styled, { CSSObject, DefaultTheme } from 'styled-components';

import { Skeleton } from '@libs/ui/components';
import { BaseProps } from '@libs/ui/types';
import { ContentColor, getColorFromTheme } from '@libs/ui/utils';

type Ref = HTMLSpanElement | HTMLHeadingElement;

export type TypographyType =
  | 'header'
  | 'headerBig'
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
  | 'formFieldStatus' // TODO: Temporary name. Make a better name
  | 'subtitle'
  | 'listSubtextHash';

export type CSPRSize = '2.8rem' | '2.4rem' | '2rem' | '1.8rem' | '1.6rem';

export interface BodyStylesProps extends BaseProps {
  color?: ContentColor;
  uppercase?: boolean;
  capitalize?: boolean;
  noWrap?: boolean;
  loading?: boolean;
  wordBreak?: boolean;
  fontSize?: CSPRSize;
  lineHeight?: string;
  ellipsis?: boolean;
  overflowWrap?: boolean;
  translate?: 'yes' | 'no';
  textAlign?: 'center' | 'left' | 'right' | 'inherit';
}

export const getFontSizeBasedOnTextLength = (length: number) => {
  if (length >= 21) {
    return '1.8rem';
  } else if (length >= 16) {
    return '2rem';
  } else if (length >= 13) {
    return '2.4rem';
  } else {
    return '2.8rem';
  }
};

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
    noWrap = false,
    wordBreak = false,
    ellipsis = false,
    overflowWrap = false,
    textAlign
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
    ...(wordBreak && {
      wordBreak: 'break-all'
    }),
    '-webkit-text-size-adjust': '100%',
    ...(ellipsis && {
      display: 'block',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    }),
    ...(overflowWrap && {
      overflowWrap: 'break-word'
    }),
    ...(textAlign && {
      textAlign: textAlign
    })
  };
}

const StyledTypography = styled('span').withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !['loading'].includes(prop) && defaultValidatorFn(prop)
})<TypographyProps>(
  ({ theme, type, fontSize, lineHeight, ...restProps }): CSSObject => {
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
      fontSize: fontSize || '2.8rem',
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
          lineHeight: '2.4rem',
          fontFamily: theme.typography.fontFamily.mono
        };

      case 'labelMedium':
        return {
          ...base,
          fontSize: '1.2rem',
          lineHeight: '1.6rem',
          fontWeight: theme.typography.fontWeight.medium
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

      case 'subtitle':
        return {
          ...captionBase,
          fontSize: fontSize ?? '1.8rem',
          lineHeight: lineHeight ?? '2.4rem',
          fontWeight: theme.typography.fontWeight.bold
        };

      case 'listSubtextHash':
        return {
          ...CSPRBase,
          fontSize: '1.2rem',
          lineHeight: '1.6rem',
          fontWeight: theme.typography.fontWeight.medium
        };

      default:
        throw new Error('Unknown type of Typography');
    }
  }
);

const StyledHeader = styled('h1').withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !['loading'].includes(prop) && defaultValidatorFn(prop)
})<TypographyProps>(({ theme, type, ...props }) => {
  const body = getBodyStyles(theme, props);

  switch (type) {
    case 'header': {
      return {
        ...body,
        fontWeight: theme.typography.fontWeight.bold,
        fontSize: '2.4rem',
        lineHeight: '2.8rem'
      };
    }
    case 'headerBig': {
      return {
        ...body,
        fontWeight: theme.typography.fontWeight.bold,
        fontSize: '2.8rem',
        lineHeight: '3.6rem'
      };
    }
  }
});

export const Typography = forwardRef<Ref, TypographyProps>(function Typography(
  { dataTestId, ...props },
  ref
) {
  const Component =
    props.type !== 'header' && props.type !== 'headerBig'
      ? StyledTypography
      : StyledHeader;

  if (props.loading) {
    return (
      <Component ref={ref as any} {...props}>
        <Skeleton />
      </Component>
    );
  }

  return <Component ref={ref as any} data-testid={dataTestId} {...props} />;
});
