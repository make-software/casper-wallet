import React from 'react';
import styled from 'styled-components';

type Ref = HTMLAnchorElement;

export interface PopoverLinkProps extends React.HTMLAttributes<Ref> {
  href?: string;
  target?: string;
  variant: 'contentAction';
}

const BaseLink = styled.a<PopoverLinkProps>(() => ({
  display: 'flex',
  alignItems: 'center',

  textDecoration: 'none',
  cursor: 'pointer',

  padding: '8px'
}));

const BlueLink = styled(BaseLink)<PopoverLinkProps>(({ theme }) => ({
  color: 'inherit',
  backgroundColor: 'inherit',

  '&:hover': {
    color: theme.color.contentAction,
    backgroundColor: theme.color.backgroundSecondary,
    borderRadius: theme.borderRadius.base
  },

  '&:hover svg': {
    color: theme.color.contentAction
  }
}));

const LINK_COMPONENT_BY_COLOR_DICT = {
  contentAction: BlueLink
};

export const PopoverLink = React.forwardRef<Ref, PopoverLinkProps>(
  (props, ref) => {
    const LinkComponent = LINK_COMPONENT_BY_COLOR_DICT[props.variant];

    return <LinkComponent ref={ref} target={props.target} {...props} />;
  }
);
