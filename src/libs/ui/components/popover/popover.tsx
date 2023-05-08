import React, { useState, useRef, PropsWithChildren, MouseEvent } from 'react';
import styled from 'styled-components';

import { AlignedFlexRow, FlexColumn, SpacingSize } from '@libs/layout';
import { useClickAway } from '@libs/ui/hooks/use-click-away';

import { PopoverPortal } from './popover-portal';

const popoverOffsetFromChildren = 8;
const contentHeight = 188;

const ChildrenContainer = styled(AlignedFlexRow)`
  cursor: pointer;
`;

interface PopoverContainerProps {
  domRect?: DOMRect;
}

const PopoverOverlay = styled.div`
  position: fixed;
  z-index: auto;
  top: 0;
  left: 0;

  height: 100vh;
  width: 100vw;
`;

const PopoverContainer = styled.div<PopoverContainerProps>`
  position: absolute;
  right: 16px;
  top: ${({ domRect }) => {
    if (domRect == null) {
      return '0px';
    }

    const { top, bottom, height } = domRect;

    if (top && bottom) {
      return bottom >= window.innerHeight - contentHeight
        ? `${top - contentHeight}px`
        : `${top + height + popoverOffsetFromChildren}px`;
    }
  }};

  z-index: ${({ theme }) => theme.zIndex.dropdown};
`;

const PopoverItemsContainer = styled(FlexColumn)`
  padding: 8px;

  background: ${({ theme }) => theme.color.fillWhite};
  box-shadow: 0 1px 8px rgba(132, 134, 140, 0.2);
  border-radius: ${({ theme }) => theme.borderRadius.eight}px;
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
  const childrenContainerRef = useRef<HTMLDivElement>(null);

  const { ref: clickAwayRef } = useClickAway({
    callback: (event: MouseEvent<HTMLAnchorElement>) => {
      event.stopPropagation();
      isOpen && setIsOpen(false);
    }
  });

  const closePopover = (e: MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <ChildrenContainer
        ref={childrenContainerRef}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </ChildrenContainer>

      {isOpen && (
        <PopoverPortal>
          <PopoverOverlay>
            <PopoverContainer
              ref={clickAwayRef}
              domRect={childrenContainerRef.current?.getBoundingClientRect()}
            >
              <PopoverItemsContainer gap={SpacingSize.Tiny}>
                {renderMenuItems({ closePopover })}
              </PopoverItemsContainer>
            </PopoverContainer>
          </PopoverOverlay>
        </PopoverPortal>
      )}
    </>
  );
}