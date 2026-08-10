import React, { type JSX, PropsWithChildren, useEffect } from 'react';
import { ContentRenderer, Popover as TinyPopover } from 'react-tiny-popover';

interface PopoverProps {
  content: ContentRenderer;
  popoverParentRef: React.MutableRefObject<HTMLDivElement | null>;
  children: JSX.Element;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAllAccountsPage?: boolean;
}

export function Popover({
  content,
  children,
  popoverParentRef,
  isOpen,
  setIsOpen,
  isAllAccountsPage = false
}: PropsWithChildren<PopoverProps>) {
  useEffect(() => {
    // Manage scroll on the mac-scrollbar container while the popover is open.
    // Use the CSSOM `style` property (not an inline style-attribute write) so
    // this is not subject to the nonce-based style-src CSP (WALLET-1343).
    const scrollableContainer =
      document.querySelector<HTMLElement>('.ms-container');
    if (!scrollableContainer) {
      return;
    }

    scrollableContainer.style.overflow = isOpen ? 'hidden' : '';

    return () => {
      scrollableContainer.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <TinyPopover
      isOpen={isOpen}
      onClickOutside={() => setIsOpen(false)}
      positions={['bottom', 'top']}
      containerStyle={
        isAllAccountsPage
          ? undefined
          : {
              zIndex: '15'
            }
      }
      transform={isAllAccountsPage ? undefined : { top: 55, left: 135 }}
      parentElement={
        isAllAccountsPage ? undefined : popoverParentRef.current || undefined
      }
      content={content}
    >
      {children}
    </TinyPopover>
  );
}
