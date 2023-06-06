import React, { MouseEvent, useRef, useState } from 'react';
import styled from 'styled-components';

import { useClickAway } from '@libs/ui/hooks/use-click-away';
import { BaseProps } from '@libs/ui';
import { AlignedFlexRow, Overlay } from '@libs/layout';

const ChildrenContainer = styled(AlignedFlexRow)`
  cursor: pointer;
`;

const ModalContainer = styled.div`
  position: fixed;
  top: 88px;
  left: 0;
  right: 0;

  padding: 8px;
  margin: 0 16px;

  background-color: ${({ theme }) => theme.color.backgroundPrimary};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04), 0 15px 50px rgba(0, 0, 0, 0.1);
  border-radius: ${({ theme }) => theme.borderRadius.twelve}px;
`;
interface RenderChildrenProps {
  isOpen: boolean;
}

interface RenderContentProps {
  closeModal: (e: MouseEvent<HTMLDivElement>) => void;
}

export interface ModalProps extends BaseProps {
  children: (renderProps: RenderChildrenProps) => React.ReactNode | string;
  renderContent: (renderProps: RenderContentProps) => React.ReactNode | string;
}

export const Modal = ({ children, renderContent }: ModalProps) => {
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
          <ModalContainer ref={clickAwayRef}>
            {renderContent({ closeModal })}
          </ModalContainer>
        </Overlay>
      )}
    </>
  );
};
