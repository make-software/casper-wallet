import React, { MouseEvent, useRef, useState } from 'react';
import styled from 'styled-components';

import { useClickAway } from '@hooks/use-click-away';

import { AlignedFlexRow, Overlay } from '@libs/layout';
import { BaseProps } from '@libs/ui/types';

const ChildrenContainer = styled(AlignedFlexRow)`
  cursor: pointer;
`;

const ModalContainer = styled.div<{
  placement: 'top' | 'bottom' | 'fullBottom';
}>(({ theme, placement }) => ({
  position: 'fixed',

  margin: '0 16px',

  maxWidth: '328px',

  ...(placement === 'fullBottom' && {
    bottom: 0,

    margin: 0,
    maxWidth: '360px'
  }),

  ...(placement === 'top' && {
    top: '88px'
  }),

  ...(placement === 'bottom' && {
    bottom: '16px'
  }),

  left: 0,
  right: 0,

  backgroundColor: theme.color.backgroundPrimary,
  boxShadow: theme.shadow.contextMenu,
  borderRadius:
    placement === 'fullBottom'
      ? `${theme.borderRadius.sixteen}px`
      : `${theme.borderRadius.twelve}px`
}));

interface RenderChildrenProps {
  isOpen: boolean;
}

interface RenderContentProps {
  closeModal: (e: MouseEvent) => void;
}

export interface ModalProps extends BaseProps {
  children: (renderProps: RenderChildrenProps) => React.ReactNode | string;
  renderContent: (renderProps: RenderContentProps) => React.ReactNode | string;
  dataTestId?: string;
  placement: 'top' | 'bottom' | 'fullBottom';
}

export const Modal = ({
  children,
  renderContent,
  placement,
  dataTestId
}: ModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const childrenContainerRef = useRef<HTMLDivElement>(null);

  const { ref: clickAwayRef } = useClickAway({
    callback: event => {
      event.stopPropagation();
      isOpen && setIsOpen(false);
    }
  });

  const closeModal = (e: MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <ChildrenContainer
        ref={childrenContainerRef}
        data-testid={dataTestId}
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
