import React, { MouseEvent, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';

import { useClickAway } from '@hooks/use-click-away';

import { AlignedFlexRow, Overlay } from '@libs/layout';
import { BaseProps } from '@libs/ui/types';

const ChildrenContainer = styled(AlignedFlexRow)`
  cursor: pointer;
`;

const slideInFromBottom = keyframes`
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
`;

const slideOutToBottom = keyframes`
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(100%);
  }
`;

const ModalContainer = styled.div<{
  placement: 'top' | 'bottom' | 'fullBottom';
}>(({ theme, placement }) => ({
  position: 'absolute',

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

const ModalEnterFromBottom = styled(ModalContainer)`
  animation: ${slideInFromBottom} 0.5s linear forwards;
`;

const ModalExitToBottom = styled(ModalContainer)`
  animation: ${slideOutToBottom} 0.5s linear forwards;
`;

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
  loading?: boolean;
  childrenFlexGrow?: number;
}

export const Modal = ({
  children,
  renderContent,
  placement,
  dataTestId,
  loading,
  childrenFlexGrow
}: ModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const childrenContainerRef = useRef<HTMLDivElement>(null);

  const { ref: clickAwayRef } = useClickAway({
    callback: event => {
      event.stopPropagation();
      setIsExiting(true);

      if (placement === 'top') {
        setIsOpen(false);
        setIsExiting(false);
      } else {
        // After animation completes, set isOpen to false
        setTimeout(() => {
          setIsOpen(false);
          setIsExiting(false);
        }, 500);
      }
    }
  });

  const closeModal = (e: MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);

    if (placement === 'top') {
      setIsOpen(false);
      setIsExiting(false);
    } else {
      // After animation completes, set isOpen to false
      setTimeout(() => {
        setIsOpen(false);
        setIsExiting(false);
      }, 500);
    }
  };

  let ModalComponent;

  if (placement === 'top') {
    ModalComponent = ModalContainer;
  } else {
    ModalComponent = isExiting ? ModalExitToBottom : ModalEnterFromBottom;
  }

  return (
    <>
      <ChildrenContainer
        ref={childrenContainerRef}
        data-testid={dataTestId}
        flexGrow={childrenFlexGrow}
        onClick={event => {
          if (loading) return;
          event.stopPropagation();
          setIsOpen(true);
        }}
      >
        {children({ isOpen })}
      </ChildrenContainer>

      {isOpen && (
        <Overlay>
          <ModalComponent ref={clickAwayRef} placement={placement}>
            {renderContent({ closeModal })}
          </ModalComponent>
        </Overlay>
      )}
    </>
  );
};
