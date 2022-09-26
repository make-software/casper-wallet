import React, { useState, useRef, PropsWithChildren, MouseEvent } from 'react';
import styled from 'styled-components';

import { CenteredFlexRow, FlexColumn } from '@libs/layout';
import { useClickAway } from '@libs/ui/hooks/use-click-away';

import { PopoverPortal } from './popover-portal';

const PopoverContainer = styled(CenteredFlexRow)`
  padding: 14px 18px;
  cursor: pointer;
`;

const PopoverItemsContainer = styled(FlexColumn)`
  gap: 12px;

  padding: 16px 20px;

  background: ${({ theme }) => theme.color.fillWhite};
  box-shadow: 0 1px 8px rgba(132, 134, 140, 0.2);
  border-radius: 8px;
`;

interface PopoverContainerProps {
  top?: number;
}

const popoverTopOffset = 15;
const PortalContainer = styled.div<PopoverContainerProps>`
  position: absolute;
  right: 16px;
  top: ${({ top }) => (top ? top - popoverTopOffset : 0)}px;

  z-index: ${({ theme }) => theme.zIndex.dropdown};
`;

type RenderProps = {
  closePopover: (e: MouseEvent<HTMLAnchorElement>) => void;
};

interface PopoverProps {
  renderMenuItems: (renderProps: RenderProps) => JSX.Element;
}

export function Popover({
  renderMenuItems,
  children
}: PropsWithChildren<PopoverProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverContainerRef = useRef<HTMLDivElement>(null);

  const { ref } = useClickAway({
    callback: () => isOpen && setIsOpen(false)
  });

  const closePopover = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <PopoverContainer
        ref={popoverContainerRef}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </PopoverContainer>

      {isOpen && (
        <PopoverPortal>
          <PortalContainer
            ref={ref}
            top={popoverContainerRef.current?.getBoundingClientRect().top}
          >
            <PopoverItemsContainer>
              {renderMenuItems({ closePopover })}
            </PopoverItemsContainer>
          </PortalContainer>
        </PopoverPortal>
      )}
    </>
  );
}
