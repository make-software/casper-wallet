import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { Typography } from '@libs/ui';

interface TooltipProps {
  title?: string | null;
  children: React.ReactNode;
  placement?: Placement;
}

type Placement = 'center' | 'topLeft';

type Ref = HTMLDivElement;

const TooltipTip = styled.div<{ placement: Placement }>(
  ({ theme, placement }) => ({
    position: 'absolute',

    ...(placement === 'center' && {
      left: '50%',
      transform: 'translateX(-50%)',
      top: '-45px'
    }),

    ...(placement === 'topLeft' && {
      right: '0',
      top: '-45px'
    }),

    padding: '8px 16px',

    backgroundColor: `${theme.color.backgroundPrimary}`,
    borderRadius: `${theme.borderRadius.twelve}px`,
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.08)',

    transition: 'opacity 250ms ease-in-out',
    opacity: '0',
    visibility: 'hidden'
  })
);

const Container = styled.div`
  position: relative;
`;

const ChildrenContainer = styled.div`
  &:hover + ${TooltipTip} {
    opacity: 1;
    visibility: visible;
  }
`;

export const Tooltip = forwardRef<Ref, TooltipProps>(
  ({ title, placement = 'center', children }, ref) => {
    if (title == null) {
      return <>{children}</>;
    }

    return (
      <Container ref={ref}>
        <ChildrenContainer>{children}</ChildrenContainer>
        <TooltipTip placement={placement}>
          <Typography type="captionRegular" noWrap>
            {title}
          </Typography>
        </TooltipTip>
      </Container>
    );
  }
);
