import React from 'react';
import styled from 'styled-components';
import Skeleton from 'react-loading-skeleton';

import { BaseProps } from '../../types';

type Ref = HTMLSpanElement;

export type TextVariation =
  | 'inherit'
  | 'gray'
  | 'white'
  | 'contentViolet'
  | 'lightGray'
  | 'darkGray'
  | 'black'
  | 'blue'
  | 'red';

/* eslint-disable-next-line */
export interface TextProps extends BaseProps {
  variation?: TextVariation;
  monotype?: boolean;
  uppercase?: boolean;
  capitalize?: boolean;
  noWrap?: boolean;
  loading?: boolean;
}

const StyledText = styled('span').withConfig({
  shouldForwardProp: (prop, defaultValidatorFn) =>
    !['loading'].includes(prop) && defaultValidatorFn(prop)
})<TextProps>(
  ({
    theme,
    loading,
    variation = 'inherit',
    monotype = false,
    noWrap = false,
    uppercase = false,
    capitalize = false
  }) => ({
    fontFamily: monotype
      ? theme.typography.fontFamily.mono
      : theme.typography.fontFamily.primary,
    fontWeight: monotype
      ? theme.typography.fontWeight.regular
      : theme.typography.fontWeight.medium,
    color: {
      inherit: 'inherit',
      lightGray: theme.color.gray3,
      contentViolet: theme.color.contentViolet,
      gray: theme.color.gray4,
      darkGray: theme.color.gray5,
      black: theme.color.black,
      white: theme.color.white,
      blue: theme.color.blue,
      red: theme.color.red
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
  })
);

export const Text = React.forwardRef<Ref, TextProps>(function Text(
  { ...props }: TextProps,
  ref
) {
  if (props.loading) {
    return (
      <StyledText ref={ref} {...props}>
        <Skeleton />
      </StyledText>
    );
  }

  return <StyledText ref={ref} {...props} />;
});

export default Text;
