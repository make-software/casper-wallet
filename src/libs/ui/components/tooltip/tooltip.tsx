import React, { forwardRef } from 'react';
import styled from 'styled-components';

import { Typography } from '@libs/ui';

interface TooltipProps {
  title?: string | null;
  children: React.ReactNode;
}

type Ref = HTMLDivElement;

const TooltipTip = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: -45px;

  padding: 8px 16px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);

  transition: opacity 250ms ease-in-out;
  opacity: 0;
`;

const Container = styled.div`
  position: relative;
`;

const ChildrenContainer = styled.div`
  &:hover + ${TooltipTip} {
    opacity: 1;
  }
`;

export const Tooltip = forwardRef<Ref, TooltipProps>(
  ({ title, children }, ref) => {
    if (title == null) {
      return <>{children}</>;
    }

    return (
      <Container ref={ref}>
        <ChildrenContainer>{children}</ChildrenContainer>
        <TooltipTip>
          <Typography type="captionRegular" noWrap>
            {title}
          </Typography>
        </TooltipTip>
      </Container>
    );
  }
);
