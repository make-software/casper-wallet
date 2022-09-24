import React, { PropsWithChildren } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

interface PopoverPortalProps {
  top?: number;
}

const popoverTopOffset = 15;

const PortalContainer = styled.div<PopoverPortalProps>`
  position: absolute;
  right: 16px;
  top: ${({ top }) => (top ? top - popoverTopOffset : 0)}px;
`;

export function PopoverPortal({
  children,
  top
}: PropsWithChildren<PopoverPortalProps>) {
  const popoverRootId = 'popover-root';
  const mountNode = document.querySelector(`#${popoverRootId}`);

  return mountNode != null
    ? createPortal(
        <PortalContainer top={top}>{children}</PortalContainer>,
        mountNode
      )
    : null;
}
