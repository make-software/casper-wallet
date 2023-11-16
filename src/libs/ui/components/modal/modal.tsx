import React, { MouseEvent, useRef, useState } from 'react';
import styled from 'styled-components';

import { useClickAway } from '@libs/ui/hooks/use-click-away';
import { BaseProps } from '@libs/ui';
import { AlignedFlexRow, Overlay } from '@libs/layout';

const ChildrenContainer = styled(AlignedFlexRow)`
  cursor: pointer;
`;

const ModalContainer = styled.div<{ placement: 'top' | 'bottom' }>(
  ({ theme, placement }) => ({
    position: 'fixed',
    top: placement === 'top' ? '88px' : undefined,
    bottom: placement === 'bottom' ? '16px' : undefined,
    left: 0,
    right: 0,

    margin: '0 16px',

    maxWidth: '328px',

    backgroundColor: theme.color.backgroundPrimary,
    boxShadow: theme.shadow.contextMenu,
    borderRadius: `${theme.borderRadius.twelve}px`
  })
);

interface RenderChildrenProps {
  isOpen: boolean;
}

interface RenderContentProps {
  closeModal: (e: MouseEvent<HTMLDivElement>) => void;
}

export interface ModalProps extends BaseProps {
  children: (renderProps: RenderChildrenProps) => React.ReactNode | string;
  renderContent: (renderProps: RenderContentProps) => React.ReactNode | string;
  placement: 'top' | 'bottom';
}

export const Modal = ({ children, renderContent, placement }: ModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const childrenContainerRef = useRef<HTMLDivElement>(null);

  const { ref: clickAwayRef } = useClickAway({
    callback: event => {
      event.stopPropagation();
      isOpen && setIsOpen(false);
    }
  });

  const closeModal = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <ChildrenContainer
        ref={childrenContainerRef}
        onClick={event => {
          event.stopPropagation();
          setIsOpen(true);
        }}
      >
        {children({ isOpen })}
      </ChildrenContainer>

      {isOpen && (
        <Overlay>
          <ModalContainer ref={clickAwayRef} placement={placement}>
            {renderContent({ closeModal })}
          </ModalContainer>
        </Overlay>
      )}
    </>
  );
};
