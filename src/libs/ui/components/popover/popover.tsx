import React, { PropsWithChildren, useEffect } from 'react';
import { ContentRenderer, Popover as TinyPopover } from 'react-tiny-popover';

interface PopoverProps {
  content: ContentRenderer;
  popoverParentRef: React.MutableRefObject<HTMLDivElement | null>;
  children: JSX.Element;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Popover({
  content,
  children,
  popoverParentRef,
  isOpen,
  setIsOpen
}: PropsWithChildren<PopoverProps>) {
  useEffect(() => {
    // Get the container with class "ms-container"
    // (to manage scroll behavior while the popover is open)
    const scrollableContainer = document.querySelector('.ms-container');
    if (scrollableContainer) {
      const style = scrollableContainer.getAttribute('style');
      if (isOpen) {
        scrollableContainer.setAttribute('style', `${style} overflow: hidden;`);
      } else {
        scrollableContainer.setAttribute(
          'style',
          style?.replace('overflow: hidden;', '')!
        );
      }
    }

    return () => {
      if (scrollableContainer) {
        const style = scrollableContainer.getAttribute('style');
        scrollableContainer.setAttribute(
          'style',
          style?.replace('overflow: hidden;', '')!
        );
      }
    };
  }, [isOpen]);

  return (
    <TinyPopover
      isOpen={isOpen}
      onClickOutside={() => setIsOpen(false)}
      positions={['bottom', 'top']}
      containerStyle={{
        zIndex: '15'
      }}
      transform={{ top: 55, left: 135 }}
      parentElement={popoverParentRef.current || undefined}
      content={content}
    >
      {children}
    </TinyPopover>
  );
}
