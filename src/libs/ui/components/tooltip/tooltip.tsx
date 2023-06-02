import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { Typography } from '@libs/ui';

interface TooltipProps {
  title?: string | null;
  children: React.ReactNode;
  placement?: Placement;
  noWrap?: boolean;
  overflowWrap?: boolean;
  fullWidth?: boolean;
}

type Placement =
  | 'topCenter'
  | 'topLeft'
  | 'bottomCenter'
  | 'topRight'
  | 'bottomRight'
  | 'bottomLeft';

type Ref = HTMLDivElement;

// TODO: Add dynamic positioning based on the content of the tooltip
const TooltipTip = styled.div<{ placement: Placement }>(
  ({ theme, placement }) => ({
    position: 'absolute',

    zIndex: 1,

    ...(placement === 'topCenter' && {
      left: '50%',
      transform: 'translateX(-50%)',
      top: '-45px'
    }),

    ...(placement === 'topLeft' && {
      right: '0',
      top: '-45px'
    }),

    ...(placement === 'topRight' && {
      left: '0',
      top: '-45px'
    }),

    ...(placement === 'bottomCenter' && {
      left: '50%',
      transform: 'translateX(-50%)',
      top: '20px'
    }),

    ...(placement === 'bottomRight' && {
      left: '0',
      top: '20px'
    }),

    ...(placement === 'bottomLeft' && {
      right: '0',
      top: '20px'
    }),

    padding: '8px 16px',

    backgroundColor: `${theme.color.backgroundPrimary}`,
    borderRadius: `${theme.borderRadius.twelve}px`,
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.08)',

    maxWidth: '275px',

    transition: 'opacity 250ms ease-in-out',
    opacity: '0',
    visibility: 'hidden',
    display: 'none'
  })
);

const Container = styled.div<{ fullWidth?: boolean }>`
  position: relative;

  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
`;

const ChildrenContainer = styled.div`
  &:hover + ${TooltipTip} {
    opacity: 1;
    visibility: visible;
    display: block;
  }
`;

export const Tooltip = forwardRef<Ref, TooltipProps>(
  (
    {
      title,
      placement = 'topCenter',
      noWrap,
      overflowWrap,
      children,
      fullWidth
    },
    ref
  ) => {
    if (title == null) {
      return <>{children}</>;
    }

    return (
      <Container ref={ref} fullWidth={fullWidth}>
        <ChildrenContainer>{children}</ChildrenContainer>
        <TooltipTip placement={placement}>
          <Typography
            type="captionRegular"
            noWrap={noWrap}
            overflowWrap={overflowWrap}
          >
            {title}
          </Typography>
        </TooltipTip>
      </Container>
    );
  }
);
