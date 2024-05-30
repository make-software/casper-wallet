import React, { MouseEvent, PropsWithChildren, useRef, useState } from 'react';
import styled from 'styled-components';

import { useClickAway } from '@hooks/use-click-away';

import { AlignedFlexRow, FlexColumn, Overlay, SpacingSize } from '@libs/layout';

const popoverOffsetFromChildren = 8;
const contentHeight = 188;

const ChildrenContainer = styled(AlignedFlexRow)`
  cursor: pointer;
`;

interface PopoverContainerProps {
  domRect?: DOMRect;
}

const PopoverOverlay = styled(Overlay)`
  background: inherit;
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

  background: ${({ theme }) => theme.color.backgroundPrimary};
  box-shadow: ${({ theme }) => theme.shadow.contextMenu};
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
        data-testid="popover-children-container"
        onClick={() => setIsOpen(true)}
      >
        {children}
      </ChildrenContainer>

      {isOpen && (
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
      )}
    </>
  );
}
